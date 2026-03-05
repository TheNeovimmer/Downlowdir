export type NavigationCallback = () => void | Promise<void>;
export interface MenuItem {
    label: string;
    action: NavigationCallback;
    submenu?: MenuItem[];
}
export declare class Navigator {
    private screen;
    private header;
    private footer;
    private currentScreen;
    private menuStack;
    private onExit;
    constructor();
    private setupKeyHandlers;
    setOnExit(callback: () => void): void;
    showMainMenu(): Promise<void>;
    private handleMenuSelection;
    private promptForDownload;
    private promptForPlaylist;
    private createInputBox;
    private showBatchDownload;
    private showScheduleDownload;
    private promptForSchedule;
    private showScheduledList;
    private showResumeDownloads;
    private showDownloadQueue;
    private showHistory;
    private showCategories;
    private promptAddCategory;
    private createCategoryForm;
    private createGenericForm;
    private showStatistics;
    private showSettings;
    private promptEditSettings;
    start(): Promise<void>;
    destroy(): void;
}
export declare function startNavigation(onExit?: () => void): Promise<void>;
