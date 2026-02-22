import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import YTDlpWrap from 'yt-dlp-wrap';
import { EventEmitter } from 'events';
import type { VideoQuality, VideoInfo } from './types';

export interface YouTubeOptions {
  url: string;
  output?: string;
  format?: 'video' | 'audio' | 'best' | 'custom';
  quality?: string;
  formatId?: string;
  proxy?: string;
  cookies?: string;
}

const YT_DLP_DIR = path.join(os.homedir(), '.downlowdir', 'bin');
const YT_DLP_PATH = path.join(YT_DLP_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

export class YouTubeDownloader extends EventEmitter {
  private ytDlpWrap: YTDlpWrap;
  private progress: number = 0;
  private speed: number = 0;
  private downloaded: number = 0;
  private total: number = 0;
  private cancelled: boolean = false;

  constructor(proxy?: string) {
    super();
    this.ytDlpWrap = new YTDlpWrap(YT_DLP_PATH);
  }

  async ensureYtDlp(): Promise<string> {
    if (await fs.pathExists(YT_DLP_PATH)) {
      return YT_DLP_PATH;
    }
    
    await fs.ensureDir(YT_DLP_DIR);
    await YTDlpWrap.downloadFromGithub(YT_DLP_PATH);
    
    return YT_DLP_PATH;
  }

  async getVideoInfo(url: string, proxy?: string): Promise<VideoInfo> {
    await this.ensureYtDlp();
    
    const args = [url, '--dump-single-json', '--no-warnings'];
    if (proxy) args.push('--proxy', proxy);
    
    const info = await this.ytDlpWrap.execPromise(args);
    const data = JSON.parse(info);

    const allFormats = (data.formats || []).filter((f: Record<string, unknown>) => {
      const vcodec = f.vcodec as string;
      const acodec = f.acodec as string;
      return vcodec !== 'none' || acodec !== 'none';
    });

    const videoFormats = allFormats
      .filter((f: Record<string, unknown>) => (f.vcodec as string) !== 'none')
      .map((f: Record<string, unknown>) => ({
        formatId: (f.format_id as string) || '',
        ext: (f.ext as string) || 'mp4',
        resolution: f.width && f.height ? `${f.width}x${f.height}` : 'unknown',
        fps: f.fps as number | undefined,
        vcodec: (f.vcodec as string) || undefined,
        acodec: (f.acodec as string) || undefined,
        filesize: f.filesize as number | undefined,
        filesizeApprox: f.filesize_approx as number | undefined,
        vbr: f.vbr as number | undefined,
        abr: f.abr as number | undefined,
        note: f.format_note as string | undefined,
      }))
      .filter((f: VideoQuality) => f.resolution !== 'unknown')
      .sort((a: VideoQuality, b: VideoQuality) => {
        const getHeight = (res: string) => parseInt(res.split('x')[1] || '0');
        return getHeight(b.resolution) - getHeight(a.resolution);
      });

    const uniqueResolutions = new Map<string, VideoQuality>();
    for (const f of videoFormats) {
      const key = `${f.resolution}-${f.ext}`;
      if (!uniqueResolutions.has(key) || (f.filesize && !uniqueResolutions.get(key)?.filesize)) {
        uniqueResolutions.set(key, f);
      }
    }

    const qualities = Array.from(uniqueResolutions.values()).slice(0, 15);

    const audioFormats = allFormats
      .filter((f: Record<string, unknown>) => 
        (f.vcodec as string) === 'none' && (f.acodec as string) !== 'none'
      )
      .map((f: Record<string, unknown>) => ({
        formatId: (f.format_id as string) || '',
        ext: (f.ext as string) || 'm4a',
        resolution: 'audio only',
        acodec: (f.acodec as string) || undefined,
        filesize: f.filesize as number | undefined,
        filesizeApprox: f.filesize_approx as number | undefined,
        abr: f.abr as number | undefined,
        note: f.format_note as string | undefined,
      }))
      .filter((f: VideoQuality) => f.abr && f.abr > 0)
      .sort((a: VideoQuality, b: VideoQuality) => (b.abr || 0) - (a.abr || 0))
      .slice(0, 5);

    return {
      title: data.title || 'Unknown',
      duration: data.duration || 0,
      thumbnail: data.thumbnail || '',
      description: (data.description as string || '').substring(0, 200),
      uploader: data.uploader || 'Unknown',
      viewCount: data.view_count || 0,
      qualities,
      audioQualities: audioFormats,
    };
  }

  async download(options: YouTubeOptions): Promise<string> {
    await this.ensureYtDlp();
    this.cancelled = false;
    
    const outputPath = options.output || process.cwd();
    const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
    
    const args: string[] = [
      options.url,
      '-o', outputTemplate,
      '--no-mtime',
      '--progress',
      '--newline',
      '--no-playlist',
    ];

    if (options.proxy) {
      args.push('--proxy', options.proxy);
    }

    if (options.cookies) {
      args.push('--cookies', options.cookies);
    }

    if (options.formatId) {
      if (options.formatId.includes('+')) {
        args.push('-f', options.formatId);
      } else {
        args.push('-f', `${options.formatId}+bestaudio/best`);
      }
    } else if (options.format === 'audio') {
      args.push('-f', 'bestaudio/best');
      args.push('-x');
      args.push('--audio-format', 'mp3');
      args.push('--audio-quality', '0');
    } else if (options.quality) {
      args.push('-f', options.quality);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }

    if (options.format === 'video' && !options.formatId && !options.quality) {
      args.push('--merge-output-format', 'mp4');
    }

    return new Promise((resolve, reject) => {
      const ytProcess = this.ytDlpWrap.exec(args);

      ytProcess.on('progress', (progressData: unknown) => {
        if (this.cancelled) return;
        const p = progressData as { percent?: number; currentSpeed?: number; totalBytes?: number; currentBytes?: number };
        this.progress = p.percent || 0;
        this.speed = p.currentSpeed || 0;
        this.total = p.totalBytes || 0;
        this.downloaded = p.currentBytes || 0;
        this.emit('progress', {
          progress: this.progress,
          speed: this.speed,
          total: this.total,
          downloaded: this.downloaded,
        });
      });

      ytProcess.on('ytDlpEvent', (eventType: string, eventData: string) => {
        if (this.cancelled) return;
        if (eventType === 'download') {
          const match = eventData.match(/(\d+\.?\d*)%/);
          if (match) {
            this.progress = parseFloat(match[1]);
            this.emit('progress', { progress: this.progress, speed: this.speed });
          }
        }
      });

      ytProcess.on('close', (code: number | null) => {
        if (this.cancelled) {
          reject(new Error('Download cancelled'));
          return;
        }
        if (code === 0) {
          this.emit('complete');
          resolve(outputPath);
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      ytProcess.on('error', (err: Error) => {
        if (!this.cancelled) {
          reject(err);
        }
      });
    });
  }

  cancel(): void {
    this.cancelled = true;
    this.emit('cancelled');
  }

  getProgress() {
    return {
      progress: this.progress,
      speed: this.speed,
      downloaded: this.downloaded,
      total: this.total,
    };
  }
}
