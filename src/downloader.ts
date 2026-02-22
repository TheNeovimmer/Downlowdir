import * as axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import type { DownloadOptions, DownloadTask, DownloadStatus, DownloadState, ChunkInfo, Config } from './types';
import { DownloadStatus as DS } from './types';
import { loadConfig, ensureTempDir } from './config';

export class Downloader extends EventEmitter {
  private task: DownloadTask;
  private config: Config;
  private abortControllers: AbortController[] = [];
  private stateFile: string = '';
  private state: DownloadState | null = null;
  private speedInterval: ReturnType<typeof setInterval> | null = null;
  private lastDownloaded: number = 0;
  private paused: boolean = false;

  constructor(options: DownloadOptions, config: Config) {
    super();
    this.config = config;
    
    let outputPath = options.output || this.getFilenameFromUrl(options.url);
    if (options.output && !path.extname(options.output)) {
      const filename = this.extractFilename(options.url);
      outputPath = path.join(options.output, filename);
    }
    
    this.task = {
      id: this.generateId(options.url),
      url: options.url,
      output: outputPath,
      threads: options.threads || config.defaultThreads,
      resume: options.resume ?? true,
      speedLimit: options.speedLimit || config.defaultSpeedLimit,
      headers: options.headers || {},
      status: DS.Pending,
      progress: 0,
      totalSize: 0,
      downloadedSize: 0,
      speed: 0,
      startTime: 0,
    };
  }

  private generateId(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  }

  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'download';
    } catch {
      return 'download';
    }
  }

  private getFilenameFromUrl(url: string): string {
    return path.join(this.config.defaultOutput, this.extractFilename(url));
  }

  getTask(): DownloadTask {
    return { ...this.task };
  }

  async start(): Promise<void> {
    this.task.status = DS.Downloading;
    this.task.startTime = Date.now();
    this.emit('start', this.task);

    try {
      const tempDir = await ensureTempDir();
      this.stateFile = path.join(tempDir, `${this.task.id}.json`);

      const contentLength = await this.getContentLength();
      this.task.totalSize = contentLength;

      if (this.task.resume && await fs.pathExists(this.stateFile)) {
        await this.loadState();
      } else {
        await this.initializeChunks(contentLength);
      }

      await this.downloadChunks();
      
      if (!this.paused) {
        await this.mergeChunks();
        await this.cleanup();
        this.task.status = DS.Completed;
        this.task.endTime = Date.now();
        this.emit('complete', this.task);
      }
    } catch (error) {
      if (!this.paused) {
        this.task.status = DS.Failed;
        this.task.error = error instanceof Error ? error.message : String(error);
        this.emit('error', this.task, error);
      }
    } finally {
      this.stopSpeedMonitor();
    }
  }

  private async getContentLength(): Promise<number> {
    const response = await axios.default.head(this.task.url, {
      headers: this.task.headers,
    });
    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (!contentLength) {
      throw new Error('Unable to determine file size. Server may not support range requests.');
    }
    return contentLength;
  }

  private async initializeChunks(totalSize: number): Promise<void> {
    const tempDir = await ensureTempDir();
    const chunkSize = Math.ceil(totalSize / this.task.threads);
    
    const chunks: ChunkInfo[] = [];
    for (let i = 0; i < this.task.threads; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, totalSize - 1);
      if (start <= end) {
        chunks.push({
          start,
          end,
          downloaded: 0,
          file: path.join(tempDir, `${this.task.id}.part${i}`),
        });
      }
    }

    this.state = {
      url: this.task.url,
      output: this.task.output,
      totalSize,
      chunks,
      startTime: Date.now(),
      headers: this.task.headers,
    };

    await this.saveState();
  }

  private async loadState(): Promise<void> {
    this.state = await fs.readJson(this.stateFile);
    this.task.totalSize = this.state!.totalSize;
    const totalDownloaded = this.state!.chunks.reduce((sum, chunk) => sum + chunk.downloaded, 0);
    this.task.downloadedSize = totalDownloaded;
    this.updateProgress();
  }

  private async saveState(): Promise<void> {
    if (this.state) {
      await fs.writeJson(this.stateFile, this.state, { spaces: 2 });
    }
  }

  private async downloadChunks(): Promise<void> {
    if (!this.state) return;

    this.startSpeedMonitor();

    const promises = this.state.chunks.map((chunk, index) => 
      this.downloadChunk(chunk, index)
    );

    await Promise.all(promises);
  }

  private async downloadChunk(chunk: ChunkInfo, _index: number): Promise<void> {
    if (chunk.downloaded >= (chunk.end - chunk.start + 1)) {
      return;
    }

    const startByte = chunk.start + chunk.downloaded;
    const endByte = chunk.end;

    const controller = new AbortController();
    this.abortControllers.push(controller);

    const range = `bytes=${startByte}-${endByte}`;

    try {
      const response = await axios.default({
        method: 'get',
        url: this.task.url,
        headers: {
          ...this.task.headers,
          Range: range,
        },
        responseType: 'stream',
        signal: controller.signal,
        timeout: 0,
      });

      const writer = fs.createWriteStream(chunk.file, {
        flags: 'a',
        start: chunk.downloaded,
      });

      let lastSave = Date.now();
      let downloadedThisChunk = chunk.downloaded;

      await new Promise((resolve, reject) => {
        response.data.on('data', (data: Buffer) => {
          if (this.paused) {
            controller.abort();
            return;
          }

          const chunkData = data;
          writer.write(chunkData);
          downloadedThisChunk += chunkData.length;
          chunk.downloaded = downloadedThisChunk;
          this.task.downloadedSize += chunkData.length;
          this.updateProgress();

          if (Date.now() - lastSave > 1000) {
            this.saveState();
            lastSave = Date.now();
          }
        });

        response.data.on('end', () => {
          writer.end();
          resolve(undefined);
        });

        response.data.on('error', (err: Error) => {
          writer.end();
          reject(err);
        });

        writer.on('error', reject);
      });

    } catch (error) {
      if (!this.paused && !axios.default.isCancel(error)) {
        throw error;
      }
    }
  }

  private startSpeedMonitor(): void {
    this.lastDownloaded = this.task.downloadedSize;
    this.speedInterval = setInterval(() => {
      const now = this.task.downloadedSize;
      this.task.speed = now - this.lastDownloaded;
      this.lastDownloaded = now;
      this.emit('progress', this.task);
    }, 1000);
  }

  private stopSpeedMonitor(): void {
    if (this.speedInterval) {
      clearInterval(this.speedInterval);
      this.speedInterval = null;
    }
  }

  private updateProgress(): void {
    if (this.task.totalSize > 0) {
      this.task.progress = (this.task.downloadedSize / this.task.totalSize) * 100;
    }
  }

  private async mergeChunks(): Promise<void> {
    if (!this.state) return;

    await fs.ensureDir(path.dirname(this.state.output));

    const outputStream = fs.createWriteStream(this.state.output);

    for (const chunk of this.state.chunks) {
      if (await fs.pathExists(chunk.file)) {
        const chunkData = await fs.readFile(chunk.file);
        outputStream.write(chunkData);
        await fs.unlink(chunk.file);
      }
    }

    await new Promise<void>((resolve, reject) => {
      outputStream.end(() => resolve());
      outputStream.on('error', reject);
    });
  }

  async pause(): Promise<void> {
    this.paused = true;
    this.task.status = DS.Paused;
    this.abortControllers.forEach(controller => controller.abort());
    await this.saveState();
    this.emit('pause', this.task);
  }

  async resume(): Promise<void> {
    this.paused = false;
    this.task.status = DS.Downloading;
    this.emit('resume', this.task);
    await this.start();
  }

  async cancel(): Promise<void> {
    this.paused = true;
    this.task.status = DS.Cancelled;
    this.abortControllers.forEach(controller => controller.abort());
    await this.cleanup();
    this.emit('cancel', this.task);
  }

  private async cleanup(): Promise<void> {
    if (this.state) {
      for (const chunk of this.state.chunks) {
        if (await fs.pathExists(chunk.file)) {
          await fs.unlink(chunk.file);
        }
      }
    }
    if (await fs.pathExists(this.stateFile)) {
      await fs.unlink(this.stateFile);
    }
  }
}
