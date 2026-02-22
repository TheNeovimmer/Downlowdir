import { EventEmitter } from 'events';
import type { DownloadTask, DownloadOptions, Config } from './types';
export declare class DownloadQueue extends EventEmitter {
    private downloaders;
    private config;
    private maxConcurrent;
    private activeCount;
    private queue;
    constructor(config: Config, maxConcurrent?: number);
    add(options: DownloadOptions): Promise<string>;
    private processQueue;
    pause(id: string): Promise<void>;
    resume(id: string): Promise<void>;
    cancel(id: string): Promise<void>;
    getTask(id: string): DownloadTask | undefined;
    getAllTasks(): DownloadTask[];
    clearCompleted(): Promise<void>;
    private saveQueue;
    loadQueue(): Promise<void>;
}
