import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import YTDlpWrap from 'yt-dlp-wrap';
import { EventEmitter } from 'events';
import type { VideoQuality, VideoInfo, PlaylistInfo, PlaylistVideo, PlaylistOptions, SubtitleInfo } from './types';

const YT_DLP_DIR = path.join(os.homedir(), '.downlowdir', 'bin');
const YT_DLP_PATH = path.join(YT_DLP_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

export interface YouTubeDownloadOptions {
  url: string;
  output?: string;
  format?: 'video' | 'audio' | 'best';
  quality?: string;
  formatId?: string;
  proxy?: string;
  cookies?: string;
}

export interface PlaylistDownloadOptions extends YouTubeDownloadOptions {
  playlist?: PlaylistOptions;
}

export class YouTubeDownloader extends EventEmitter {
  private ytDlpWrap: YTDlpWrap;
  private progress: number = 0;
  private speed: number = 0;
  private downloaded: number = 0;
  private total: number = 0;
  private cancelled: boolean = false;
  private currentIndex: number = 0;
  private totalVideos: number = 0;

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
    
    const args = [url, '--dump-single-json', '--no-warnings', '--no-playlist'];
    if (proxy) args.push('--proxy', proxy);
    
    const info = await this.ytDlpWrap.execPromise(args);
    const data = JSON.parse(info);

    return this.parseVideoInfo(data, false);
  }

  async getPlaylistInfo(url: string, proxy?: string): Promise<PlaylistInfo> {
    await this.ensureYtDlp();
    
    const args = [
      url,
      '--flat-playlist',
      '--dump-single-json',
      '--no-warnings',
    ];
    if (proxy) args.push('--proxy', proxy);
    
    const info = await this.ytDlpWrap.execPromise(args);
    const data = JSON.parse(info);

    const videos: PlaylistVideo[] = (data.entries || []).map((entry: Record<string, unknown>, index: number) => ({
      index: index + 1,
      id: entry.id as string || '',
      title: entry.title as string || 'Unknown',
      url: entry.url as string || `https://www.youtube.com/watch?v=${entry.id}`,
      duration: entry.duration as number || 0,
      thumbnail: entry.thumbnail as string || '',
    }));

    return {
      title: data.title || 'Unknown Playlist',
      id: data.id || '',
      url,
      channel: data.channel || data.uploader || 'Unknown',
      channelUrl: data.channel_url || data.uploader_url || '',
      thumbnail: data.thumbnail || '',
      count: videos.length,
      videos,
    };
  }

  private parseVideoInfo(data: Record<string, unknown>, isPlaylist: boolean = false): VideoInfo {
    const formats = data.formats as Array<Record<string, unknown>> | undefined;
    const allFormats = (formats || []).filter((f: Record<string, unknown>) => {
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

    const subtitles: SubtitleInfo[] = [];
    if (data.subtitles) {
      const subs = data.subtitles as Record<string, unknown>;
      for (const [lang, langData] of Object.entries(subs)) {
        const formats = langData as Record<string, unknown>[];
        for (const fmt of formats) {
          if (fmt.ext && fmt.url) {
            subtitles.push({
              lang: lang,
              langCode: lang,
              url: fmt.url as string,
              ext: fmt.ext as string,
            });
          }
        }
      }
    }

    return {
      title: (data.title as string) || 'Unknown',
      duration: (data.duration as number) || 0,
      thumbnail: (data.thumbnail as string) || '',
      description: ((data.description as string) || '').substring(0, 200),
      uploader: (data.uploader as string) || 'Unknown',
      uploaderUrl: (data.uploader_url as string) || '',
      viewCount: (data.view_count as number) || 0,
      qualities,
      audioQualities: audioFormats,
      subtitles: subtitles.length > 0 ? subtitles : undefined,
      isPlaylist,
      playlistCount: isPlaylist ? ((data.playlist_count as number) || 0) : undefined,
      playlistIndex: data.playlist_index as number | undefined,
    };
  }

  async download(options: YouTubeDownloadOptions): Promise<string> {
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
    ];

    if (!options.url.includes('playlist')) {
      args.push('--no-playlist');
    }

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
          videoIndex: this.currentIndex,
          totalVideos: this.totalVideos,
        });
      });

      ytProcess.on('ytDlpEvent', (eventType: string, eventData: string) => {
        if (this.cancelled) return;
        if (eventType === 'download') {
          const match = eventData.match(/(\d+\.?\d*)%/);
          if (match) {
            this.progress = parseFloat(match[1]);
            this.emit('progress', { 
              progress: this.progress, 
              speed: this.speed,
              videoIndex: this.currentIndex,
              totalVideos: this.totalVideos,
            });
          }
          
          const indexMatch = eventData.match(/\[download\]\s+(\d+)\/(\d+)\s+items?/);
          if (indexMatch) {
            this.currentIndex = parseInt(indexMatch[1], 10);
            this.totalVideos = parseInt(indexMatch[2], 10);
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

  async downloadPlaylist(options: PlaylistDownloadOptions): Promise<{ success: number; failed: number; outputPath: string }> {
    await this.ensureYtDlp();
    this.cancelled = false;
    
    const outputPath = options.output || process.cwd();
    const playlistOpts = options.playlist || {};
    
    const args: string[] = [
      options.url,
      '-o', path.join(outputPath, '%(playlist_title)s', '%(title)s.%(ext)s'),
      '--no-mtime',
      '--progress',
      '--newline',
    ];

    if (playlistOpts.start) {
      args.push('--playlist-start', String(playlistOpts.start));
    }
    if (playlistOpts.end) {
      args.push('--playlist-end', String(playlistOpts.end));
    }
    if (playlistOpts.reverse) {
      args.push('--playlist-reverse');
    }
    if (playlistOpts.shuffle) {
      args.push('--playlist-random');
    }

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
    } else if (options.quality) {
      args.push('-f', options.quality);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }

    if (options.format === 'video') {
      args.push('--merge-output-format', 'mp4');
    }

    let success = 0;
    let failed = 0;

    return new Promise((resolve, reject) => {
      const ytProcess = this.ytDlpWrap.exec(args);

      ytProcess.on('progress', (progressData: unknown) => {
        if (this.cancelled) return;
        const p = progressData as { percent?: number; currentSpeed?: number; totalBytes?: number; currentBytes?: number };
        this.progress = p.percent || 0;
        this.speed = p.currentSpeed || 0;
        this.emit('progress', {
          progress: this.progress,
          speed: this.speed,
          videoIndex: this.currentIndex,
          totalVideos: this.totalVideos,
        });
      });

      ytProcess.on('ytDlpEvent', (eventType: string, eventData: string) => {
        if (this.cancelled) return;
        
        const indexMatch = eventData.match(/\[download\]\s+Downloading item (\d+) of (\d+)/);
        if (indexMatch) {
          this.currentIndex = parseInt(indexMatch[1], 10);
          this.totalVideos = parseInt(indexMatch[2], 10);
        }

        const finishedMatch = eventData.match(/\[download\]\s+Finished downloading playlist/);
        if (finishedMatch) {
          success = this.totalVideos;
        }

        if (eventType === 'download') {
          const match = eventData.match(/(\d+\.?\d*)%/);
          if (match) {
            this.progress = parseFloat(match[1]);
            this.emit('progress', { 
              progress: this.progress, 
              speed: this.speed,
              videoIndex: this.currentIndex,
              totalVideos: this.totalVideos,
            });
          }
        }
      });

      ytProcess.on('close', (code: number | null) => {
        if (this.cancelled) {
          reject(new Error('Download cancelled'));
          return;
        }
        if (code === 0) {
          this.emit('complete', { success, failed });
          resolve({ success: success || this.totalVideos, failed, outputPath });
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

  async downloadWithSubtitles(options: YouTubeDownloadOptions, subtitleLang: string = 'en'): Promise<string> {
    await this.ensureYtDlp();
    this.cancelled = false;
    
    const outputPath = options.output || process.cwd();
    const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
    
    const args: string[] = [
      options.url,
      '-o', outputTemplate,
      '--no-mtime',
      '--write-subs',
      '--write-auto-subs',
      '--sub-lang', subtitleLang,
      '--convert-subs', 'srt',
      '--progress',
      '--newline',
    ];

    if (options.proxy) {
      args.push('--proxy', options.proxy);
    }

    if (options.cookies) {
      args.push('--cookies', options.cookies);
    }

    if (options.format === 'audio') {
      args.push('-x', '--audio-format', 'mp3');
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
      args.push('--merge-output-format', 'mp4');
    }

    return new Promise((resolve, reject) => {
      const ytProcess = this.ytDlpWrap.exec(args);

      ytProcess.on('progress', (progressData: unknown) => {
        if (this.cancelled) return;
        const p = progressData as { percent?: number; currentSpeed?: number };
        this.progress = p.percent || 0;
        this.speed = p.currentSpeed || 0;
        this.emit('progress', { progress: this.progress, speed: this.speed });
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
        if (!this.cancelled) reject(err);
      });
    });
  }

  async downloadMetadata(options: YouTubeDownloadOptions): Promise<string> {
    await this.ensureYtDlp();
    
    const outputPath = options.output || process.cwd();
    const outputTemplate = path.join(outputPath, '%(title)s.info.json');
    
    const args: string[] = [
      options.url,
      '-o', outputTemplate,
      '--write-info-json',
      '--no-download',
    ];

    if (options.proxy) {
      args.push('--proxy', options.proxy);
    }

    await this.ytDlpWrap.execPromise(args);
    return outputPath;
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
      videoIndex: this.currentIndex,
      totalVideos: this.totalVideos,
    };
  }

  isPlaylistUrl(url: string): boolean {
    return url.includes('playlist') || url.includes('list=');
  }
}
