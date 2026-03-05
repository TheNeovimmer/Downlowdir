/* eslint-disable @typescript-eslint/no-explicit-any */
import * as blessed from 'blessed';
import {
  createScreen,
  createFooter,
  createHeader,
  createStatusBar,
  createInfoBox,
  createListBox,
  createSearchBox,
  createForm,
  createConfirmDialog,
  createLogBox,
  clearScreenChildren,
  showMessage,
  theme,
  createMainMenu,
} from './ui';
import { loadConfig, saveConfig } from './config';
import { getHistoryManager } from './history';
import { getScheduler } from './scheduler';
import { getCategoryManager } from './categories';
import { formatBytes, formatDate, formatTime, formatDuration } from './utils';
import type { DownloadStatus } from './types';
import * as fs from 'fs-extra';
import * as path from 'path';

export type NavigationCallback = () => void | Promise<void>;

export interface MenuItem {
  label: string;
  action: NavigationCallback;
  submenu?: MenuItem[];
}

export class Navigator {
  private screen: blessed.Widgets.Screen;
  private header: any;
  private footer: any;
  private currentScreen: string = 'main';
  private menuStack: any[] = [];
  private onExit: (() => void) | null = null;

  constructor() {
    this.screen = createScreen();
    this.header = createHeader(this.screen);
    this.footer = createFooter(this.screen);
    this.setupKeyHandlers();
  }

  private setupKeyHandlers(): void {
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

  public setOnExit(callback: () => void): void {
    this.onExit = callback;
  }

  public async showMainMenu(): Promise<void> {
    clearScreenChildren(this.screen);
    this.header = createHeader(this.screen);
    this.footer = createFooter(this.screen);

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

    const menu = createMainMenu(
      this.screen,
      menuOptions,
      async (index) => {
        await this.handleMenuSelection(index);
      },
      () => {
        if (this.onExit) {
          this.onExit();
        }
        process.exit(0);
      }
    );

    this.menuStack.push(menu);
    this.screen.render();
  }

  private async handleMenuSelection(index: number): Promise<void> {
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

  private async promptForDownload(): Promise<void> {
    clearScreenChildren(this.screen);
    createHeader(this.screen);
    createFooter(this.screen);

    const { box, input } = this.createInputBox('Enter URL to download:', 'URL:');

    input.focus();
    this.screen.render();

    input.on('submit', () => {
      const url = input.getValue().trim();
      if (url) {
        this.screen.remove(box);
        this.screen.render();
        showMessage(this.screen, `Starting download: ${url.substring(0, 30)}...`, 'success', 2000);
        setTimeout(() => this.showMainMenu(), 2500);
      } else {
        showMessage(this.screen, 'URL is required', 'error', 1500);
      }
    });
  }

  private async promptForPlaylist(): Promise<void> {
    clearScreenChildren(this.screen);
    createHeader(this.screen);
    createFooter(this.screen);

    const { box, input } = this.createInputBox('Enter playlist URL:', 'Playlist URL:');

    input.focus();
    this.screen.render();

    input.on('submit', () => {
      const url = input.getValue().trim();
      if (url) {
        this.screen.remove(box);
        this.screen.render();
        showMessage(this.screen, `Starting playlist: ${url.substring(0, 30)}...`, 'success', 2000);
        setTimeout(() => this.showMainMenu(), 2500);
      } else {
        showMessage(this.screen, 'URL is required', 'error', 1500);
      }
    });
  }

  private createInputBox(prompt: string, _label: string): { box: any; input: any } {
    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 7,
      border: { type: 'line' as const, fg: theme.primary as any },
      style: {
        fg: theme.text,
        border: { fg: theme.primary as any },
      },
    });

    blessed.text({
      parent: box,
      top: 1,
      left: 3,
      content: prompt,
      style: { fg: theme.text },
    });

    const input = blessed.textbox({
      parent: box,
      top: 3,
      left: 3,
      width: '90%',
      height: 1,
      border: { type: 'line' as const, fg: theme.muted as any },
      inputOnFocus: true,
      style: {
        fg: theme.text,
      },
    });

    return { box, input };
  }

  private async showBatchDownload(): Promise<void> {
    clearScreenChildren(this.screen);
    createHeader(this.screen);
    createFooter(this.screen);

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
          showMessage(this.screen, `Processing: ${filePath}`, 'success', 2000);
          setTimeout(() => this.showMainMenu(), 2500);
        } else {
          showMessage(this.screen, 'File not found', 'error', 1500);
        }
      } else {
        showMessage(this.screen, 'File path required', 'error', 1500);
      }
    });
  }

  private async showScheduleDownload(): Promise<void> {
    clearScreenChildren(this.screen);
    createHeader(this.screen);
    createFooter(this.screen);

    const items = [
      'Schedule new download',
      'View scheduled downloads',
      'Back to main menu',
    ];

    const list = createListBox(
      this.screen,
      'Schedule Options',
      items,
      async (index) => {
        if (index === 0) {
          await this.promptForSchedule();
        } else if (index === 1) {
          await this.showScheduledList();
        } else {
          await this.showMainMenu();
        }
      },
      () => this.showMainMenu()
    );

    this.menuStack.push(list);
    this.screen.render();
  }

  private async promptForSchedule(): Promise<void> {
    clearScreenChildren(this.screen);
    createHeader(this.screen);
    createFooter(this.screen);

    const { box, input } = this.createInputBox('Enter URL to schedule:', 'URL:');

    input.focus();
    this.screen.render();

    input.on('submit', () => {
      const url = input.getValue().trim();
      if (url) {
        this.screen.remove(box);
        this.screen.render();
        const scheduler = getScheduler();
        scheduler.addDownload({
          url,
          output: '.',
          scheduledTime: new Date(Date.now() + 60 * 60 * 1000),
        });
        showMessage(this.screen, 'Download scheduled for 1 hour from now', 'success', 2000);
        setTimeout(() => this.showMainMenu(), 2500);
      } else {
        showMessage(this.screen, 'URL is required', 'error', 1500);
      }
    });
  }

  private async showScheduledList(): Promise<void> {
    const scheduler = getScheduler();
    const scheduled = scheduler.getScheduleStats();

    const content = [
      `Pending: ${scheduled.pending}`,
      `Completed: ${scheduled.completed}`,
      `Failed: ${scheduled.failed}`,
    ];

    createInfoBox(this.screen, 'Scheduled Downloads', content);

    const { box, input } = this.createInputBox('Press Enter to go back', '');

    this.screen.key(['enter'], () => {
      this.screen.remove(box);
      this.showScheduleDownload();
    });

    this.screen.render();
  }

  private async showResumeDownloads(): Promise<void> {
    const config = await loadConfig();
    const tempDir = config.tempDir;

    if (!(await fs.pathExists(tempDir))) {
      showMessage(this.screen, 'No paused downloads', 'info', 2000);
      await this.showMainMenu();
      return;
    }

    const files = await fs.readdir(tempDir);
    const stateFiles = files.filter((f: string) => f.endsWith('.json'));

    if (stateFiles.length === 0) {
      showMessage(this.screen, 'No paused downloads', 'info', 2000);
      await this.showMainMenu();
      return;
    }

    const items = stateFiles.map((f: string) => f.replace('.json', ''));

    const list = createListBox(
      this.screen,
      'Select download to resume',
      [...items, 'Back to main menu'],
      async (index) => {
        if (index < stateFiles.length) {
          showMessage(this.screen, `Resuming: ${items[index]}`, 'success', 1500);
        }
        await this.showMainMenu();
      },
      () => this.showMainMenu()
    );

    this.menuStack.push(list);
    this.screen.render();
  }

  private async showDownloadQueue(): Promise<void> {
    const config = await loadConfig();
    const tempDir = config.tempDir;

    if (!(await fs.pathExists(tempDir))) {
      showMessage(this.screen, 'Queue is empty', 'info', 2000);
      await this.showMainMenu();
      return;
    }

    const files = await fs.readdir(tempDir);
    const stateFiles = files.filter((f: string) => f.endsWith('.json'));

    if (stateFiles.length === 0) {
      showMessage(this.screen, 'Queue is empty', 'info', 2000);
      await this.showMainMenu();
      return;
    }

    const queueItems: string[] = [];
    for (const file of stateFiles) {
      const state = await fs.readJson(path.join(tempDir, file));
      const progress = state.totalSize > 0
        ? ((state.chunks.reduce((s: number, c: { downloaded: number }) => s + c.downloaded, 0) / state.totalSize) * 100).toFixed(1)
        : '0';
      queueItems.push(`${file.replace('.json', '')} - ${progress}%`);
    }

    queueItems.push('Back to main menu');

    const list = createListBox(
      this.screen,
      'Download Queue',
      queueItems,
      async (_index) => {
        await this.showMainMenu();
      },
      () => this.showMainMenu()
    );

    this.menuStack.push(list);
    this.screen.render();
  }

  private async showHistory(): Promise<void> {
    const config = await loadConfig();
    const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);
    await history.load();

    const entries = history.getRecent(20);

    if (entries.length === 0) {
      showMessage(this.screen, 'No download history', 'info', 2000);
      await this.showMainMenu();
      return;
    }

    const items = entries.map(e =>
      `${e.status === 'completed' ? '✓' : e.status === 'failed' ? '✗' : '○'} ${e.filename.substring(0, 35)} - ${formatDate(new Date(e.startTime))}`
    );

    items.push('Back to main menu');

    const list = createListBox(
      this.screen,
      'Download History',
      items,
      () => this.showMainMenu(),
      () => this.showMainMenu(),
      { searchable: true }
    );

    this.menuStack.push(list);
    this.screen.render();
  }

  private async showCategories(): Promise<void> {
    const categoryManager = getCategoryManager();
    const categories = categoryManager.getAll();

    const items = categories.map(c =>
      `${c.name} - ${c.patterns.length} patterns`
    );

    items.push('Add category');
    items.push('Reset categories');
    items.push('Back to main menu');

    const list = createListBox(
      this.screen,
      'Categories',
      items,
      async (index) => {
        if (index === categories.length) {
          await this.promptAddCategory();
        } else if (index === categories.length + 1) {
          categoryManager.reset();
          showMessage(this.screen, 'Categories reset!', 'success', 1500);
          await this.showCategories();
        } else {
          showMessage(this.screen, `Category: ${categories[index].name}`, 'info', 1500);
          await this.showMainMenu();
        }
      },
      () => this.showMainMenu()
    );

    this.menuStack.push(list);
    this.screen.render();
  }

  private async promptAddCategory(): Promise<void> {
    clearScreenChildren(this.screen);
    createHeader(this.screen);
    createFooter(this.screen);

    const { form } = this.createCategoryForm(async (values) => {
      const categoryManager = getCategoryManager();
      categoryManager.add({
        name: values['Category name'] as string,
        color: values['Color'] as string || '#FFFFFF',
        patterns: (values['Patterns'] as string || '').split(',').map((p: string) => p.trim()),
        outputTemplate: '%(title)s.%(ext)s',
        autoAssign: true,
      });
      showMessage(this.screen, 'Category added!', 'success', 1500);
      await this.showCategories();
    }, () => this.showCategories());

    this.menuStack.push(form);
    this.screen.render();
  }

  private createCategoryForm(
    onSubmit: (values: Record<string, string | boolean>) => void,
    onCancel: () => void
  ): { form: any; inputs: Record<string, any> } {
    const fields: { label: string; value: string; type?: 'input' | 'number' | 'confirm' }[] = [
      { label: 'Category name', value: '', type: 'input' },
      { label: 'Color', value: '#FFFFFF', type: 'input' },
      { label: 'Patterns', value: '', type: 'input' },
    ];

    return this.createGenericForm(fields, onSubmit, onCancel);
  }

  private createGenericForm(
    fields: { label: string; value: string; type?: 'input' | 'number' | 'confirm' }[],
    onSubmit: (values: Record<string, string | boolean>) => void,
    onCancel: () => void
  ): { form: any; inputs: Record<string, any> } {
    const formHeight = fields.length * 3 + 5;
    const formBox = blessed.form({
      parent: this.screen,
      top: 6,
      left: 'center',
      width: '60%',
      height: formHeight,
      border: { type: 'line' as const, fg: theme.primary as any },
      style: {
        fg: theme.text,
        border: { fg: theme.primary as any },
      },
    });

    const inputs: Record<string, any> = {};

    fields.forEach((field, index) => {
      const y = index * 3 + 1;

      blessed.text({
        parent: formBox,
        top: y,
        left: 3,
        content: field.label + ':',
        style: { fg: theme.text },
      });

      const input = blessed.textbox({
        parent: formBox,
        top: y + 1,
        left: 3,
        width: '90%',
        height: 1,
        border: { type: 'line' as const, fg: theme.muted as any },
        inputOnFocus: true,
        value: field.value,
        style: {
          fg: theme.text,
          focus: { border: { fg: theme.primary as any } },
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
        bg: theme.success as any,
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
        bg: theme.error as any,
        bold: true,
      },
    });

    submitBtn.on('press', () => {
      const values: Record<string, string | boolean> = {};
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

  private async showStatistics(): Promise<void> {
    const config = await loadConfig();
    const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);
    const scheduler = getScheduler();

    await history.load();

    const stats = history.getStats();
    const scheduleStats = scheduler.getScheduleStats();
    const nextScheduled = scheduler.getNextScheduled();

    const lines = [
      `Total Downloads: ${stats.total}`,
      `Completed: ${stats.completed}`,
      `Failed: ${stats.failed}`,
      `Total Size: ${formatBytes(stats.totalSize)}`,
      '',
      `Scheduled - Pending: ${scheduleStats.pending}`,
    ];

    if (nextScheduled) {
      lines.push(`Next: ${formatDate(new Date(nextScheduled.scheduledTime))} at ${formatTime(new Date(nextScheduled.scheduledTime))}`);
    }

    createInfoBox(this.screen, 'Statistics', lines);

    const { box } = this.createInputBox('Press Enter to go back', '');

    this.screen.key(['enter'], () => {
      this.screen.remove(box);
      this.showMainMenu();
    });

    this.screen.render();
  }

  private async showSettings(): Promise<void> {
    const config = await loadConfig();

    const lines = [
      `Threads: ${config.defaultThreads}`,
      `Output: ${config.defaultOutput}`,
      `Speed limit: ${config.defaultSpeedLimit ? formatBytes(config.defaultSpeedLimit) + '/s' : 'None'}`,
      `Proxy: ${config.proxy || 'None'}`,
      `Concurrent: ${config.concurrentDownloads}`,
      `Notifications: ${config.notifications ? 'On' : 'Off'}`,
      `History: ${config.historyEnabled ? 'On' : 'Off'}`,
    ];

    createInfoBox(this.screen, 'Settings', lines);

    const items = ['Edit settings', 'Back to main menu'];

    const list = createListBox(
      this.screen,
      '',
      items,
      async (index) => {
        if (index === 0) {
          await this.promptEditSettings();
        } else {
          await this.showMainMenu();
        }
      },
      () => this.showMainMenu()
    );

    this.menuStack.push(list);
    this.screen.render();
  }

  private async promptEditSettings(): Promise<void> {
    const config = await loadConfig();

    const fields: { label: string; value: string; type?: 'input' | 'number' | 'confirm' }[] = [
      { label: 'Threads', value: String(config.defaultThreads), type: 'number' },
      { label: 'Output', value: config.defaultOutput, type: 'input' },
      { label: 'Speed limit (KB/s)', value: String((config.defaultSpeedLimit || 0) / 1024), type: 'number' },
    ];

    const { form } = this.createGenericForm(fields, async (values) => {
      await saveConfig({
        defaultThreads: parseInt(values['Threads'] as string, 10),
        defaultOutput: values['Output'] as string,
        defaultSpeedLimit: parseInt(values['Speed limit (KB/s)'] as string, 10) * 1024,
      });
      showMessage(this.screen, 'Settings saved!', 'success', 1500);
      await this.showSettings();
    }, () => this.showSettings());

    this.menuStack.push(form);
    this.screen.render();
  }

  public async start(): Promise<void> {
    await this.showMainMenu();
  }

  public destroy(): void {
    this.screen.destroy();
  }
}

export async function startNavigation(onExit?: () => void): Promise<void> {
  const nav = new Navigator();
  if (onExit) {
    nav.setOnExit(onExit);
  }
  await nav.start();
}
