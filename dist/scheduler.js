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
exports.Scheduler = void 0;
exports.getScheduler = getScheduler;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const utils_1 = require("./utils");
const SCHEDULE_FILE = path.join(os.homedir(), '.downlowdir', 'schedule.json');
const RULES_FILE = path.join(os.homedir(), '.downlowdir', 'schedule-rules.json');
class Scheduler {
    constructor() {
        this.downloads = [];
        this.rules = [];
        this.intervalId = null;
        this.onScheduledDownload = null;
        this.load();
    }
    async load() {
        try {
            if (await fs.pathExists(SCHEDULE_FILE)) {
                const data = await fs.readJson(SCHEDULE_FILE);
                this.downloads = data.downloads || [];
                this.rules = data.rules || [];
            }
        }
        catch {
            this.downloads = [];
            this.rules = [];
        }
    }
    async save() {
        await fs.ensureDir(path.dirname(SCHEDULE_FILE));
        const data = {
            downloads: this.downloads,
            rules: this.rules,
        };
        await fs.writeJson(SCHEDULE_FILE, data, { spaces: 2 });
    }
    setDownloadCallback(callback) {
        this.onScheduledDownload = callback;
    }
    start() {
        if (this.intervalId)
            return;
        this.intervalId = setInterval(() => this.checkScheduled(), 30000);
        this.checkScheduled();
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    async checkScheduled() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay();
        for (const download of this.downloads) {
            if (download.status !== 'pending')
                continue;
            const scheduledTime = new Date(download.scheduledTime);
            if (scheduledTime <= now) {
                download.status = 'completed';
                download.completedAt = new Date();
                if (this.onScheduledDownload) {
                    try {
                        await this.onScheduledDownload(download);
                    }
                    catch (error) {
                        download.status = 'failed';
                        download.error = error instanceof Error ? error.message : String(error);
                    }
                }
            }
        }
        for (const rule of this.rules) {
            if (!rule.enabled)
                continue;
            if (!rule.days.includes(currentDay))
                continue;
            if (!(0, utils_1.isTimeInRange)(currentTime, rule.startTime, rule.endTime))
                continue;
        }
        await this.save();
    }
    addDownload(options) {
        const id = (0, utils_1.generateId)(options.url);
        const download = {
            id,
            url: options.url,
            output: options.output,
            scheduledTime: options.scheduledTime,
            format: options.format,
            quality: options.quality,
            category: options.category,
            status: 'pending',
            createdAt: new Date(),
        };
        this.downloads.push(download);
        this.save();
        return id;
    }
    addRule(rule) {
        const id = (0, utils_1.generateId)(rule.name);
        const newRule = {
            ...rule,
            id,
        };
        this.rules.push(newRule);
        this.save();
        return id;
    }
    removeDownload(id) {
        const index = this.downloads.findIndex(d => d.id === id);
        if (index !== -1) {
            this.downloads[index].status = 'cancelled';
            this.save();
            return true;
        }
        return false;
    }
    removeRule(id) {
        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
            this.rules.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }
    toggleRule(id) {
        const rule = this.rules.find(r => r.id === id);
        if (rule) {
            rule.enabled = !rule.enabled;
            this.save();
            return rule.enabled;
        }
        return false;
    }
    getDownloads() {
        return [...this.downloads];
    }
    getPendingDownloads() {
        return this.downloads.filter(d => d.status === 'pending');
    }
    getRules() {
        return [...this.rules];
    }
    getActiveRules() {
        return this.rules.filter(r => r.enabled);
    }
    getCurrentSpeedLimit() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay();
        for (const rule of this.rules) {
            if (!rule.enabled)
                continue;
            if (!rule.days.includes(currentDay))
                continue;
            if ((0, utils_1.isTimeInRange)(currentTime, rule.startTime, rule.endTime)) {
                return rule.speedLimit;
            }
        }
        return 0;
    }
    clearCompleted() {
        this.downloads = this.downloads.filter(d => d.status === 'pending');
        this.save();
    }
    clearAll() {
        this.downloads = [];
        this.save();
    }
    getNextScheduled() {
        const pending = this.getPendingDownloads();
        if (pending.length === 0)
            return null;
        return pending.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];
    }
    getScheduleStats() {
        return {
            pending: this.downloads.filter(d => d.status === 'pending').length,
            completed: this.downloads.filter(d => d.status === 'completed').length,
            failed: this.downloads.filter(d => d.status === 'failed').length,
        };
    }
}
exports.Scheduler = Scheduler;
let scheduler = null;
function getScheduler() {
    if (!scheduler) {
        scheduler = new Scheduler();
    }
    return scheduler;
}
//# sourceMappingURL=scheduler.js.map