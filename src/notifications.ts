import notifier from 'node-notifier';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface NotificationOptions {
  title: string;
  message: string;
  icon?: string;
  sound?: boolean;
  wait?: boolean;
}

export class NotificationManager {
  private enabled: boolean = true;
  private iconPath: string;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    this.iconPath = path.join(__dirname, '../../assets/icon.png');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async notify(options: NotificationOptions): Promise<void> {
    if (!this.enabled) return;

    return new Promise((resolve) => {
      try {
        notifier.notify(
          {
            title: options.title,
            message: options.message,
            sound: options.sound !== false,
            wait: options.wait || false,
          },
          () => resolve()
        );
      } catch {
        resolve();
      }
    });
  }

  async notifyDownloadComplete(filename: string, outputPath: string, size: string): Promise<void> {
    await this.notify({
      title: 'Download Complete',
      message: `${filename}\nSaved to: ${outputPath}\nSize: ${size}`,
      sound: true,
    });
  }

  async notifyDownloadFailed(filename: string, error: string): Promise<void> {
    await this.notify({
      title: 'Download Failed',
      message: `${filename}\nError: ${error}`,
      sound: true,
    });
  }

  async notifyBatchComplete(completed: number, failed: number): Promise<void> {
    await this.notify({
      title: 'Batch Download Complete',
      message: `Completed: ${completed}${failed > 0 ? ` | Failed: ${failed}` : ''}`,
      sound: true,
    });
  }

  async notifyScheduledDownload(filename: string): Promise<void> {
    await this.notify({
      title: 'Scheduled Download Started',
      message: `Now downloading: ${filename}`,
      sound: false,
    });
  }
}

let notificationManager: NotificationManager | null = null;

export function getNotificationManager(enabled: boolean = true): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager(enabled);
  }
  return notificationManager;
}

export function setNotificationEnabled(enabled: boolean): void {
  if (notificationManager) {
    notificationManager.setEnabled(enabled);
  }
}
