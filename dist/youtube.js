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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeDownloader = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const yt_dlp_wrap_1 = __importDefault(require("yt-dlp-wrap"));
const events_1 = require("events");
const YT_DLP_DIR = path.join(os.homedir(), '.downlowdir', 'bin');
const YT_DLP_PATH = path.join(YT_DLP_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
class YouTubeDownloader extends events_1.EventEmitter {
    constructor(proxy) {
        super();
        this.progress = 0;
        this.speed = 0;
        this.downloaded = 0;
        this.total = 0;
        this.cancelled = false;
        this.ytDlpWrap = new yt_dlp_wrap_1.default(YT_DLP_PATH);
    }
    async ensureYtDlp() {
        if (await fs.pathExists(YT_DLP_PATH)) {
            return YT_DLP_PATH;
        }
        await fs.ensureDir(YT_DLP_DIR);
        await yt_dlp_wrap_1.default.downloadFromGithub(YT_DLP_PATH);
        return YT_DLP_PATH;
    }
    async getVideoInfo(url, proxy) {
        await this.ensureYtDlp();
        const args = [url, '--dump-single-json', '--no-warnings'];
        if (proxy)
            args.push('--proxy', proxy);
        const info = await this.ytDlpWrap.execPromise(args);
        const data = JSON.parse(info);
        const allFormats = (data.formats || []).filter((f) => {
            const vcodec = f.vcodec;
            const acodec = f.acodec;
            return vcodec !== 'none' || acodec !== 'none';
        });
        const videoFormats = allFormats
            .filter((f) => f.vcodec !== 'none')
            .map((f) => ({
            formatId: f.format_id || '',
            ext: f.ext || 'mp4',
            resolution: f.width && f.height ? `${f.width}x${f.height}` : 'unknown',
            fps: f.fps,
            vcodec: f.vcodec || undefined,
            acodec: f.acodec || undefined,
            filesize: f.filesize,
            filesizeApprox: f.filesize_approx,
            vbr: f.vbr,
            abr: f.abr,
            note: f.format_note,
        }))
            .filter((f) => f.resolution !== 'unknown')
            .sort((a, b) => {
            const getHeight = (res) => parseInt(res.split('x')[1] || '0');
            return getHeight(b.resolution) - getHeight(a.resolution);
        });
        const uniqueResolutions = new Map();
        for (const f of videoFormats) {
            const key = `${f.resolution}-${f.ext}`;
            if (!uniqueResolutions.has(key) || (f.filesize && !uniqueResolutions.get(key)?.filesize)) {
                uniqueResolutions.set(key, f);
            }
        }
        const qualities = Array.from(uniqueResolutions.values()).slice(0, 15);
        const audioFormats = allFormats
            .filter((f) => f.vcodec === 'none' && f.acodec !== 'none')
            .map((f) => ({
            formatId: f.format_id || '',
            ext: f.ext || 'm4a',
            resolution: 'audio only',
            acodec: f.acodec || undefined,
            filesize: f.filesize,
            filesizeApprox: f.filesize_approx,
            abr: f.abr,
            note: f.format_note,
        }))
            .filter((f) => f.abr && f.abr > 0)
            .sort((a, b) => (b.abr || 0) - (a.abr || 0))
            .slice(0, 5);
        return {
            title: data.title || 'Unknown',
            duration: data.duration || 0,
            thumbnail: data.thumbnail || '',
            description: (data.description || '').substring(0, 200),
            uploader: data.uploader || 'Unknown',
            viewCount: data.view_count || 0,
            qualities,
            audioQualities: audioFormats,
        };
    }
    async download(options) {
        await this.ensureYtDlp();
        this.cancelled = false;
        const outputPath = options.output || process.cwd();
        const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
        const args = [
            options.url,
            '-o', outputTemplate,
            '--no-mtime',
            '--progress',
            '--newline',
            '--no-playlist',
        ];
        if (options.proxy) {
            args.push('--proxy', options.proxy);
        }
        if (options.cookies) {
            args.push('--cookies', options.cookies);
        }
        if (options.formatId) {
            if (options.formatId.includes('+')) {
                args.push('-f', options.formatId);
            }
            else {
                args.push('-f', `${options.formatId}+bestaudio/best`);
            }
        }
        else if (options.format === 'audio') {
            args.push('-f', 'bestaudio/best');
            args.push('-x');
            args.push('--audio-format', 'mp3');
            args.push('--audio-quality', '0');
        }
        else if (options.quality) {
            args.push('-f', options.quality);
        }
        else {
            args.push('-f', 'bestvideo+bestaudio/best');
        }
        if (options.format === 'video' && !options.formatId && !options.quality) {
            args.push('--merge-output-format', 'mp4');
        }
        return new Promise((resolve, reject) => {
            const ytProcess = this.ytDlpWrap.exec(args);
            ytProcess.on('progress', (progressData) => {
                if (this.cancelled)
                    return;
                const p = progressData;
                this.progress = p.percent || 0;
                this.speed = p.currentSpeed || 0;
                this.total = p.totalBytes || 0;
                this.downloaded = p.currentBytes || 0;
                this.emit('progress', {
                    progress: this.progress,
                    speed: this.speed,
                    total: this.total,
                    downloaded: this.downloaded,
                });
            });
            ytProcess.on('ytDlpEvent', (eventType, eventData) => {
                if (this.cancelled)
                    return;
                if (eventType === 'download') {
                    const match = eventData.match(/(\d+\.?\d*)%/);
                    if (match) {
                        this.progress = parseFloat(match[1]);
                        this.emit('progress', { progress: this.progress, speed: this.speed });
                    }
                }
            });
            ytProcess.on('close', (code) => {
                if (this.cancelled) {
                    reject(new Error('Download cancelled'));
                    return;
                }
                if (code === 0) {
                    this.emit('complete');
                    resolve(outputPath);
                }
                else {
                    reject(new Error(`yt-dlp exited with code ${code}`));
                }
            });
            ytProcess.on('error', (err) => {
                if (!this.cancelled) {
                    reject(err);
                }
            });
        });
    }
    cancel() {
        this.cancelled = true;
        this.emit('cancelled');
    }
    getProgress() {
        return {
            progress: this.progress,
            speed: this.speed,
            downloaded: this.downloaded,
            total: this.total,
        };
    }
}
exports.YouTubeDownloader = YouTubeDownloader;
//# sourceMappingURL=youtube.js.map