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
exports.HistoryManager = void 0;
exports.getHistoryManager = getHistoryManager;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const utils_1 = require("./utils");
const HISTORY_FILE = path.join(os.homedir(), '.downlowdir', 'history.json');
class HistoryManager {
    constructor(maxEntries = 1000, enabled = true) {
        this.entries = [];
        this.maxEntries = 1000;
        this.enabled = true;
        this.maxEntries = maxEntries;
        this.enabled = enabled;
    }
    async load() {
        if (!this.enabled)
            return;
        try {
            if (await fs.pathExists(HISTORY_FILE)) {
                const data = await fs.readJson(HISTORY_FILE);
                this.entries = data.entries || [];
            }
        }
        catch {
            this.entries = [];
        }
    }
    async save() {
        if (!this.enabled)
            return;
        await fs.ensureDir(path.dirname(HISTORY_FILE));
        const data = { entries: this.entries };
        await fs.writeJson(HISTORY_FILE, data, { spaces: 2 });
    }
    add(entry) {
        if (!this.enabled)
            return '';
        const id = (0, utils_1.generateId)(entry.url);
        const newEntry = {
            ...entry,
            id,
            startTime: new Date(),
        };
        this.entries.unshift(newEntry);
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }
        this.save();
        return id;
    }
    update(id, updates) {
        if (!this.enabled)
            return;
        const index = this.entries.findIndex(e => e.id === id);
        if (index !== -1) {
            this.entries[index] = { ...this.entries[index], ...updates };
            this.save();
        }
    }
    complete(id, endTime = new Date(), checksum) {
        if (!this.enabled)
            return;
        this.update(id, {
            status: 'completed',
            endTime,
            checksum,
        });
    }
    fail(id, error) {
        if (!this.enabled)
            return;
        this.update(id, {
            status: 'failed',
            endTime: new Date(),
            error,
        });
    }
    getAll() {
        return [...this.entries];
    }
    getById(id) {
        return this.entries.find(e => e.id === id);
    }
    getByUrl(url) {
        return this.entries.filter(e => e.url === url);
    }
    getByStatus(status) {
        return this.entries.filter(e => e.status === status);
    }
    getByCategory(category) {
        return this.entries.filter(e => e.category === category);
    }
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.entries.filter(e => e.filename.toLowerCase().includes(lowerQuery) ||
            e.url.toLowerCase().includes(lowerQuery) ||
            e.category?.toLowerCase().includes(lowerQuery));
    }
    getRecent(limit = 10) {
        return this.entries.slice(0, limit);
    }
    getCompleted() {
        return this.getByStatus('completed');
    }
    getFailed() {
        return this.getByStatus('failed');
    }
    getStats() {
        return {
            total: this.entries.length,
            completed: this.entries.filter(e => e.status === 'completed').length,
            failed: this.entries.filter(e => e.status === 'failed').length,
            totalSize: this.entries.reduce((sum, e) => sum + e.size, 0),
        };
    }
    async clear() {
        this.entries = [];
        await this.save();
    }
    async remove(id) {
        this.entries = this.entries.filter(e => e.id !== id);
        await this.save();
    }
    async cleanup(olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const originalLength = this.entries.length;
        this.entries = this.entries.filter(e => e.startTime > cutoffDate || e.status === 'completed');
        await this.save();
        return originalLength - this.entries.length;
    }
    async exportToFile(filePath) {
        await fs.writeJson(filePath, {
            version: '1.0',
            type: 'history',
            exportedAt: new Date().toISOString(),
            entries: this.entries,
        }, { spaces: 2 });
    }
    async importFromFile(filePath) {
        const data = await fs.readJson(filePath);
        if (data.entries && Array.isArray(data.entries)) {
            const imported = data.entries.length;
            this.entries = [...data.entries, ...this.entries];
            this.entries = this.entries.slice(0, this.maxEntries);
            await this.save();
            return imported;
        }
        return 0;
    }
}
exports.HistoryManager = HistoryManager;
let historyManager = null;
function getHistoryManager(maxEntries = 1000, enabled = true) {
    if (!historyManager) {
        historyManager = new HistoryManager(maxEntries, enabled);
        historyManager.load();
    }
    return historyManager;
}
//# sourceMappingURL=history.js.map