import type { HistoryEntry, DownloadStatus, ChecksumInfo } from './types';
export declare class HistoryManager {
    private entries;
    private maxEntries;
    private enabled;
    constructor(maxEntries?: number, enabled?: boolean);
    load(): Promise<void>;
    save(): Promise<void>;
    add(entry: Omit<HistoryEntry, 'id' | 'startTime'>): string;
    update(id: string, updates: Partial<HistoryEntry>): void;
    complete(id: string, endTime?: Date, checksum?: ChecksumInfo): void;
    fail(id: string, error: string): void;
    getAll(): HistoryEntry[];
    getById(id: string): HistoryEntry | undefined;
    getByUrl(url: string): HistoryEntry[];
    getByStatus(status: DownloadStatus): HistoryEntry[];
    getByCategory(category: string): HistoryEntry[];
    search(query: string): HistoryEntry[];
    getRecent(limit?: number): HistoryEntry[];
    getCompleted(): HistoryEntry[];
    getFailed(): HistoryEntry[];
    getStats(): {
        total: number;
        completed: number;
        failed: number;
        totalSize: number;
    };
    clear(): Promise<void>;
    remove(id: string): Promise<void>;
    cleanup(olderThanDays: number): Promise<number>;
    exportToFile(filePath: string): Promise<void>;
    importFromFile(filePath: string): Promise<number>;
}
export declare function getHistoryManager(maxEntries?: number, enabled?: boolean): HistoryManager;
