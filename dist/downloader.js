"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = void 0;
const axios = __importStar(require("axios"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const events_1 = require("events");
const types_1 = require("./types");
const config_1 = require("./config");
class Downloader extends events_1.EventEmitter {
    constructor(options, config) {
        super();
        this.abortControllers = [];
        this.stateFile = '';
        this.state = null;
        this.speedInterval = null;
        this.lastDownloaded = 0;
        this.paused = false;
        this.config = config;
        let outputPath = options.output || this.getFilenameFromUrl(options.url);
        if (options.output && !path.extname(options.output)) {
            const filename = this.extractFilename(options.url);
            outputPath = path.join(options.output, filename);
        }
        this.task = {
            id: this.generateId(options.url),
            url: options.url,
            output: outputPath,
            threads: options.threads || config.defaultThreads,
            resume: options.resume ?? true,
            speedLimit: options.speedLimit || config.defaultSpeedLimit,
            headers: options.headers || {},
            status: types_1.DownloadStatus.Pending,
            progress: 0,
            totalSize: 0,
            downloadedSize: 0,
            speed: 0,
            startTime: 0,
        };
    }
    generateId(url) {
        return crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    }
    extractFilename(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            return pathname.split('/').pop() || 'download';
        }
        catch {
            return 'download';
        }
    }
    getFilenameFromUrl(url) {
        return path.join(this.config.defaultOutput, this.extractFilename(url));
    }
    getTask() {
        return { ...this.task };
    }
    async start() {
        this.task.status = types_1.DownloadStatus.Downloading;
        this.task.startTime = Date.now();
        this.emit('start', this.task);
        try {
            const tempDir = await (0, config_1.ensureTempDir)();
            this.stateFile = path.join(tempDir, `${this.task.id}.json`);
            const contentLength = await this.getContentLength();
            this.task.totalSize = contentLength;
            if (this.task.resume && await fs.pathExists(this.stateFile)) {
                await this.loadState();
            }
            else {
                await this.initializeChunks(contentLength);
            }
            await this.downloadChunks();
            if (!this.paused) {
                await this.mergeChunks();
                await this.cleanup();
                this.task.status = types_1.DownloadStatus.Completed;
                this.task.endTime = Date.now();
                this.emit('complete', this.task);
            }
        }
        catch (error) {
            if (!this.paused) {
                this.task.status = types_1.DownloadStatus.Failed;
                this.task.error = error instanceof Error ? error.message : String(error);
                this.emit('error', this.task, error);
            }
        }
        finally {
            this.stopSpeedMonitor();
        }
    }
    async getContentLength() {
        const response = await axios.default.head(this.task.url, {
            headers: this.task.headers,
        });
        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        if (!contentLength) {
            throw new Error('Unable to determine file size. Server may not support range requests.');
        }
        return contentLength;
    }
    async initializeChunks(totalSize) {
        const tempDir = await (0, config_1.ensureTempDir)();
        const chunkSize = Math.ceil(totalSize / this.task.threads);
        const chunks = [];
        for (let i = 0; i < this.task.threads; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize - 1, totalSize - 1);
            if (start <= end) {
                chunks.push({
                    start,
                    end,
                    downloaded: 0,
                    file: path.join(tempDir, `${this.task.id}.part${i}`),
                });
            }
        }
        this.state = {
            url: this.task.url,
            output: this.task.output,
            totalSize,
            chunks,
            startTime: Date.now(),
            headers: this.task.headers,
        };
        await this.saveState();
    }
    async loadState() {
        this.state = await fs.readJson(this.stateFile);
        this.task.totalSize = this.state.totalSize;
        const totalDownloaded = this.state.chunks.reduce((sum, chunk) => sum + chunk.downloaded, 0);
        this.task.downloadedSize = totalDownloaded;
        this.updateProgress();
    }
    async saveState() {
        if (this.state) {
            await fs.writeJson(this.stateFile, this.state, { spaces: 2 });
        }
    }
    async downloadChunks() {
        if (!this.state)
            return;
        this.startSpeedMonitor();
        const promises = this.state.chunks.map((chunk, index) => this.downloadChunk(chunk, index));
        await Promise.all(promises);
    }
    async downloadChunk(chunk, _index) {
        if (chunk.downloaded >= (chunk.end - chunk.start + 1)) {
            return;
        }
        const startByte = chunk.start + chunk.downloaded;
        const endByte = chunk.end;
        const controller = new AbortController();
        this.abortControllers.push(controller);
        const range = `bytes=${startByte}-${endByte}`;
        try {
            const response = await axios.default({
                method: 'get',
                url: this.task.url,
                headers: {
                    ...this.task.headers,
                    Range: range,
                },
                responseType: 'stream',
                signal: controller.signal,
                timeout: 0,
            });
            const writer = fs.createWriteStream(chunk.file, {
                flags: 'a',
                start: chunk.downloaded,
            });
            let lastSave = Date.now();
            let downloadedThisChunk = chunk.downloaded;
            await new Promise((resolve, reject) => {
                response.data.on('data', (data) => {
                    if (this.paused) {
                        controller.abort();
                        return;
                    }
                    const chunkData = data;
                    writer.write(chunkData);
                    downloadedThisChunk += chunkData.length;
                    chunk.downloaded = downloadedThisChunk;
                    this.task.downloadedSize += chunkData.length;
                    this.updateProgress();
                    if (Date.now() - lastSave > 1000) {
                        this.saveState();
                        lastSave = Date.now();
                    }
                });
                response.data.on('end', () => {
                    writer.end();
                    resolve(undefined);
                });
                response.data.on('error', (err) => {
                    writer.end();
                    reject(err);
                });
                writer.on('error', reject);
            });
        }
        catch (error) {
            if (!this.paused && !axios.default.isCancel(error)) {
                throw error;
            }
        }
    }
    startSpeedMonitor() {
        this.lastDownloaded = this.task.downloadedSize;
        this.speedInterval = setInterval(() => {
            const now = this.task.downloadedSize;
            this.task.speed = now - this.lastDownloaded;
            this.lastDownloaded = now;
            this.emit('progress', this.task);
        }, 1000);
    }
    stopSpeedMonitor() {
        if (this.speedInterval) {
            clearInterval(this.speedInterval);
            this.speedInterval = null;
        }
    }
    updateProgress() {
        if (this.task.totalSize > 0) {
            this.task.progress = (this.task.downloadedSize / this.task.totalSize) * 100;
        }
    }
    async mergeChunks() {
        if (!this.state)
            return;
        await fs.ensureDir(path.dirname(this.state.output));
        const outputStream = fs.createWriteStream(this.state.output);
        for (const chunk of this.state.chunks) {
            if (await fs.pathExists(chunk.file)) {
                const chunkData = await fs.readFile(chunk.file);
                outputStream.write(chunkData);
                await fs.unlink(chunk.file);
            }
        }
        await new Promise((resolve, reject) => {
            outputStream.end(() => resolve());
            outputStream.on('error', reject);
        });
    }
    async pause() {
        this.paused = true;
        this.task.status = types_1.DownloadStatus.Paused;
        this.abortControllers.forEach(controller => controller.abort());
        await this.saveState();
        this.emit('pause', this.task);
    }
    async resume() {
        this.paused = false;
        this.task.status = types_1.DownloadStatus.Downloading;
        this.emit('resume', this.task);
        await this.start();
    }
    async cancel() {
        this.paused = true;
        this.task.status = types_1.DownloadStatus.Cancelled;
        this.abortControllers.forEach(controller => controller.abort());
        await this.cleanup();
        this.emit('cancel', this.task);
    }
    async cleanup() {
        if (this.state) {
            for (const chunk of this.state.chunks) {
                if (await fs.pathExists(chunk.file)) {
                    await fs.unlink(chunk.file);
                }
            }
        }
        if (await fs.pathExists(this.stateFile)) {
            await fs.unlink(this.stateFile);
        }
    }
}
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.js.map