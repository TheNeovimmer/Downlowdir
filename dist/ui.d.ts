import * as blessed from 'blessed';
export interface UITheme {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    border: string;
    text: string;
    muted: string;
}
export declare const theme: UITheme;
export declare function createScreen(): blessed.Widgets.Screen;
export declare function createHeader(screen: blessed.Widgets.Screen): any;
export declare function createFooter(screen: blessed.Widgets.Screen): any;
export declare function createMainMenu(screen: blessed.Widgets.Screen, options: string[], onSelect: (index: number) => void, onCancel: () => void): any;
export declare function createStatusBar(screen: blessed.Widgets.Screen, message?: string): any;
export declare function createInfoBox(screen: blessed.Widgets.Screen, title: string, lines: string[], top?: number): any;
export declare function createProgressBox(screen: blessed.Widgets.Screen, title: string): {
    box: any;
    progress: any;
};
export declare function createSearchBox(screen: blessed.Widgets.Screen, placeholder?: string): {
    box: any;
    input: any;
};
export declare function createListBox(screen: blessed.Widgets.Screen, _title: string, items: string[], onSelect: (index: number) => void, onCancel: () => void, options?: {
    searchable?: boolean;
    multiSelect?: boolean;
}): any;
export declare function createForm(screen: blessed.Widgets.Screen, fields: {
    label: string;
    value: string;
    type?: 'input' | 'number' | 'confirm';
}[], onSubmit: (values: Record<string, string | boolean>) => void, onCancel: () => void): {
    form: any;
    inputs: Record<string, any>;
};
export declare function createConfirmDialog(screen: blessed.Widgets.Screen, message: string, onConfirm: () => void, onCancel: () => void): any;
export declare function createLogBox(screen: blessed.Widgets.Screen, _title: string): {
    box: any;
    scrollable: any;
};
export declare function clearScreenChildren(screen: blessed.Widgets.Screen): void;
export declare function showMessage(screen: blessed.Widgets.Screen, message: string, type?: 'success' | 'error' | 'info', duration?: number): void;
