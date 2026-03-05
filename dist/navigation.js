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
exports.Navigator = void 0;
exports.startNavigation = startNavigation;
/* eslint-disable @typescript-eslint/no-explicit-any */
const blessed = __importStar(require("blessed"));
const ui_1 = require("./ui");
const config_1 = require("./config");
const history_1 = require("./history");
const scheduler_1 = require("./scheduler");
const categories_1 = require("./categories");
const utils_1 = require("./utils");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class Navigator {
    constructor() {
        this.currentScreen = 'main';
        this.menuStack = [];
        this.onExit = null;
        this.screen = (0, ui_1.createScreen)();
        this.header = (0, ui_1.createHeader)(this.screen);
        this.footer = (0, ui_1.createFooter)(this.screen);
        this.setupKeyHandlers();
    }
    setupKeyHandlers() {
        this.screen.key(['escape', 'q', 'C-c'], () => {
            if (this.onExit) {
                this.onExit();
            }
            process.exit(0);
        });
        this.screen.key(['C-c'], () => {
            if (this.onExit) {
                this.onExit();
            }
            process.exit(0);
        });
    }
    setOnExit(callback) {
        this.onExit = callback;
    }
    async showMainMenu() {
        (0, ui_1.clearScreenChildren)(this.screen);
        this.header = (0, ui_1.createHeader)(this.screen);
        this.footer = (0, ui_1.createFooter)(this.screen);
        const menuOptions = [
            'Download File',
            'Download Playlist',
            'Batch Download',
            'Schedule Download',
            'Resume Downloads',
            'Download Queue',
            'View History',
            'Manage Categories',
            'Statistics',
            'Settings',
            'Exit',
        ];
        const menu = (0, ui_1.createMainMenu)(this.screen, menuOptions, async (index) => {
            await this.handleMenuSelection(index);
        }, () => {
            if (this.onExit) {
                this.onExit();
            }
            process.exit(0);
        });
        this.menuStack.push(menu);
        this.screen.render();
    }
    async handleMenuSelection(index) {
        switch (index) {
            case 0:
                await this.promptForDownload();
                break;
            case 1:
                await this.promptForPlaylist();
                break;
            case 2:
                await this.showBatchDownload();
                break;
            case 3:
                await this.showScheduleDownload();
                break;
            case 4:
                await this.showResumeDownloads();
                break;
            case 5:
                await this.showDownloadQueue();
                break;
            case 6:
                await this.showHistory();
                break;
            case 7:
                await this.showCategories();
                break;
            case 8:
                await this.showStatistics();
                break;
            case 9:
                await this.showSettings();
                break;
            case 10:
                if (this.onExit) {
                    this.onExit();
                }
                process.exit(0);
                break;
        }
    }
    async promptForDownload() {
        (0, ui_1.clearScreenChildren)(this.screen);
        (0, ui_1.createHeader)(this.screen);
        (0, ui_1.createFooter)(this.screen);
        const { box, input } = this.createInputBox('Enter URL to download:', 'URL:');
        input.focus();
        this.screen.render();
        input.on('submit', () => {
            const url = input.getValue().trim();
            if (url) {
                this.screen.remove(box);
                this.screen.render();
                (0, ui_1.showMessage)(this.screen, `Starting download: ${url.substring(0, 30)}...`, 'success', 2000);
                setTimeout(() => this.showMainMenu(), 2500);
            }
            else {
                (0, ui_1.showMessage)(this.screen, 'URL is required', 'error', 1500);
            }
        });
    }
    async promptForPlaylist() {
        (0, ui_1.clearScreenChildren)(this.screen);
        (0, ui_1.createHeader)(this.screen);
        (0, ui_1.createFooter)(this.screen);
        const { box, input } = this.createInputBox('Enter playlist URL:', 'Playlist URL:');
        input.focus();
        this.screen.render();
        input.on('submit', () => {
            const url = input.getValue().trim();
            if (url) {
                this.screen.remove(box);
                this.screen.render();
                (0, ui_1.showMessage)(this.screen, `Starting playlist: ${url.substring(0, 30)}...`, 'success', 2000);
                setTimeout(() => this.showMainMenu(), 2500);
            }
            else {
                (0, ui_1.showMessage)(this.screen, 'URL is required', 'error', 1500);
            }
        });
    }
    createInputBox(prompt, _label) {
        const box = blessed.box({
            parent: this.screen,
            top: 'center',
            left: 'center',
            width: 60,
            height: 7,
            border: { type: 'line', fg: ui_1.theme.primary },
            style: {
                fg: ui_1.theme.text,
                border: { fg: ui_1.theme.primary },
            },
        });
        blessed.text({
            parent: box,
            top: 1,
            left: 3,
            content: prompt,
            style: { fg: ui_1.theme.text },
        });
        const input = blessed.textbox({
            parent: box,
            top: 3,
            left: 3,
            width: '90%',
            height: 1,
            border: { type: 'line', fg: ui_1.theme.muted },
            inputOnFocus: true,
            style: {
                fg: ui_1.theme.text,
            },
        });
        return { box, input };
    }
    async showBatchDownload() {
        (0, ui_1.clearScreenChildren)(this.screen);
        (0, ui_1.createHeader)(this.screen);
        (0, ui_1.createFooter)(this.screen);
        const { box, input } = this.createInputBox('Enter path to batch file:', 'File path:');
        input.focus();
        this.screen.render();
        input.on('submit', async () => {
            const filePath = input.getValue().trim();
            if (filePath) {
                const exists = await fs.pathExists(filePath);
                if (exists) {
                    this.screen.remove(box);
                    this.screen.render();
                    (0, ui_1.showMessage)(this.screen, `Processing: ${filePath}`, 'success', 2000);
                    setTimeout(() => this.showMainMenu(), 2500);
                }
                else {
                    (0, ui_1.showMessage)(this.screen, 'File not found', 'error', 1500);
                }
            }
            else {
                (0, ui_1.showMessage)(this.screen, 'File path required', 'error', 1500);
            }
        });
    }
    async showScheduleDownload() {
        (0, ui_1.clearScreenChildren)(this.screen);
        (0, ui_1.createHeader)(this.screen);
        (0, ui_1.createFooter)(this.screen);
        const items = [
            'Schedule new download',
            'View scheduled downloads',
            'Back to main menu',
        ];
        const list = (0, ui_1.createListBox)(this.screen, 'Schedule Options', items, async (index) => {
            if (index === 0) {
                await this.promptForSchedule();
            }
            else if (index === 1) {
                await this.showScheduledList();
            }
            else {
                await this.showMainMenu();
            }
        }, () => this.showMainMenu());
        this.menuStack.push(list);
        this.screen.render();
    }
    async promptForSchedule() {
        (0, ui_1.clearScreenChildren)(this.screen);
        (0, ui_1.createHeader)(this.screen);
        (0, ui_1.createFooter)(this.screen);
        const { box, input } = this.createInputBox('Enter URL to schedule:', 'URL:');
        input.focus();
        this.screen.render();
        input.on('submit', () => {
            const url = input.getValue().trim();
            if (url) {
                this.screen.remove(box);
                this.screen.render();
                const scheduler = (0, scheduler_1.getScheduler)();
                scheduler.addDownload({
                    url,
                    output: '.',
                    scheduledTime: new Date(Date.now() + 60 * 60 * 1000),
                });
                (0, ui_1.showMessage)(this.screen, 'Download scheduled for 1 hour from now', 'success', 2000);
                setTimeout(() => this.showMainMenu(), 2500);
            }
            else {
                (0, ui_1.showMessage)(this.screen, 'URL is required', 'error', 1500);
            }
        });
    }
    async showScheduledList() {
        const scheduler = (0, scheduler_1.getScheduler)();
        const scheduled = scheduler.getScheduleStats();
        const content = [
            `Pending: ${scheduled.pending}`,
            `Completed: ${scheduled.completed}`,
            `Failed: ${scheduled.failed}`,
        ];
        (0, ui_1.createInfoBox)(this.screen, 'Scheduled Downloads', content);
        const { box, input } = this.createInputBox('Press Enter to go back', '');
        this.screen.key(['enter'], () => {
            this.screen.remove(box);
            this.showScheduleDownload();
        });
        this.screen.render();
    }
    async showResumeDownloads() {
        const config = await (0, config_1.loadConfig)();
        const tempDir = config.tempDir;
        if (!(await fs.pathExists(tempDir))) {
            (0, ui_1.showMessage)(this.screen, 'No paused downloads', 'info', 2000);
            await this.showMainMenu();
            return;
        }
        const files = await fs.readdir(tempDir);
        const stateFiles = files.filter((f) => f.endsWith('.json'));
        if (stateFiles.length === 0) {
            (0, ui_1.showMessage)(this.screen, 'No paused downloads', 'info', 2000);
            await this.showMainMenu();
            return;
        }
        const items = stateFiles.map((f) => f.replace('.json', ''));
        const list = (0, ui_1.createListBox)(this.screen, 'Select download to resume', [...items, 'Back to main menu'], async (index) => {
            if (index < stateFiles.length) {
                (0, ui_1.showMessage)(this.screen, `Resuming: ${items[index]}`, 'success', 1500);
            }
            await this.showMainMenu();
        }, () => this.showMainMenu());
        this.menuStack.push(list);
        this.screen.render();
    }
    async showDownloadQueue() {
        const config = await (0, config_1.loadConfig)();
        const tempDir = config.tempDir;
        if (!(await fs.pathExists(tempDir))) {
            (0, ui_1.showMessage)(this.screen, 'Queue is empty', 'info', 2000);
            await this.showMainMenu();
            return;
        }
        const files = await fs.readdir(tempDir);
        const stateFiles = files.filter((f) => f.endsWith('.json'));
        if (stateFiles.length === 0) {
            (0, ui_1.showMessage)(this.screen, 'Queue is empty', 'info', 2000);
            await this.showMainMenu();
            return;
        }
        const queueItems = [];
        for (const file of stateFiles) {
            const state = await fs.readJson(path.join(tempDir, file));
            const progress = state.totalSize > 0
                ? ((state.chunks.reduce((s, c) => s + c.downloaded, 0) / state.totalSize) * 100).toFixed(1)
                : '0';
            queueItems.push(`${file.replace('.json', '')} - ${progress}%`);
        }
        queueItems.push('Back to main menu');
        const list = (0, ui_1.createListBox)(this.screen, 'Download Queue', queueItems, async (_index) => {
            await this.showMainMenu();
        }, () => this.showMainMenu());
        this.menuStack.push(list);
        this.screen.render();
    }
    async showHistory() {
        const config = await (0, config_1.loadConfig)();
        const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
        await history.load();
        const entries = history.getRecent(20);
        if (entries.length === 0) {
            (0, ui_1.showMessage)(this.screen, 'No download history', 'info', 2000);
            await this.showMainMenu();
            return;
        }
        const items = entries.map(e => `${e.status === 'completed' ? '✓' : e.status === 'failed' ? '✗' : '○'} ${e.filename.substring(0, 35)} - ${(0, utils_1.formatDate)(new Date(e.startTime))}`);
        items.push('Back to main menu');
        const list = (0, ui_1.createListBox)(this.screen, 'Download History', items, () => this.showMainMenu(), () => this.showMainMenu(), { searchable: true });
        this.menuStack.push(list);
        this.screen.render();
    }
    async showCategories() {
        const categoryManager = (0, categories_1.getCategoryManager)();
        const categories = categoryManager.getAll();
        const items = categories.map(c => `${c.name} - ${c.patterns.length} patterns`);
        items.push('Add category');
        items.push('Reset categories');
        items.push('Back to main menu');
        const list = (0, ui_1.createListBox)(this.screen, 'Categories', items, async (index) => {
            if (index === categories.length) {
                await this.promptAddCategory();
            }
            else if (index === categories.length + 1) {
                categoryManager.reset();
                (0, ui_1.showMessage)(this.screen, 'Categories reset!', 'success', 1500);
                await this.showCategories();
            }
            else {
                (0, ui_1.showMessage)(this.screen, `Category: ${categories[index].name}`, 'info', 1500);
                await this.showMainMenu();
            }
        }, () => this.showMainMenu());
        this.menuStack.push(list);
        this.screen.render();
    }
    async promptAddCategory() {
        (0, ui_1.clearScreenChildren)(this.screen);
        (0, ui_1.createHeader)(this.screen);
        (0, ui_1.createFooter)(this.screen);
        const { form } = this.createCategoryForm(async (values) => {
            const categoryManager = (0, categories_1.getCategoryManager)();
            categoryManager.add({
                name: values['Category name'],
                color: values['Color'] || '#FFFFFF',
                patterns: (values['Patterns'] || '').split(',').map((p) => p.trim()),
                outputTemplate: '%(title)s.%(ext)s',
                autoAssign: true,
            });
            (0, ui_1.showMessage)(this.screen, 'Category added!', 'success', 1500);
            await this.showCategories();
        }, () => this.showCategories());
        this.menuStack.push(form);
        this.screen.render();
    }
    createCategoryForm(onSubmit, onCancel) {
        const fields = [
            { label: 'Category name', value: '', type: 'input' },
            { label: 'Color', value: '#FFFFFF', type: 'input' },
            { label: 'Patterns', value: '', type: 'input' },
        ];
        return this.createGenericForm(fields, onSubmit, onCancel);
    }
    createGenericForm(fields, onSubmit, onCancel) {
        const formHeight = fields.length * 3 + 5;
        const formBox = blessed.form({
            parent: this.screen,
            top: 6,
            left: 'center',
            width: '60%',
            height: formHeight,
            border: { type: 'line', fg: ui_1.theme.primary },
            style: {
                fg: ui_1.theme.text,
                border: { fg: ui_1.theme.primary },
            },
        });
        const inputs = {};
        fields.forEach((field, index) => {
            const y = index * 3 + 1;
            blessed.text({
                parent: formBox,
                top: y,
                left: 3,
                content: field.label + ':',
                style: { fg: ui_1.theme.text },
            });
            const input = blessed.textbox({
                parent: formBox,
                top: y + 1,
                left: 3,
                width: '90%',
                height: 1,
                border: { type: 'line', fg: ui_1.theme.muted },
                inputOnFocus: true,
                value: field.value,
                style: {
                    fg: ui_1.theme.text,
                    focus: { border: { fg: ui_1.theme.primary } },
                },
            });
            inputs[field.label] = input;
        });
        const submitBtn = blessed.button({
            parent: formBox,
            top: formHeight - 3,
            left: '30%',
            width: 15,
            height: 1,
            content: ' Submit ',
            style: {
                fg: 'black',
                bg: ui_1.theme.success,
                bold: true,
            },
        });
        const cancelBtn = blessed.button({
            parent: formBox,
            top: formHeight - 3,
            left: '55%',
            width: 10,
            height: 1,
            content: ' Cancel ',
            style: {
                fg: 'black',
                bg: ui_1.theme.error,
                bold: true,
            },
        });
        submitBtn.on('press', () => {
            const values = {};
            for (const [key, input] of Object.entries(inputs)) {
                if ('getValue' in input) {
                    values[key] = input.getValue();
                }
            }
            onSubmit(values);
        });
        cancelBtn.on('press', onCancel);
        return { form: formBox, inputs };
    }
    async showStatistics() {
        const config = await (0, config_1.loadConfig)();
        const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
        const scheduler = (0, scheduler_1.getScheduler)();
        await history.load();
        const stats = history.getStats();
        const scheduleStats = scheduler.getScheduleStats();
        const nextScheduled = scheduler.getNextScheduled();
        const lines = [
            `Total Downloads: ${stats.total}`,
            `Completed: ${stats.completed}`,
            `Failed: ${stats.failed}`,
            `Total Size: ${(0, utils_1.formatBytes)(stats.totalSize)}`,
            '',
            `Scheduled - Pending: ${scheduleStats.pending}`,
        ];
        if (nextScheduled) {
            lines.push(`Next: ${(0, utils_1.formatDate)(new Date(nextScheduled.scheduledTime))} at ${(0, utils_1.formatTime)(new Date(nextScheduled.scheduledTime))}`);
        }
        (0, ui_1.createInfoBox)(this.screen, 'Statistics', lines);
        const { box } = this.createInputBox('Press Enter to go back', '');
        this.screen.key(['enter'], () => {
            this.screen.remove(box);
            this.showMainMenu();
        });
        this.screen.render();
    }
    async showSettings() {
        const config = await (0, config_1.loadConfig)();
        const lines = [
            `Threads: ${config.defaultThreads}`,
            `Output: ${config.defaultOutput}`,
            `Speed limit: ${config.defaultSpeedLimit ? (0, utils_1.formatBytes)(config.defaultSpeedLimit) + '/s' : 'None'}`,
            `Proxy: ${config.proxy || 'None'}`,
            `Concurrent: ${config.concurrentDownloads}`,
            `Notifications: ${config.notifications ? 'On' : 'Off'}`,
            `History: ${config.historyEnabled ? 'On' : 'Off'}`,
        ];
        (0, ui_1.createInfoBox)(this.screen, 'Settings', lines);
        const items = ['Edit settings', 'Back to main menu'];
        const list = (0, ui_1.createListBox)(this.screen, '', items, async (index) => {
            if (index === 0) {
                await this.promptEditSettings();
            }
            else {
                await this.showMainMenu();
            }
        }, () => this.showMainMenu());
        this.menuStack.push(list);
        this.screen.render();
    }
    async promptEditSettings() {
        const config = await (0, config_1.loadConfig)();
        const fields = [
            { label: 'Threads', value: String(config.defaultThreads), type: 'number' },
            { label: 'Output', value: config.defaultOutput, type: 'input' },
            { label: 'Speed limit (KB/s)', value: String((config.defaultSpeedLimit || 0) / 1024), type: 'number' },
        ];
        const { form } = this.createGenericForm(fields, async (values) => {
            await (0, config_1.saveConfig)({
                defaultThreads: parseInt(values['Threads'], 10),
                defaultOutput: values['Output'],
                defaultSpeedLimit: parseInt(values['Speed limit (KB/s)'], 10) * 1024,
            });
            (0, ui_1.showMessage)(this.screen, 'Settings saved!', 'success', 1500);
            await this.showSettings();
        }, () => this.showSettings());
        this.menuStack.push(form);
        this.screen.render();
    }
    async start() {
        await this.showMainMenu();
    }
    destroy() {
        this.screen.destroy();
    }
}
exports.Navigator = Navigator;
async function startNavigation(onExit) {
    const nav = new Navigator();
    if (onExit) {
        nav.setOnExit(onExit);
    }
    await nav.start();
}
//# sourceMappingURL=navigation.js.map