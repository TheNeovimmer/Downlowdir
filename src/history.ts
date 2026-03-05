import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { HistoryEntry, DownloadStatus, VideoSite, ChecksumInfo } from './types';
import { generateId } from './utils';

const HISTORY_FILE = path.join(os.homedir(), '.downlowdir', 'history.json');

interface HistoryData {
  entries: HistoryEntry[];
}

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private maxEntries: number = 1000;
  private enabled: boolean = true;

  constructor(maxEntries: number = 1000, enabled: boolean = true) {
    this.maxEntries = maxEntries;
    this.enabled = enabled;
  }

  async load(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (await fs.pathExists(HISTORY_FILE)) {
        const data: HistoryData = await fs.readJson(HISTORY_FILE);
        this.entries = data.entries || [];
      }
    } catch {
      this.entries = [];
    }
  }

  async save(): Promise<void> {
    if (!this.enabled) return;
    await fs.ensureDir(path.dirname(HISTORY_FILE));
    const data: HistoryData = { entries: this.entries };
    await fs.writeJson(HISTORY_FILE, data, { spaces: 2 });
  }

  add(entry: Omit<HistoryEntry, 'id' | 'startTime'>): string {
    if (!this.enabled) return '';
    
    const id = generateId(entry.url);
    const newEntry: HistoryEntry = {
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

  update(id: string, updates: Partial<HistoryEntry>): void {
    if (!this.enabled) return;
    
    const index = this.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entries[index] = { ...this.entries[index], ...updates };
      this.save();
    }
  }

  complete(id: string, endTime: Date = new Date(), checksum?: ChecksumInfo): void {
    if (!this.enabled) return;
    this.update(id, { 
      status: 'completed' as DownloadStatus,
      endTime,
      checksum,
    });
  }

  fail(id: string, error: string): void {
    if (!this.enabled) return;
    this.update(id, { 
      status: 'failed' as DownloadStatus,
      endTime: new Date(),
      error,
    });
  }

  getAll(): HistoryEntry[] {
    return [...this.entries];
  }

  getById(id: string): HistoryEntry | undefined {
    return this.entries.find(e => e.id === id);
  }

  getByUrl(url: string): HistoryEntry[] {
    return this.entries.filter(e => e.url === url);
  }

  getByStatus(status: DownloadStatus): HistoryEntry[] {
    return this.entries.filter(e => e.status === status);
  }

  getByCategory(category: string): HistoryEntry[] {
    return this.entries.filter(e => e.category === category);
  }

  search(query: string): HistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(e => 
      e.filename.toLowerCase().includes(lowerQuery) ||
      e.url.toLowerCase().includes(lowerQuery) ||
      e.category?.toLowerCase().includes(lowerQuery)
    );
  }

  getRecent(limit: number = 10): HistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  getCompleted(): HistoryEntry[] {
    return this.getByStatus('completed' as DownloadStatus);
  }

  getFailed(): HistoryEntry[] {
    return this.getByStatus('failed' as DownloadStatus);
  }

  getStats(): { total: number; completed: number; failed: number; totalSize: number } {
    return {
      total: this.entries.length,
      completed: this.entries.filter(e => e.status === 'completed').length,
      failed: this.entries.filter(e => e.status === 'failed').length,
      totalSize: this.entries.reduce((sum, e) => sum + e.size, 0),
    };
  }

  async clear(): Promise<void> {
    this.entries = [];
    await this.save();
  }

  async remove(id: string): Promise<void> {
    this.entries = this.entries.filter(e => e.id !== id);
    await this.save();
  }

  async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const originalLength = this.entries.length;
    this.entries = this.entries.filter(e => 
      e.startTime > cutoffDate || e.status === 'completed'
    );
    
    await this.save();
    return originalLength - this.entries.length;
  }

  async exportToFile(filePath: string): Promise<void> {
    await fs.writeJson(filePath, {
      version: '1.0',
      type: 'history',
      exportedAt: new Date().toISOString(),
      entries: this.entries,
    }, { spaces: 2 });
  }

  async importFromFile(filePath: string): Promise<number> {
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

let historyManager: HistoryManager | null = null;

export function getHistoryManager(maxEntries: number = 1000, enabled: boolean = true): HistoryManager {
  if (!historyManager) {
    historyManager = new HistoryManager(maxEntries, enabled);
    historyManager.load();
  }
  return historyManager;
}
