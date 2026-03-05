#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as cliProgress from 'cli-progress';
import { Downloader } from './downloader';
import { YouTubeDownloader } from './youtube';
import { loadConfig, saveConfig } from './config';
import { getHistoryManager } from './history';
import { getScheduler } from './scheduler';
import { getCategoryManager } from './categories';
import { getNotificationManager } from './notifications';
import {
  formatBytes,
  formatSpeed,
  formatDuration,
  formatDate,
  formatTime,
  sanitizeFilename,
  isPlaylistUrl,
  isVideoUrl,
} from './utils';
import type { DownloadOptions, VideoQuality, VideoSite, PlaylistOptions, Category } from './types';
import { VIDEO_SITES, DownloadStatus } from './types';

const printBanner = (): void => {
  console.log();
  console.log(chalk.cyan.bold('  ▶ downlowdir'));
  console.log(chalk.gray('  Advanced IDM alternative - Multi-threaded downloader'));
  console.log();
};

const printBox = (title: string, content: string[]): void => {
  console.log();
  console.log(chalk.bold.white(title));
  console.log(chalk.gray('─'.repeat(title.length + 5)));
  for (const l of content) {
    console.log('  ' + l);
  }
  console.log();
};

const detectVideoSite = (url: string): VideoSite => {
  for (const [site, regex] of Object.entries(VIDEO_SITES)) {
    if (site !== 'other' && regex.test(url)) {
      return site as VideoSite;
    }
  }
  return 'other';
};

const program = new Command();

program
  .name('dld')
  .description('Advanced download manager - IDM alternative')
  .version('1.1.0')
  .argument('[url]', 'URL to download')
  .option('-o, --output <path>', 'Output path')
  .option('-t, --threads <number>', 'Number of threads', '8')
  .option('-f, --format <type>', 'Video format: video, audio, best')
  .option('-q, --quality <id>', 'Quality/format ID')
  .option('-l, --limit <kbps>', 'Speed limit in KB/s')
  .option('-p, --proxy <url>', 'Proxy URL')
  .option('-H, --header <header>', 'Custom header (key:value)', (v, p: string[]) => [...p, v], [] as string[])
  .option('-c, --cookies <file>', 'Cookies file for video sites')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-s, --subtitles <lang>', 'Download subtitles (language code)')
  .option('--playlist-start <n>', 'Playlist start index')
  .option('--playlist-end <n>', 'Playlist end index')
  .option('--playlist-reverse', 'Download playlist in reverse order')
  .option('--playlist-shuffle', 'Download playlist in random order')
  .action(async (url: string | undefined, options) => {
    printBanner();
    
    const isInteractive = process.stdin.isTTY;
    
    if (!url) {
      if (!isInteractive) {
        console.log(chalk.red('  Error: URL required'));
        console.log(chalk.gray('  Usage: dld <url>'));
        process.exit(1);
      }
      
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Download a file/video', value: 'download' },
            { name: 'Download playlist', value: 'playlist' },
            { name: 'Batch download from file', value: 'batch' },
            { name: 'Schedule a download', value: 'schedule' },
            { name: 'View download history', value: 'history' },
            { name: 'View categories', value: 'categories' },
            { name: 'Resume paused downloads', value: 'resume' },
            { name: 'View download queue', value: 'queue' },
            { name: 'Configure settings', value: 'config' },
            { name: 'View statistics', value: 'stats' },
            { name: 'Exit', value: 'exit' },
          ],
        },
      ]);

      if (answers.action === 'exit') process.exit(0);
      if (answers.action === 'config') await configureSettings();
      else if (answers.action === 'resume') await listPaused();
      else if (answers.action === 'queue') await showQueue();
      else if (answers.action === 'batch') await batchDownload();
      else if (answers.action === 'history') await showHistory();
      else if (answers.action === 'categories') await manageCategories();
      else if (answers.action === 'schedule') await scheduleDownload();
      else if (answers.action === 'stats') await showStats();
      else if (answers.action === 'playlist') {
        const urlAnswer = await inquirer.prompt([
          { type: 'input', name: 'url', message: 'Enter playlist URL:', validate: (u) => u.length > 0 || 'URL required' },
        ]);
        url = urlAnswer.url;
      } else if (answers.action === 'download') {
        const urlAnswer = await inquirer.prompt([
          { type: 'input', name: 'url', message: 'Enter URL:', validate: (u) => u.length > 0 || 'URL required' },
        ]);
        url = urlAnswer.url;
      }
    }

    if (!url) return;

    const site = detectVideoSite(url);
    const isPlaylist = isPlaylistUrl(url);
    
    if (site !== 'other') {
      if (isPlaylist) {
        await downloadPlaylist(url, options as Record<string, unknown>, site);
      } else {
        await downloadVideo(url, options as Record<string, unknown>, site);
      }
    } else {
      await downloadFile(url, options as Record<string, unknown>);
    }
  });

async function downloadVideo(url: string, options: Record<string, unknown>, site: VideoSite): Promise<void> {
  const config = await loadConfig();
  const notifier = getNotificationManager(config.notifications);
  const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);
  
  const yt = new YouTubeDownloader(options.proxy as string);
  
  console.log(chalk.gray(`  Fetching ${site} video info...`));
  
  let info;
  try {
    info = await yt.getVideoInfo(url, options.proxy as string);
  } catch (err) {
    console.log(chalk.red(`  Failed to fetch video info: ${err}`));
    return;
  }

  printBox('Video Info', [
    `${chalk.white('Title:')} ${info.title.substring(0, 45)}${info.title.length > 45 ? '...' : ''}`,
    `${chalk.white('Duration:')} ${formatDuration(info.duration)}`,
    `${chalk.white('Views:')} ${info.viewCount.toLocaleString()}`,
    `${chalk.white('Site:')} ${site}`,
    info.subtitles ? `${chalk.white('Subtitles:')} Available (${info.subtitles.length} languages)` : '',
  ].filter(Boolean));

  let formatSelection: { type: string; quality?: string; subtitles?: string } = { type: options.format as string || 'video' };

  if (!options.yes && process.stdin.isTTY) {
    let formatSelectionDone = false;
    
    while (!formatSelectionDone) {
      const formatType = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Select format type',
          choices: [
            { name: 'Video - Choose quality', value: 'video' },
            { name: 'Audio only - MP3', value: 'audio' },
            { name: 'Best quality (auto)', value: 'best' },
            { name: '< Back', value: '__back__' },
          ],
          default: options.format || 'video',
        },
      ]);

      if (formatType.type === '__back__') {
        formatSelectionDone = true;
        return;
      }

      formatSelection.type = formatType.type;

      if (formatType.type === 'video') {
        let qualityDone = false;
        while (!qualityDone) {
          const qualityChoices = [
            ...info.qualities.map((q: VideoQuality) => {
              const size = q.filesize || q.filesizeApprox;
              const sizeStr = size ? ` (${formatBytes(size)})` : '';
              const fpsStr = q.fps ? ` ${q.fps}fps` : '';
              return {
                name: `${q.resolution}${fpsStr} - ${q.ext}${sizeStr}`,
                value: q.formatId,
              };
            }),
            { name: '< Back to format selection', value: '__back__' },
          ];

          const qualityAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'quality',
              message: 'Select video quality',
              choices: qualityChoices,
              pageSize: 10,
            },
          ]);

          if (qualityAnswer.quality === '__back__') {
            qualityDone = true;
            continue;
          }

          formatSelection.quality = qualityAnswer.quality;
          qualityDone = true;
        }
      }

      let subDone = false;
      while (!subDone) {
        if (!info.subtitles || info.subtitles.length === 0) {
          break;
        }

        const subChoices = [
          ...info.subtitles.map((s: { lang: string }) => s.lang),
          { name: 'No subtitles', value: '__none__' },
          { name: '< Back to quality selection', value: '__back__' },
        ];

        const subAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'downloadSubs',
            message: 'Download subtitles?',
            choices: subChoices,
          },
        ]);

        if (subAnswer.downloadSubs === '__back__') {
          if (formatSelection.type === 'video') {
            subDone = false;
            continue;
          }
          break;
        }

        if (subAnswer.downloadSubs !== '__none__') {
          formatSelection.subtitles = subAnswer.downloadSubs;
        }
        subDone = true;
      }

      let outputDone = false;
      while (!outputDone) {
        const outputAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'output',
            message: 'Output directory',
            default: options.output || config.defaultOutput,
          },
        ]);

        if (!outputAnswer.output || outputAnswer.output.trim() === '') {
          continue;
        }

        options.output = outputAnswer.output;
        outputDone = true;
      }

      formatSelectionDone = true;
    }
  }

  console.log();
  console.log(chalk.gray(`  Downloading: ${info.title}`));
  console.log();

  const progressBar = new cliProgress.SingleBar({
    format: `  ${chalk.cyan('|')}{bar}${chalk.cyan('|')} {percentage}% | {speed}`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    barsize: 30,
    hideCursor: true,
  });

  progressBar.start(100, 0, { speed: '0 B/s' });

  const historyId = history.add({
    url,
    filename: info.title,
    output: options.output as string,
    size: 0,
    status: DownloadStatus.Downloading,
    site,
  });

  yt.on('progress', (p: { progress: number; speed: number }) => {
    progressBar.update(p.progress, { speed: formatSpeed(p.speed) });
  });

  try {
    if (formatSelection.subtitles) {
      await yt.downloadWithSubtitles({
        url,
        output: options.output as string,
        format: formatSelection.type as 'video' | 'audio' | 'best',
        proxy: options.proxy as string,
        cookies: options.cookies as string,
      }, formatSelection.subtitles);
    } else {
      await yt.download({
        url,
        output: options.output as string,
        format: formatSelection.type as 'video' | 'audio' | 'best',
        formatId: formatSelection.quality,
        proxy: options.proxy as string,
        cookies: options.cookies as string,
      });
    }
    
    progressBar.update(100);
    progressBar.stop();
    console.log();
    console.log(chalk.green('  Done!'));
    console.log();
    
    history.complete(historyId);
    await notifier.notifyDownloadComplete(info.title, options.output as string, formatBytes(info.qualities[0]?.filesize));
  } catch (err) {
    progressBar.stop();
    console.log();
    console.log(chalk.red(`  Failed: ${err}`));
    console.log();
    
    history.fail(historyId, err instanceof Error ? err.message : String(err));
    await notifier.notifyDownloadFailed(info.title, err instanceof Error ? err.message : String(err));
  }
}

async function downloadPlaylist(url: string, options: Record<string, unknown>, site: VideoSite): Promise<void> {
  const config = await loadConfig();
  const notifier = getNotificationManager(config.notifications);
  const yt = new YouTubeDownloader(options.proxy as string);
  
  console.log(chalk.gray(`  Fetching playlist info...`));
  
  let playlistInfo;
  try {
    playlistInfo = await yt.getPlaylistInfo(url, options.proxy as string);
  } catch (err) {
    console.log(chalk.red(`  Failed to fetch playlist info: ${err}`));
    return;
  }

  printBox('Playlist Info', [
    `${chalk.white('Title:')} ${playlistInfo.title}`,
    `${chalk.white('Channel:')} ${playlistInfo.channel}`,
    `${chalk.white('Videos:')} ${playlistInfo.count}`,
  ]);

  let playlistOptions: PlaylistOptions = {};
  let outputDir = options.output as string || config.defaultOutput;

  if (!options.yes && process.stdin.isTTY) {
    let playlistDone = false;
    
    while (!playlistDone) {
      const formatType = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Select format type',
          choices: [
            { name: 'Video - Choose quality', value: 'video' },
            { name: 'Audio only', value: 'audio' },
            { name: 'Best quality', value: 'best' },
          ],
          default: 'video',
        },
      ]);

      let rangeDone = false;
      while (!rangeDone) {
        const rangeAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'start',
            message: 'Start index (1 for first, empty for all)',
            default: '1',
          },
          {
            type: 'input',
            name: 'end',
            message: 'End index (empty for all)',
            default: '',
          },
        ]);

        if (rangeAnswer.start && isNaN(parseInt(rangeAnswer.start, 10))) {
          console.log(chalk.yellow('  Please enter a valid number or leave empty'));
          continue;
        }

        playlistOptions = {
          format: formatType.type as 'video' | 'audio' | 'best',
          start: rangeAnswer.start ? parseInt(rangeAnswer.start, 10) : undefined,
          end: rangeAnswer.end ? parseInt(rangeAnswer.end, 10) : undefined,
          reverse: options['playlist-reverse'] as boolean,
          shuffle: options['playlist-shuffle'] as boolean,
        };
        rangeDone = true;
      }

      let outputDone = false;
      while (!outputDone) {
        const outputAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'output',
            message: 'Output directory',
            default: outputDir,
          },
        ]);

        if (!outputAnswer.output || outputAnswer.output.trim() === '') {
          continue;
        }

        outputDir = outputAnswer.output;
        outputDone = true;
      }

      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Start download?',
          default: true,
        },
      ]);

      if (!confirmAnswer.confirm) {
        const rechooseAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Change options and download', value: 'retry' },
              { name: 'Cancel download', value: 'cancel' },
            ],
          },
        ]);

        if (rechooseAnswer.action === 'cancel') {
          console.log(chalk.gray('  Download cancelled'));
          return;
        }
        continue;
      }

      playlistDone = true;
    }
  } else {
    playlistOptions = {
      format: options.format as 'video' | 'audio' | 'best' || 'video',
      start: options['playlist-start'] ? parseInt(options['playlist-start'] as string, 10) : undefined,
      end: options['playlist-end'] ? parseInt(options['playlist-end'] as string, 10) : undefined,
      reverse: options['playlist-reverse'] as boolean,
      shuffle: options['playlist-shuffle'] as boolean,
    };
  }

  console.log();
  console.log(chalk.gray(`  Downloading playlist: ${playlistInfo.title}`));
  console.log();

  const progressBar = new cliProgress.SingleBar({
    format: `  ${chalk.cyan('|')}{bar}${chalk.cyan('|')} {percentage}% | Video {videoIndex}/{totalVideos} | {speed}`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    barsize: 30,
    hideCursor: true,
  });

  progressBar.start(100, 0, { videoIndex: 0, totalVideos: playlistInfo.count, speed: '0 B/s' });

  yt.on('progress', (p: { progress: number; speed: number; videoIndex?: number; totalVideos?: number }) => {
    progressBar.update(p.progress, { 
      speed: formatSpeed(p.speed),
      videoIndex: p.videoIndex || 0,
      totalVideos: p.totalVideos || playlistInfo.count,
    });
  });

  try {
    const result = await yt.downloadPlaylist({
      url,
      output: outputDir,
      format: playlistOptions.format,
      proxy: options.proxy as string,
      cookies: options.cookies as string,
      playlist: playlistOptions,
    });
    
    progressBar.update(100);
    progressBar.stop();
    console.log();
    console.log(chalk.green(`  Done! Downloaded ${result.success} videos`));
    if (result.failed > 0) console.log(chalk.red(`  Failed: ${result.failed}`));
    console.log();
    
    await notifier.notifyBatchComplete(result.success, result.failed);
  } catch (err) {
    progressBar.stop();
    console.log();
    console.log(chalk.red(`  Failed: ${err}`));
    console.log();
  }
}

async function downloadFile(url: string, options: Record<string, unknown>): Promise<void> {
  const config = await loadConfig();
  const notifier = getNotificationManager(config.notifications);
  const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);
  const categoryManager = getCategoryManager();

  const headers: Record<string, string> = {};
  for (const h of (options.header as string[]) || []) {
    const [key, ...vals] = h.split(':');
    if (key && vals.length) {
      headers[key.trim()] = vals.join(':').trim();
    }
  }

  const category = categoryManager.match(url);

  const downloadOptions: DownloadOptions = {
    url,
    output: options.output as string,
    threads: parseInt(options.threads as string, 10) || config.defaultThreads,
    resume: true,
    speedLimit: options.limit ? parseInt(options.limit as string, 10) * 1024 : config.defaultSpeedLimit,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    proxy: options.proxy as string,
  };

  const downloader = new Downloader(downloadOptions, config);
  const task = downloader.getTask();

  console.log();
  console.log(chalk.gray(`  URL: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`));
  console.log(chalk.gray(`  Output: ${task.output}`));
  if (options.limit) console.log(chalk.gray(`  Speed limit: ${options.limit} KB/s`));
  if (options.proxy) console.log(chalk.gray(`  Proxy: ${options.proxy}`));
  if (category) console.log(chalk.gray(`  Category: ${category.name}`));
  console.log();

  const historyId = history.add({
    url,
    filename: path.basename(task.output),
    output: task.output,
    size: 0,
    status: DownloadStatus.Downloading,
    category: category?.name,
  });

  if (!options.yes && process.stdin.isTTY) {
    const confirm = await inquirer.prompt([
      { type: 'confirm', name: 'proceed', message: 'Start download?', default: true },
    ]);
    if (!confirm.proceed) return;
  }

  const progressBar = new cliProgress.SingleBar({
    format: `  ${chalk.cyan('|')}{bar}${chalk.cyan('|')} {percentage}% | {downloaded}/{total} | {speed}`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    barsize: 30,
    hideCursor: true,
  });

  downloader.on('start', () => {
    progressBar.start(100, 0, {
      downloaded: '0 B',
      total: formatBytes(task.totalSize),
      speed: '0 B/s',
    });
  });

  downloader.on('progress', (t) => {
    progressBar.update(t.progress, {
      downloaded: formatBytes(t.downloadedSize),
      total: formatBytes(t.totalSize),
      speed: formatSpeed(t.speed),
    });
  });

  downloader.on('complete', async (t) => {
    progressBar.stop();
    console.log();
    console.log(chalk.green('  Done!'));
    console.log(chalk.gray(`  Saved: ${t.output}`));
    console.log();
    
    history.complete(historyId, new Date(), t.checksum);
    await notifier.notifyDownloadComplete(path.basename(t.output), path.dirname(t.output), formatBytes(t.totalSize));
  });

  downloader.on('error', async (_, err) => {
    progressBar.stop();
    console.log();
    console.log(chalk.red(`  Failed: ${err}`));
    console.log();
    
    history.fail(historyId, err instanceof Error ? err.message : String(err));
    await notifier.notifyDownloadFailed(path.basename(task.output), err instanceof Error ? err.message : String(err));
  });

  const handleInterrupt = async () => {
    progressBar.stop();
    console.log();
    console.log(chalk.yellow('  Paused! Resume with: dld resume ' + task.id));
    await downloader.pause();
    process.exit(0);
  };

  process.on('SIGINT', handleInterrupt);

  await downloader.start();
}

async function batchDownload(): Promise<void> {
  const config = await loadConfig();
  
  const fileAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'file',
      message: 'Path to batch file (one URL per line)',
      validate: async (f) => {
        if (!(await fs.pathExists(f))) return 'File not found';
        return true;
      },
    },
    {
      type: 'input',
      name: 'output',
      message: 'Output directory',
      default: config.defaultOutput,
    },
    {
      type: 'number',
      name: 'concurrent',
      message: 'Max concurrent downloads',
      default: 3,
    },
  ]);

  const content = await fs.readFile(fileAnswer.file, 'utf-8');
  const urls = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  if (urls.length === 0) {
    console.log(chalk.red('  No URLs found in file'));
    return;
  }

  console.log();
  console.log(chalk.cyan(`  Found ${urls.length} URLs`));
  console.log();

  const notifier = getNotificationManager(config.notifications);
  const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);

  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: `  {url} ${chalk.cyan('|')}{bar}${chalk.cyan('|')} {percentage}%`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    barsize: 20,
  });

  const bars: Map<string, cliProgress.SingleBar> = new Map();
  const queue: string[] = [...urls];
  let completed = 0;
  let failed = 0;

  const downloadNext = async (): Promise<void> => {
    if (queue.length === 0) return;
    
    const url = queue.shift();
    if (!url) return;
    
    const shortUrl = url.substring(0, 30);
    const bar = multibar.create(100, 0, { url: shortUrl });
    bars.set(url, bar);

    const isVideo = isVideoUrl(url);
    const site = detectVideoSite(url);

    if (isVideo) {
      const yt = new YouTubeDownloader();
      
      yt.on('progress', (p: { progress: number }) => {
        bar.update(p.progress);
      });

      try {
        await yt.download({ url, output: fileAnswer.output });
        completed++;
        bar.update(100, { url: chalk.green('✓ ' + shortUrl) });
        
        const historyId = history.add({
          url,
          filename: 'video',
          output: fileAnswer.output,
          size: 0,
          status: DownloadStatus.Completed,
          site,
        });
        history.complete(historyId);
      } catch {
        failed++;
        bar.update(0, { url: chalk.red('✗ ' + shortUrl) });
        
        const historyId = history.add({
          url,
          filename: 'video',
          output: fileAnswer.output,
          size: 0,
          status: DownloadStatus.Failed,
          site,
        });
        history.fail(historyId, 'Download failed');
      }
    } else {
      const dl = new Downloader({
        url,
        output: fileAnswer.output,
        resume: true,
      }, config);

      dl.on('progress', (t) => {
        bar.update(t.progress);
      });

      try {
        await dl.start();
        completed++;
        bar.update(100, { url: chalk.green('✓ ' + shortUrl) });
        
        const historyId = history.add({
          url,
          filename: path.basename(dl.getTask().output),
          output: fileAnswer.output,
          size: dl.getTask().totalSize,
          status: DownloadStatus.Completed,
        });
        history.complete(historyId);
      } catch {
        failed++;
        bar.update(0, { url: chalk.red('✗ ' + shortUrl) });
        
        const historyId = history.add({
          url,
          filename: path.basename(dl.getTask().output),
          output: fileAnswer.output,
          size: 0,
          status: DownloadStatus.Failed,
        });
        history.fail(historyId, 'Download failed');
      }
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(fileAnswer.concurrent, urls.length); i++) {
    workers.push(downloadNext().then(function loop(): Promise<void> {
      if (queue.length === 0) return Promise.resolve();
      return downloadNext().then(loop);
    }));
  }

  await Promise.all(workers);

  multibar.stop();
  console.log();
  console.log(chalk.green(`  Completed: ${completed}/${urls.length}`));
  if (failed > 0) console.log(chalk.red(`  Failed: ${failed}`));
  console.log();

  await notifier.notifyBatchComplete(completed, failed);
}

async function scheduleDownload(): Promise<void> {
  const config = await loadConfig();
  const scheduler = getScheduler();
  
  const answers = await inquirer.prompt([
    { type: 'input', name: 'url', message: 'Enter URL to schedule:', validate: (u) => u.length > 0 || 'URL required' },
    { type: 'input', name: 'datetime', message: 'Schedule for (YYYY-MM-DD HH:MM):', default: '' },
    {
      type: 'list',
      name: 'type',
      message: 'Quick schedule',
      choices: [
        { name: 'Specific date/time', value: 'specific' },
        { name: 'In 1 hour', value: '1h' },
        { name: 'In 3 hours', value: '3h' },
        { name: 'Tomorrow at same time', value: 'tomorrow' },
      ],
      default: 'specific',
    },
    { type: 'input', name: 'output', message: 'Output directory', default: config.defaultOutput },
  ]);

  let scheduledDate: Date;
  if (answers.type === '1h') {
    scheduledDate = new Date(Date.now() + 60 * 60 * 1000);
  } else if (answers.type === '3h') {
    scheduledDate = new Date(Date.now() + 3 * 60 * 60 * 1000);
  } else if (answers.type === 'tomorrow') {
    scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  } else if (answers.datetime) {
    scheduledDate = new Date(answers.datetime);
  } else {
    console.log(chalk.red('  Please provide a date/time'));
    return;
  }

  if (isNaN(scheduledDate.getTime())) {
    console.log(chalk.red('  Invalid date/time format'));
    return;
  }

  if (scheduledDate <= new Date()) {
    console.log(chalk.red('  Scheduled time must be in the future'));
    return;
  }

  scheduler.addDownload({
    url: answers.url,
    output: answers.output,
    scheduledTime: scheduledDate,
  });

  console.log();
  console.log(chalk.green(`  Download scheduled for ${formatDate(scheduledDate)} at ${formatTime(scheduledDate)}`));
  console.log();
}

async function showHistory(): Promise<void> {
  const config = await loadConfig();
  const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);
  
  await history.load();
  
  const entries = history.getRecent(20);
  
  if (entries.length === 0) {
    console.log(chalk.gray('  No download history'));
    return;
  }

  printBox('Download History', [
    ...entries.slice(0, 10).map(e => 
      `${e.status === 'completed' ? chalk.green('✓') : e.status === 'failed' ? chalk.red('✗') : '○'} ${e.filename.substring(0, 35)} - ${formatDate(new Date(e.startTime))}`
    ),
  ]);

  const stats = history.getStats();
  console.log();
  console.log(chalk.gray(`  Total: ${stats.total} | Completed: ${stats.completed} | Failed: ${stats.failed}`));
  console.log(chalk.gray(`  Total downloaded: ${formatBytes(stats.totalSize)}`));
  console.log();
}

async function showStats(): Promise<void> {
  const config = await loadConfig();
  const history = getHistoryManager(config.maxHistoryItems, config.historyEnabled);
  const scheduler = getScheduler();
  
  await history.load();
  
  const stats = history.getStats();
  const scheduleStats = scheduler.getScheduleStats();
  const nextScheduled = scheduler.getNextScheduled();

  printBox('Statistics', [
    `${chalk.white('Total Downloads:')} ${stats.total}`,
    `${chalk.white('Completed:')} ${chalk.green(stats.completed.toString())}`,
    `${chalk.white('Failed:')} ${stats.failed > 0 ? chalk.red(stats.failed.toString()) : '0'}`,
    `${chalk.white('Total Size:')} ${formatBytes(stats.totalSize)}`,
  ]);

  console.log();
  console.log(chalk.cyan('  Scheduled Downloads'));
  console.log(chalk.gray(`  Pending: ${scheduleStats.pending} | Completed: ${scheduleStats.completed} | Failed: ${scheduleStats.failed}`));
  
  if (nextScheduled) {
    console.log(chalk.gray(`  Next: ${formatDate(new Date(nextScheduled.scheduledTime))} at ${formatTime(new Date(nextScheduled.scheduledTime))}`));
  }
  console.log();
}

async function manageCategories(): Promise<void> {
  const categoryManager = getCategoryManager();
  const categories = categoryManager.getAll();

  printBox('Categories', [
    ...categories.map(c => 
      `${chalk.hex(c.color)('●')} ${c.name} - ${c.patterns.length} patterns - ${c.autoAssign ? chalk.green('Auto') : chalk.gray('Manual')}`
    ),
  ]);

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Manage categories',
      choices: [
        { name: 'Add category', value: 'add' },
        { name: 'Reset to defaults', value: 'reset' },
        { name: 'Back', value: 'back' },
      ],
    },
  ]);

  if (answer.action === 'add') {
    const newCat = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Category name:' },
      { type: 'input', name: 'color', message: 'Color (hex):', default: '#FFFFFF' },
      { type: 'input', name: 'patterns', message: 'URL patterns (comma-separated):' },
    ]);
    
    categoryManager.add({
      name: newCat.name,
      color: newCat.color,
      patterns: newCat.patterns.split(',').map((p: string) => p.trim()),
      outputTemplate: '%(title)s.%(ext)s',
      autoAssign: true,
    });
    
    console.log(chalk.green('  Category added!'));
  } else if (answer.action === 'reset') {
    categoryManager.reset();
    console.log(chalk.green('  Categories reset to defaults!'));
  }
}

async function listPaused(): Promise<void> {
  const config = await loadConfig();
  const tempDir = config.tempDir;

  if (!(await fs.pathExists(tempDir))) {
    console.log(chalk.gray('  No paused downloads'));
    return;
  }

  const files = await fs.readdir(tempDir);
  const stateFiles = files.filter(f => f.endsWith('.json'));

  if (stateFiles.length === 0) {
    console.log(chalk.gray('  No paused downloads'));
    return;
  }

  const choices: { name: string; value: string }[] = [];

  for (const file of stateFiles) {
    const state = await fs.readJson(path.join(tempDir, file));
    const id = file.replace('.json', '');
    const progress = state.totalSize > 0
      ? ((state.chunks.reduce((s: number, c: { downloaded: number }) => s + c.downloaded, 0) / state.totalSize) * 100).toFixed(1)
      : '0';
    choices.push({
      name: `${id} - ${progress}% - ${state.url.substring(0, 40)}...`,
      value: id,
    });
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'id',
      message: 'Select download to resume',
      choices: [...choices, { name: '< Back', value: 'back' }],
    },
  ]);

  if (answer.id !== 'back') {
    await resumeDownload(answer.id);
  }
}

async function resumeDownload(id: string): Promise<void> {
  const config = await loadConfig();
  const stateFile = path.join(config.tempDir, `${id}.json`);
  
  if (!(await fs.pathExists(stateFile))) {
    console.log(chalk.red(`  Download not found: ${id}`));
    return;
  }

  const state = await fs.readJson(stateFile);

  console.log();
  console.log(chalk.gray(`  Resuming: ${state.url}`));
  console.log();

  const downloader = new Downloader({
    url: state.url,
    output: state.output,
    resume: true,
    headers: state.headers,
    proxy: state.proxy,
  }, config);

  const task = downloader.getTask();
  const progressBar = new cliProgress.SingleBar({
    format: `  ${chalk.cyan('|')}{bar}${chalk.cyan('|')} {percentage}% | {downloaded}/{total} | {speed}`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    barsize: 30,
    hideCursor: true,
  });

  downloader.on('start', () => {
    progressBar.start(100, task.progress, {
      downloaded: formatBytes(task.downloadedSize),
      total: formatBytes(task.totalSize),
      speed: '0 B/s',
    });
  });

  downloader.on('progress', (t) => {
    progressBar.update(t.progress, {
      downloaded: formatBytes(t.downloadedSize),
      total: formatBytes(t.totalSize),
      speed: formatSpeed(t.speed),
    });
  });

  downloader.on('complete', () => {
    progressBar.stop();
    console.log();
    console.log(chalk.green('  Done!'));
    console.log();
  });

  process.on('SIGINT', async () => {
    progressBar.stop();
    console.log();
    await downloader.pause();
    process.exit(0);
  });

  await downloader.start();
}

async function showQueue(): Promise<void> {
  const config = await loadConfig();
  const tempDir = config.tempDir;

  console.log(chalk.cyan('  Download Queue'));
  console.log();

  if (!(await fs.pathExists(tempDir))) {
    console.log(chalk.gray('  No downloads in queue'));
    return;
  }

  const files = await fs.readdir(tempDir);
  const stateFiles = files.filter(f => f.endsWith('.json'));

  if (stateFiles.length === 0) {
    console.log(chalk.gray('  No downloads in queue'));
    return;
  }

  for (const file of stateFiles) {
    const state = await fs.readJson(path.join(tempDir, file));
    const id = file.replace('.json', '');
    const progress = state.totalSize > 0
      ? ((state.chunks.reduce((s: number, c: { downloaded: number }) => s + c.downloaded, 0) / state.totalSize) * 100).toFixed(1)
      : '0';
    
    console.log(`  ${chalk.cyan(id)} ${progress}%`);
    console.log(chalk.gray(`    ${state.url.substring(0, 60)}...`));
    console.log(chalk.gray(`    Output: ${state.output}`));
    console.log();
  }
}

async function configureSettings(): Promise<void> {
  const config = await loadConfig();

  printBox('Settings', [
    `${chalk.white('Threads:')} ${config.defaultThreads}`,
    `${chalk.white('Output:')} ${config.defaultOutput}`,
    `${chalk.white('Speed limit:')} ${config.defaultSpeedLimit ? formatBytes(config.defaultSpeedLimit) + '/s' : 'None'}`,
    `${chalk.white('Proxy:')} ${config.proxy || 'None'}`,
    `${chalk.white('Concurrent:')} ${config.concurrentDownloads}`,
    `${chalk.white('Notifications:')} ${config.notifications ? chalk.green('On') : chalk.red('Off')}`,
    `${chalk.white('History:')} ${config.historyEnabled ? chalk.green('On') : chalk.red('Off')}`,
    `${chalk.white('Max history:')} ${config.maxHistoryItems}`,
  ]);

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'threads',
      message: 'Default threads',
      default: config.defaultThreads,
    },
    {
      type: 'input',
      name: 'output',
      message: 'Default output directory',
      default: config.defaultOutput,
    },
    {
      type: 'number',
      name: 'limit',
      message: 'Speed limit (KB/s, 0 for none)',
      default: config.defaultSpeedLimit / 1024,
    },
    {
      type: 'input',
      name: 'proxy',
      message: 'Proxy URL (leave empty for none)',
      default: config.proxy || '',
    },
    {
      type: 'number',
      name: 'concurrent',
      message: 'Max concurrent downloads',
      default: config.concurrentDownloads || 3,
    },
    {
      type: 'confirm',
      name: 'notifications',
      message: 'Enable desktop notifications',
      default: config.notifications,
    },
    {
      type: 'confirm',
      name: 'history',
      message: 'Enable download history',
      default: config.historyEnabled,
    },
    {
      type: 'number',
      name: 'maxHistory',
      message: 'Max history items',
      default: config.maxHistoryItems,
    },
  ]);

  await saveConfig({
    defaultThreads: answers.threads,
    defaultOutput: answers.output,
    defaultSpeedLimit: answers.limit * 1024,
    proxy: answers.proxy || undefined,
    concurrentDownloads: answers.concurrent,
    notifications: answers.notifications,
    historyEnabled: answers.history,
    maxHistoryItems: answers.maxHistory,
  });

  console.log(chalk.green('  Settings saved!'));
}

program
  .command('resume [id]')
  .description('Resume a paused download')
  .action(async (id?: string) => {
    printBanner();
    if (id) {
      await resumeDownload(id);
    } else {
      await listPaused();
    }
  });

program
  .command('config')
  .description('Configure settings')
  .action(async () => {
    printBanner();
    await configureSettings();
  });

program
  .command('queue')
  .description('Show download queue')
  .action(async () => {
    printBanner();
    await showQueue();
  });

program
  .command('history')
  .description('View download history')
  .action(async () => {
    printBanner();
    await showHistory();
  });

program
  .command('stats')
  .description('Show download statistics')
  .action(async () => {
    printBanner();
    await showStats();
  });

program
  .command('schedule [url]')
  .description('Schedule a download')
  .option('-t, --time <datetime>', 'Schedule time (YYYY-MM-DD HH:MM)')
  .option('-o, --output <path>', 'Output directory')
  .action(async (url: string | undefined, options) => {
    printBanner();
    if (!url) {
      await scheduleDownload();
    } else {
      const config = await loadConfig();
      const scheduler = getScheduler();
      const scheduledDate = options.time ? new Date(options.time) : new Date(Date.now() + 60 * 60 * 1000);
      
      scheduler.addDownload({
        url,
        output: options.output || config.defaultOutput,
        scheduledTime: scheduledDate,
      });
      
      console.log(chalk.green(`  Scheduled for ${formatDate(scheduledDate)} at ${formatTime(scheduledDate)}`));
    }
  });

program
  .command('playlist <url>')
  .description('Download playlist')
  .option('-o, --output <path>', 'Output directory')
  .option('-f, --format <type>', 'Format: video, audio, best')
  .option('--start <n>', 'Start index')
  .option('--end <n>', 'End index')
  .option('--shuffle', 'Download in random order')
  .action(async (url: string, options) => {
    printBanner();
    const site = detectVideoSite(url);
    if (site !== 'other') {
      await downloadPlaylist(url, {
        ...options,
        format: options.format || 'video',
        'playlist-start': options.start,
        'playlist-end': options.end,
        'playlist-shuffle': options.shuffle,
      }, site);
    } else {
      console.log(chalk.red('  URL is not a supported video site'));
    }
  });

program
  .command('categories')
  .description('Manage download categories')
  .action(async () => {
    printBanner();
    await manageCategories();
  });

program
  .command('batch <file>')
  .description('Batch download from file')
  .option('-o, --output <path>', 'Output directory')
  .option('-c, --concurrent <n>', 'Max concurrent downloads', '3')
  .action(async (file: string, options, command) => {
    printBanner();
    const config = await loadConfig();
    const opts = command?.optsWithGlobals?.() || options;
    const outputPath = opts.output || config.defaultOutput;
    
    if (!(await fs.pathExists(file))) {
      console.log(chalk.red(`  File not found: ${file}`));
      return;
    }

    const content = await fs.readFile(file, 'utf-8');
    const urls = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    if (urls.length === 0) {
      console.log(chalk.red('  No URLs found'));
      return;
    }

    console.log(chalk.cyan(`  Found ${urls.length} URLs`));
    console.log();

    const notifier = getNotificationManager(config.notifications);

    const multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: `  {url} ${chalk.cyan('|')}{bar}${chalk.cyan('|')} {percentage}%`,
      barCompleteChar: '=',
      barIncompleteChar: '-',
      barsize: 20,
    });

    const queue: string[] = [...urls];
    const concurrent = parseInt(opts.concurrent, 10) || 3;
    let completed = 0;
    let failed = 0;

    const downloadNext = async (): Promise<void> => {
      if (queue.length === 0) return;
      
      const url = queue.shift();
      if (!url) return;
      
      const shortUrl = url.substring(0, 25);
      const bar = multibar.create(100, 0, { url: shortUrl });

      const dl = new Downloader({
        url,
        output: outputPath,
        resume: true,
      }, config);

      dl.on('progress', (t) => {
        bar.update(t.progress);
      });

      try {
        await dl.start();
        completed++;
        bar.update(100, { url: chalk.green('✓ ' + shortUrl) });
      } catch {
        failed++;
        bar.update(0, { url: chalk.red('✗ ' + shortUrl) });
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(concurrent, urls.length); i++) {
      workers.push(downloadNext().then(function loop(): Promise<void> {
        if (queue.length === 0) return Promise.resolve();
        return downloadNext().then(loop);
      }));
    }

    await Promise.all(workers);

    multibar.stop();
    console.log();
    console.log(chalk.green(`  Completed: ${completed}/${urls.length}`));
    if (failed > 0) console.log(chalk.red(`  Failed: ${failed}`));
    console.log();

    await notifier.notifyBatchComplete(completed, failed);
  });

program
  .command('clear [id]')
  .description('Clear paused downloads')
  .action(async (id?: string) => {
    printBanner();
    const config = await loadConfig();
    const tempDir = config.tempDir;

    if (!id) {
      if (!(await fs.pathExists(tempDir))) {
        console.log(chalk.gray('  No downloads to clear'));
        return;
      }
      const files = await fs.readdir(tempDir);
      for (const f of files) {
        await fs.unlink(path.join(tempDir, f));
      }
      console.log(chalk.green('  All paused downloads cleared'));
    } else {
      const stateFile = path.join(tempDir, `${id}.json`);
      if (await fs.pathExists(stateFile)) {
        await fs.unlink(stateFile);
        console.log(chalk.green(`  Cleared: ${id}`));
      } else {
        console.log(chalk.red(`  Not found: ${id}`));
      }
    }
  });

program
  .command('verify <file> <hash>')
  .description('Verify file checksum')
  .option('-t, --type <type>', 'Hash type: md5, sha256, sha1', 'sha256')
  .action(async (file: string, hash: string, options) => {
    printBanner();
    const { calculateChecksum } = await import('./utils');
    
    if (!(await fs.pathExists(file))) {
      console.log(chalk.red(`  File not found: ${file}`));
      return;
    }

    console.log(chalk.gray(`  Calculating ${options.type} checksum...`));
    const actual = await calculateChecksum(file, options.type);
    
    if (actual.toLowerCase() === hash.toLowerCase()) {
      console.log(chalk.green('  ✓ Checksum verified!'));
    } else {
      console.log(chalk.red('  ✗ Checksum mismatch!'));
      console.log(chalk.gray(`  Expected: ${hash}`));
      console.log(chalk.gray(`  Actual:   ${actual}`));
    }
  });

program.parseAsync();
