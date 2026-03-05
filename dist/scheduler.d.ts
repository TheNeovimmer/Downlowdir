import type { ScheduledDownload, ScheduleRule } from './types';
export declare class Scheduler {
    private downloads;
    private rules;
    private intervalId;
    private onScheduledDownload;
    constructor();
    load(): Promise<void>;
    save(): Promise<void>;
    setDownloadCallback(callback: (download: ScheduledDownload) => Promise<void>): void;
    start(): void;
    stop(): void;
    private checkScheduled;
    addDownload(options: {
        url: string;
        output: string;
        scheduledTime: Date;
        format?: string;
        quality?: string;
        category?: string;
    }): string;
    addRule(rule: Omit<ScheduleRule, 'id'>): string;
    removeDownload(id: string): boolean;
    removeRule(id: string): boolean;
    toggleRule(id: string): boolean;
    getDownloads(): ScheduledDownload[];
    getPendingDownloads(): ScheduledDownload[];
    getRules(): ScheduleRule[];
    getActiveRules(): ScheduleRule[];
    getCurrentSpeedLimit(): number;
    clearCompleted(): void;
    clearAll(): void;
    getNextScheduled(): ScheduledDownload | null;
    getScheduleStats(): {
        pending: number;
        completed: number;
        failed: number;
    };
}
export declare function getScheduler(): Scheduler;
