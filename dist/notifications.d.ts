export interface NotificationOptions {
    title: string;
    message: string;
    icon?: string;
    sound?: boolean;
    wait?: boolean;
}
export declare class NotificationManager {
    private enabled;
    private iconPath;
    constructor(enabled?: boolean);
    setEnabled(enabled: boolean): void;
    notify(options: NotificationOptions): Promise<void>;
    notifyDownloadComplete(filename: string, outputPath: string, size: string): Promise<void>;
    notifyDownloadFailed(filename: string, error: string): Promise<void>;
    notifyBatchComplete(completed: number, failed: number): Promise<void>;
    notifyScheduledDownload(filename: string): Promise<void>;
    private getDefaultIcon;
}
export declare function getNotificationManager(enabled?: boolean): NotificationManager;
export declare function setNotificationEnabled(enabled: boolean): void;
