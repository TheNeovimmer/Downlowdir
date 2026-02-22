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
exports.DownloadQueue = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const events_1 = require("events");
const types_1 = require("./types");
const downloader_1 = require("./downloader");
const QUEUE_FILE = path.join(os.homedir(), '.downlowdir', 'queue.json');
class DownloadQueue extends events_1.EventEmitter {
    constructor(config, maxConcurrent = 3) {
        super();
        this.downloaders = new Map();
        this.activeCount = 0;
        this.queue = [];
        this.config = config;
        this.maxConcurrent = maxConcurrent;
    }
    async add(options) {
        const downloader = new downloader_1.Downloader(options, this.config);
        const task = downloader.getTask();
        this.downloaders.set(task.id, downloader);
        this.queue.push(task.id);
        downloader.on('start', (t) => this.emit('task-start', t));
        downloader.on('progress', (t) => this.emit('task-progress', t));
        downloader.on('complete', (t) => {
            this.activeCount--;
            this.emit('task-complete', t);
            this.processQueue();
        });
        downloader.on('error', (t, err) => {
            this.activeCount--;
            this.emit('task-error', t, err);
            this.processQueue();
        });
        downloader.on('pause', (t) => this.emit('task-pause', t));
        downloader.on('resume', (t) => this.emit('task-resume', t));
        downloader.on('cancel', (t) => {
            this.activeCount--;
            this.emit('task-cancel', t);
        });
        await this.saveQueue();
        this.emit('task-added', task);
        this.processQueue();
        return task.id;
    }
    processQueue() {
        while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
            const taskId = this.queue.shift();
            if (taskId) {
                const downloader = this.downloaders.get(taskId);
                if (downloader) {
                    this.activeCount++;
                    downloader.start();
                }
            }
        }
    }
    async pause(id) {
        const downloader = this.downloaders.get(id);
        if (downloader) {
            await downloader.pause();
        }
    }
    async resume(id) {
        const downloader = this.downloaders.get(id);
        if (downloader) {
            this.activeCount++;
            await downloader.resume();
        }
    }
    async cancel(id) {
        const downloader = this.downloaders.get(id);
        if (downloader) {
            await downloader.cancel();
            this.downloaders.delete(id);
            await this.saveQueue();
        }
    }
    getTask(id) {
        const downloader = this.downloaders.get(id);
        return downloader?.getTask();
    }
    getAllTasks() {
        const tasks = [];
        this.downloaders.forEach(downloader => {
            tasks.push(downloader.getTask());
        });
        return tasks;
    }
    async clearCompleted() {
        const toDelete = [];
        this.downloaders.forEach((downloader, id) => {
            const task = downloader.getTask();
            if (task.status === types_1.DownloadStatus.Completed || task.status === types_1.DownloadStatus.Cancelled || task.status === types_1.DownloadStatus.Failed) {
                toDelete.push(id);
            }
        });
        for (const id of toDelete) {
            this.downloaders.delete(id);
        }
        await this.saveQueue();
    }
    async saveQueue() {
        const state = {
            tasks: this.getAllTasks(),
        };
        await fs.ensureDir(path.dirname(QUEUE_FILE));
        await fs.writeJson(QUEUE_FILE, state, { spaces: 2 });
    }
    async loadQueue() {
        try {
            if (await fs.pathExists(QUEUE_FILE)) {
                const state = await fs.readJson(QUEUE_FILE);
                for (const task of state.tasks) {
                    if (task.status === types_1.DownloadStatus.Downloading || task.status === types_1.DownloadStatus.Pending) {
                        await this.add({
                            url: task.url,
                            output: task.output,
                            threads: task.threads,
                            resume: task.resume,
                            speedLimit: task.speedLimit,
                            headers: task.headers,
                        });
                    }
                }
            }
        }
        catch {
            // ignore
        }
    }
}
exports.DownloadQueue = DownloadQueue;
//# sourceMappingURL=queue.js.map