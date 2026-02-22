import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import type { DownloadTask, DownloadOptions, Config } from './types';
import { DownloadStatus as DS } from './types';
import { Downloader } from './downloader';

const QUEUE_FILE = path.join(os.homedir(), '.downlowdir', 'queue.json');

interface QueueState {
  tasks: DownloadTask[];
}

export class DownloadQueue extends EventEmitter {
  private downloaders: Map<string, Downloader> = new Map();
  private config: Config;
  private maxConcurrent: number;
  private activeCount: number = 0;
  private queue: string[] = [];

  constructor(config: Config, maxConcurrent: number = 3) {
    super();
    this.config = config;
    this.maxConcurrent = maxConcurrent;
  }

  async add(options: DownloadOptions): Promise<string> {
    const downloader = new Downloader(options, this.config);
    const task = downloader.getTask();

    this.downloaders.set(task.id, downloader);
    this.queue.push(task.id);

    downloader.on('start', (t: DownloadTask) => this.emit('task-start', t));
    downloader.on('progress', (t: DownloadTask) => this.emit('task-progress', t));
    downloader.on('complete', (t: DownloadTask) => {
      this.activeCount--;
      this.emit('task-complete', t);
      this.processQueue();
    });
    downloader.on('error', (t: DownloadTask, err: Error) => {
      this.activeCount--;
      this.emit('task-error', t, err);
      this.processQueue();
    });
    downloader.on('pause', (t: DownloadTask) => this.emit('task-pause', t));
    downloader.on('resume', (t: DownloadTask) => this.emit('task-resume', t));
    downloader.on('cancel', (t: DownloadTask) => {
      this.activeCount--;
      this.emit('task-cancel', t);
    });

    await this.saveQueue();
    this.emit('task-added', task);

    this.processQueue();

    return task.id;
  }

  private processQueue(): void {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const taskId = this.queue.shift();
      if (taskId) {
        const downloader = this.downloaders.get(taskId);
        if (downloader) {
          this.activeCount++;
          downloader.start();
        }
      }
    }
  }

  async pause(id: string): Promise<void> {
    const downloader = this.downloaders.get(id);
    if (downloader) {
      await downloader.pause();
    }
  }

  async resume(id: string): Promise<void> {
    const downloader = this.downloaders.get(id);
    if (downloader) {
      this.activeCount++;
      await downloader.resume();
    }
  }

  async cancel(id: string): Promise<void> {
    const downloader = this.downloaders.get(id);
    if (downloader) {
      await downloader.cancel();
      this.downloaders.delete(id);
      await this.saveQueue();
    }
  }

  getTask(id: string): DownloadTask | undefined {
    const downloader = this.downloaders.get(id);
    return downloader?.getTask();
  }

  getAllTasks(): DownloadTask[] {
    const tasks: DownloadTask[] = [];
    this.downloaders.forEach(downloader => {
      tasks.push(downloader.getTask());
    });
    return tasks;
  }

  async clearCompleted(): Promise<void> {
    const toDelete: string[] = [];
    this.downloaders.forEach((downloader, id) => {
      const task = downloader.getTask();
      if (task.status === DS.Completed || task.status === DS.Cancelled || task.status === DS.Failed) {
        toDelete.push(id);
      }
    });
    for (const id of toDelete) {
      this.downloaders.delete(id);
    }
    await this.saveQueue();
  }

  private async saveQueue(): Promise<void> {
    const state: QueueState = {
      tasks: this.getAllTasks(),
    };
    await fs.ensureDir(path.dirname(QUEUE_FILE));
    await fs.writeJson(QUEUE_FILE, state, { spaces: 2 });
  }

  async loadQueue(): Promise<void> {
    try {
      if (await fs.pathExists(QUEUE_FILE)) {
        const state: QueueState = await fs.readJson(QUEUE_FILE);
        for (const task of state.tasks) {
          if (task.status === DS.Downloading || task.status === DS.Pending) {
            await this.add({
              url: task.url,
              output: task.output,
              threads: task.threads,
              resume: task.resume,
              speedLimit: task.speedLimit,
              headers: task.headers,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }
}
