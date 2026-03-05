import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { ScheduledDownload, ScheduleRule, DownloadOptions } from './types';
import { generateId, parseTime, isTimeInRange } from './utils';

const SCHEDULE_FILE = path.join(os.homedir(), '.downlowdir', 'schedule.json');
const RULES_FILE = path.join(os.homedir(), '.downlowdir', 'schedule-rules.json');

interface ScheduleData {
  downloads: ScheduledDownload[];
  rules: ScheduleRule[];
}

export class Scheduler {
  private downloads: ScheduledDownload[] = [];
  private rules: ScheduleRule[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onScheduledDownload: ((download: ScheduledDownload) => Promise<void>) | null = null;

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    try {
      if (await fs.pathExists(SCHEDULE_FILE)) {
        const data: ScheduleData = await fs.readJson(SCHEDULE_FILE);
        this.downloads = data.downloads || [];
        this.rules = data.rules || [];
      }
    } catch {
      this.downloads = [];
      this.rules = [];
    }
  }

  async save(): Promise<void> {
    await fs.ensureDir(path.dirname(SCHEDULE_FILE));
    const data: ScheduleData = {
      downloads: this.downloads,
      rules: this.rules,
    };
    await fs.writeJson(SCHEDULE_FILE, data, { spaces: 2 });
  }

  setDownloadCallback(callback: (download: ScheduledDownload) => Promise<void>): void {
    this.onScheduledDownload = callback;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.checkScheduled(), 30000);
    this.checkScheduled();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkScheduled(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    for (const download of this.downloads) {
      if (download.status !== 'pending') continue;

      const scheduledTime = new Date(download.scheduledTime);
      if (scheduledTime <= now) {
        download.status = 'completed';
        download.completedAt = new Date();
        
        if (this.onScheduledDownload) {
          try {
            await this.onScheduledDownload(download);
          } catch (error) {
            download.status = 'failed';
            download.error = error instanceof Error ? error.message : String(error);
          }
        }
      }
    }

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (!rule.days.includes(currentDay)) continue;
      if (!isTimeInRange(currentTime, rule.startTime, rule.endTime)) continue;
    }

    await this.save();
  }

  addDownload(options: {
    url: string;
    output: string;
    scheduledTime: Date;
    format?: string;
    quality?: string;
    category?: string;
  }): string {
    const id = generateId(options.url);
    const download: ScheduledDownload = {
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

  addRule(rule: Omit<ScheduleRule, 'id'>): string {
    const id = generateId(rule.name);
    const newRule: ScheduleRule = {
      ...rule,
      id,
    };
    this.rules.push(newRule);
    this.save();
    return id;
  }

  removeDownload(id: string): boolean {
    const index = this.downloads.findIndex(d => d.id === id);
    if (index !== -1) {
      this.downloads[index].status = 'cancelled';
      this.save();
      return true;
    }
    return false;
  }

  removeRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index !== -1) {
      this.rules.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  toggleRule(id: string): boolean {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.save();
      return rule.enabled;
    }
    return false;
  }

  getDownloads(): ScheduledDownload[] {
    return [...this.downloads];
  }

  getPendingDownloads(): ScheduledDownload[] {
    return this.downloads.filter(d => d.status === 'pending');
  }

  getRules(): ScheduleRule[] {
    return [...this.rules];
  }

  getActiveRules(): ScheduleRule[] {
    return this.rules.filter(r => r.enabled);
  }

  getCurrentSpeedLimit(): number {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (!rule.days.includes(currentDay)) continue;
      if (isTimeInRange(currentTime, rule.startTime, rule.endTime)) {
        return rule.speedLimit;
      }
    }
    return 0;
  }

  clearCompleted(): void {
    this.downloads = this.downloads.filter(d => d.status === 'pending');
    this.save();
  }

  clearAll(): void {
    this.downloads = [];
    this.save();
  }

  getNextScheduled(): ScheduledDownload | null {
    const pending = this.getPendingDownloads();
    if (pending.length === 0) return null;
    
    return pending.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    )[0];
  }

  getScheduleStats(): { pending: number; completed: number; failed: number } {
    return {
      pending: this.downloads.filter(d => d.status === 'pending').length,
      completed: this.downloads.filter(d => d.status === 'completed').length,
      failed: this.downloads.filter(d => d.status === 'failed').length,
    };
  }
}

let scheduler: Scheduler | null = null;

export function getScheduler(): Scheduler {
  if (!scheduler) {
    scheduler = new Scheduler();
  }
  return scheduler;
}
