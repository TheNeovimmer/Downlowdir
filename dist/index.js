#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const cliProgress = __importStar(require("cli-progress"));
const downloader_1 = require("./downloader");
const youtube_1 = require("./youtube");
const config_1 = require("./config");
const history_1 = require("./history");
const scheduler_1 = require("./scheduler");
const categories_1 = require("./categories");
const notifications_1 = require("./notifications");
const utils_1 = require("./utils");
const types_1 = require("./types");
const printBanner = () => {
    console.log();
    console.log(chalk_1.default.cyan.bold('  ▶ downlowdir'));
    console.log(chalk_1.default.gray('  Advanced IDM alternative - Multi-threaded downloader'));
    console.log();
};
const printBox = (title, content) => {
    const width = Math.max(title.length + 4, ...content.map(l => l.length + 4), 50);
    const line = '─'.repeat(width - 2);
    console.log(chalk_1.default.cyan(`╭${line}╮`));
    console.log(chalk_1.default.cyan('│') + chalk_1.default.bold.white(` ${title}`) + ' '.repeat(width - title.length - 4) + chalk_1.default.cyan('│'));
    console.log(chalk_1.default.cyan('│') + ' '.repeat(width - 2) + chalk_1.default.cyan('│'));
    for (const l of content) {
        console.log(chalk_1.default.cyan('│') + ' ' + l + ' '.repeat(width - l.length - 3) + chalk_1.default.cyan('│'));
    }
    console.log(chalk_1.default.cyan(`╰${line}╯`));
};
const detectVideoSite = (url) => {
    for (const [site, regex] of Object.entries(types_1.VIDEO_SITES)) {
        if (site !== 'other' && regex.test(url)) {
            return site;
        }
    }
    return 'other';
};
const program = new commander_1.Command();
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
    .option('-H, --header <header>', 'Custom header (key:value)', (v, p) => [...p, v], [])
    .option('-c, --cookies <file>', 'Cookies file for video sites')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('-s, --subtitles <lang>', 'Download subtitles (language code)')
    .option('--playlist-start <n>', 'Playlist start index')
    .option('--playlist-end <n>', 'Playlist end index')
    .option('--playlist-reverse', 'Download playlist in reverse order')
    .option('--playlist-shuffle', 'Download playlist in random order')
    .action(async (url, options) => {
    printBanner();
    const isInteractive = process.stdin.isTTY;
    if (!url) {
        if (!isInteractive) {
            console.log(chalk_1.default.red('  Error: URL required'));
            console.log(chalk_1.default.gray('  Usage: dld <url>'));
            process.exit(1);
        }
        const answers = await inquirer_1.default.prompt([
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
        if (answers.action === 'exit')
            process.exit(0);
        if (answers.action === 'config')
            await configureSettings();
        else if (answers.action === 'resume')
            await listPaused();
        else if (answers.action === 'queue')
            await showQueue();
        else if (answers.action === 'batch')
            await batchDownload();
        else if (answers.action === 'history')
            await showHistory();
        else if (answers.action === 'categories')
            await manageCategories();
        else if (answers.action === 'schedule')
            await scheduleDownload();
        else if (answers.action === 'stats')
            await showStats();
        else if (answers.action === 'playlist') {
            const urlAnswer = await inquirer_1.default.prompt([
                { type: 'input', name: 'url', message: 'Enter playlist URL:', validate: (u) => u.length > 0 || 'URL required' },
            ]);
            url = urlAnswer.url;
        }
        else if (answers.action === 'download') {
            const urlAnswer = await inquirer_1.default.prompt([
                { type: 'input', name: 'url', message: 'Enter URL:', validate: (u) => u.length > 0 || 'URL required' },
            ]);
            url = urlAnswer.url;
        }
    }
    if (!url)
        return;
    const site = detectVideoSite(url);
    const isPlaylist = (0, utils_1.isPlaylistUrl)(url);
    if (site !== 'other') {
        if (isPlaylist) {
            await downloadPlaylist(url, options, site);
        }
        else {
            await downloadVideo(url, options, site);
        }
    }
    else {
        await downloadFile(url, options);
    }
});
async function downloadVideo(url, options, site) {
    const config = await (0, config_1.loadConfig)();
    const notifier = (0, notifications_1.getNotificationManager)(config.notifications);
    const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
    const yt = new youtube_1.YouTubeDownloader(options.proxy);
    console.log(chalk_1.default.gray(`  Fetching ${site} video info...`));
    let info;
    try {
        info = await yt.getVideoInfo(url, options.proxy);
    }
    catch (err) {
        console.log(chalk_1.default.red(`  Failed to fetch video info: ${err}`));
        return;
    }
    printBox('Video Info', [
        `${chalk_1.default.white('Title:')} ${info.title.substring(0, 45)}${info.title.length > 45 ? '...' : ''}`,
        `${chalk_1.default.white('Duration:')} ${(0, utils_1.formatDuration)(info.duration)}`,
        `${chalk_1.default.white('Views:')} ${info.viewCount.toLocaleString()}`,
        `${chalk_1.default.white('Site:')} ${site}`,
        info.subtitles ? `${chalk_1.default.white('Subtitles:')} Available (${info.subtitles.length} languages)` : '',
    ].filter(Boolean));
    let formatSelection = { type: options.format || 'video' };
    if (!options.yes && process.stdin.isTTY) {
        const formatType = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Select format type',
                choices: [
                    { name: 'Video - Choose quality', value: 'video' },
                    { name: 'Audio only - MP3', value: 'audio' },
                    { name: 'Best quality (auto)', value: 'best' },
                ],
                default: options.format || 'video',
            },
        ]);
        formatSelection.type = formatType.type;
        if (formatType.type === 'video') {
            const qualityChoices = info.qualities.map((q) => {
                const size = q.filesize || q.filesizeApprox;
                const sizeStr = size ? ` (${(0, utils_1.formatBytes)(size)})` : '';
                const fpsStr = q.fps ? ` ${q.fps}fps` : '';
                return {
                    name: `${q.resolution}${fpsStr} - ${q.ext}${sizeStr}`,
                    value: q.formatId,
                };
            });
            const qualityAnswer = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'quality',
                    message: 'Select video quality',
                    choices: qualityChoices,
                    pageSize: 10,
                },
            ]);
            formatSelection.quality = qualityAnswer.quality;
        }
        if (info.subtitles && info.subtitles.length > 0) {
            const subAnswer = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'downloadSubs',
                    message: 'Download subtitles?',
                    default: false,
                },
            ]);
            if (subAnswer.downloadSubs) {
                const langChoices = info.subtitles.map((s) => s.lang);
                const langAnswer = await inquirer_1.default.prompt([
                    {
                        type: 'list',
                        name: 'lang',
                        message: 'Select subtitle language',
                        choices: langChoices,
                    },
                ]);
                formatSelection.subtitles = langAnswer.lang;
            }
        }
        const outputAnswer = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'output',
                message: 'Output directory',
                default: options.output || config.defaultOutput,
            },
        ]);
        options.output = outputAnswer.output;
    }
    console.log();
    console.log(chalk_1.default.gray(`  Downloading: ${info.title}`));
    console.log();
    const progressBar = new cliProgress.SingleBar({
        format: `  ${chalk_1.default.cyan('|')}{bar}${chalk_1.default.cyan('|')} {percentage}% | {speed}`,
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 30,
        hideCursor: true,
    });
    progressBar.start(100, 0, { speed: '0 B/s' });
    const historyId = history.add({
        url,
        filename: info.title,
        output: options.output,
        size: 0,
        status: types_1.DownloadStatus.Downloading,
        site,
    });
    yt.on('progress', (p) => {
        progressBar.update(p.progress, { speed: (0, utils_1.formatSpeed)(p.speed) });
    });
    try {
        if (formatSelection.subtitles) {
            await yt.downloadWithSubtitles({
                url,
                output: options.output,
                format: formatSelection.type,
                proxy: options.proxy,
                cookies: options.cookies,
            }, formatSelection.subtitles);
        }
        else {
            await yt.download({
                url,
                output: options.output,
                format: formatSelection.type,
                formatId: formatSelection.quality,
                proxy: options.proxy,
                cookies: options.cookies,
            });
        }
        progressBar.update(100);
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.green('  Done!'));
        console.log();
        history.complete(historyId);
        await notifier.notifyDownloadComplete(info.title, options.output, (0, utils_1.formatBytes)(info.qualities[0]?.filesize));
    }
    catch (err) {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.red(`  Failed: ${err}`));
        console.log();
        history.fail(historyId, err instanceof Error ? err.message : String(err));
        await notifier.notifyDownloadFailed(info.title, err instanceof Error ? err.message : String(err));
    }
}
async function downloadPlaylist(url, options, site) {
    const config = await (0, config_1.loadConfig)();
    const notifier = (0, notifications_1.getNotificationManager)(config.notifications);
    const yt = new youtube_1.YouTubeDownloader(options.proxy);
    console.log(chalk_1.default.gray(`  Fetching playlist info...`));
    let playlistInfo;
    try {
        playlistInfo = await yt.getPlaylistInfo(url, options.proxy);
    }
    catch (err) {
        console.log(chalk_1.default.red(`  Failed to fetch playlist info: ${err}`));
        return;
    }
    printBox('Playlist Info', [
        `${chalk_1.default.white('Title:')} ${playlistInfo.title}`,
        `${chalk_1.default.white('Channel:')} ${playlistInfo.channel}`,
        `${chalk_1.default.white('Videos:')} ${playlistInfo.count}`,
    ]);
    let playlistOptions = {};
    let outputDir = options.output || config.defaultOutput;
    if (!options.yes && process.stdin.isTTY) {
        const formatType = await inquirer_1.default.prompt([
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
        const rangeAnswer = await inquirer_1.default.prompt([
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
        playlistOptions = {
            format: formatType.type,
            start: rangeAnswer.start ? parseInt(rangeAnswer.start, 10) : undefined,
            end: rangeAnswer.end ? parseInt(rangeAnswer.end, 10) : undefined,
            reverse: options['playlist-reverse'],
            shuffle: options['playlist-shuffle'],
        };
        const outputAnswer = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'output',
                message: 'Output directory',
                default: outputDir,
            },
        ]);
        outputDir = outputAnswer.output;
    }
    else {
        playlistOptions = {
            format: options.format || 'video',
            start: options['playlist-start'] ? parseInt(options['playlist-start'], 10) : undefined,
            end: options['playlist-end'] ? parseInt(options['playlist-end'], 10) : undefined,
            reverse: options['playlist-reverse'],
            shuffle: options['playlist-shuffle'],
        };
    }
    console.log();
    console.log(chalk_1.default.gray(`  Downloading playlist: ${playlistInfo.title}`));
    console.log();
    const progressBar = new cliProgress.SingleBar({
        format: `  ${chalk_1.default.cyan('|')}{bar}${chalk_1.default.cyan('|')} {percentage}% | Video {videoIndex}/{totalVideos} | {speed}`,
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 30,
        hideCursor: true,
    });
    progressBar.start(100, 0, { videoIndex: 0, totalVideos: playlistInfo.count, speed: '0 B/s' });
    yt.on('progress', (p) => {
        progressBar.update(p.progress, {
            speed: (0, utils_1.formatSpeed)(p.speed),
            videoIndex: p.videoIndex || 0,
            totalVideos: p.totalVideos || playlistInfo.count,
        });
    });
    try {
        const result = await yt.downloadPlaylist({
            url,
            output: outputDir,
            format: playlistOptions.format,
            proxy: options.proxy,
            cookies: options.cookies,
            playlist: playlistOptions,
        });
        progressBar.update(100);
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.green(`  Done! Downloaded ${result.success} videos`));
        if (result.failed > 0)
            console.log(chalk_1.default.red(`  Failed: ${result.failed}`));
        console.log();
        await notifier.notifyBatchComplete(result.success, result.failed);
    }
    catch (err) {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.red(`  Failed: ${err}`));
        console.log();
    }
}
async function downloadFile(url, options) {
    const config = await (0, config_1.loadConfig)();
    const notifier = (0, notifications_1.getNotificationManager)(config.notifications);
    const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
    const categoryManager = (0, categories_1.getCategoryManager)();
    const headers = {};
    for (const h of options.header || []) {
        const [key, ...vals] = h.split(':');
        if (key && vals.length) {
            headers[key.trim()] = vals.join(':').trim();
        }
    }
    const category = categoryManager.match(url);
    const downloadOptions = {
        url,
        output: options.output,
        threads: parseInt(options.threads, 10) || config.defaultThreads,
        resume: true,
        speedLimit: options.limit ? parseInt(options.limit, 10) * 1024 : config.defaultSpeedLimit,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        proxy: options.proxy,
    };
    const downloader = new downloader_1.Downloader(downloadOptions, config);
    const task = downloader.getTask();
    console.log();
    console.log(chalk_1.default.gray(`  URL: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`));
    console.log(chalk_1.default.gray(`  Output: ${task.output}`));
    if (options.limit)
        console.log(chalk_1.default.gray(`  Speed limit: ${options.limit} KB/s`));
    if (options.proxy)
        console.log(chalk_1.default.gray(`  Proxy: ${options.proxy}`));
    if (category)
        console.log(chalk_1.default.gray(`  Category: ${category.name}`));
    console.log();
    const historyId = history.add({
        url,
        filename: path.basename(task.output),
        output: task.output,
        size: 0,
        status: types_1.DownloadStatus.Downloading,
        category: category?.name,
    });
    if (!options.yes && process.stdin.isTTY) {
        const confirm = await inquirer_1.default.prompt([
            { type: 'confirm', name: 'proceed', message: 'Start download?', default: true },
        ]);
        if (!confirm.proceed)
            return;
    }
    const progressBar = new cliProgress.SingleBar({
        format: `  ${chalk_1.default.cyan('|')}{bar}${chalk_1.default.cyan('|')} {percentage}% | {downloaded}/{total} | {speed}`,
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 30,
        hideCursor: true,
    });
    downloader.on('start', () => {
        progressBar.start(100, 0, {
            downloaded: '0 B',
            total: (0, utils_1.formatBytes)(task.totalSize),
            speed: '0 B/s',
        });
    });
    downloader.on('progress', (t) => {
        progressBar.update(t.progress, {
            downloaded: (0, utils_1.formatBytes)(t.downloadedSize),
            total: (0, utils_1.formatBytes)(t.totalSize),
            speed: (0, utils_1.formatSpeed)(t.speed),
        });
    });
    downloader.on('complete', async (t) => {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.green('  Done!'));
        console.log(chalk_1.default.gray(`  Saved: ${t.output}`));
        console.log();
        history.complete(historyId, new Date(), t.checksum);
        await notifier.notifyDownloadComplete(path.basename(t.output), path.dirname(t.output), (0, utils_1.formatBytes)(t.totalSize));
    });
    downloader.on('error', async (_, err) => {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.red(`  Failed: ${err}`));
        console.log();
        history.fail(historyId, err instanceof Error ? err.message : String(err));
        await notifier.notifyDownloadFailed(path.basename(task.output), err instanceof Error ? err.message : String(err));
    });
    const handleInterrupt = async () => {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.yellow('  Paused! Resume with: dld resume ' + task.id));
        await downloader.pause();
        process.exit(0);
    };
    process.on('SIGINT', handleInterrupt);
    await downloader.start();
}
async function batchDownload() {
    const config = await (0, config_1.loadConfig)();
    const fileAnswer = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'file',
            message: 'Path to batch file (one URL per line)',
            validate: async (f) => {
                if (!(await fs.pathExists(f)))
                    return 'File not found';
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
        console.log(chalk_1.default.red('  No URLs found in file'));
        return;
    }
    console.log();
    console.log(chalk_1.default.cyan(`  Found ${urls.length} URLs`));
    console.log();
    const notifier = (0, notifications_1.getNotificationManager)(config.notifications);
    const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: `  {url} ${chalk_1.default.cyan('|')}{bar}${chalk_1.default.cyan('|')} {percentage}%`,
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 20,
    });
    const bars = new Map();
    const queue = [...urls];
    let completed = 0;
    let failed = 0;
    const downloadNext = async () => {
        if (queue.length === 0)
            return;
        const url = queue.shift();
        if (!url)
            return;
        const shortUrl = url.substring(0, 30);
        const bar = multibar.create(100, 0, { url: shortUrl });
        bars.set(url, bar);
        const isVideo = (0, utils_1.isVideoUrl)(url);
        const site = detectVideoSite(url);
        if (isVideo) {
            const yt = new youtube_1.YouTubeDownloader();
            yt.on('progress', (p) => {
                bar.update(p.progress);
            });
            try {
                await yt.download({ url, output: fileAnswer.output });
                completed++;
                bar.update(100, { url: chalk_1.default.green('✓ ' + shortUrl) });
                const historyId = history.add({
                    url,
                    filename: 'video',
                    output: fileAnswer.output,
                    size: 0,
                    status: types_1.DownloadStatus.Completed,
                    site,
                });
                history.complete(historyId);
            }
            catch {
                failed++;
                bar.update(0, { url: chalk_1.default.red('✗ ' + shortUrl) });
                const historyId = history.add({
                    url,
                    filename: 'video',
                    output: fileAnswer.output,
                    size: 0,
                    status: types_1.DownloadStatus.Failed,
                    site,
                });
                history.fail(historyId, 'Download failed');
            }
        }
        else {
            const dl = new downloader_1.Downloader({
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
                bar.update(100, { url: chalk_1.default.green('✓ ' + shortUrl) });
                const historyId = history.add({
                    url,
                    filename: path.basename(dl.getTask().output),
                    output: fileAnswer.output,
                    size: dl.getTask().totalSize,
                    status: types_1.DownloadStatus.Completed,
                });
                history.complete(historyId);
            }
            catch {
                failed++;
                bar.update(0, { url: chalk_1.default.red('✗ ' + shortUrl) });
                const historyId = history.add({
                    url,
                    filename: path.basename(dl.getTask().output),
                    output: fileAnswer.output,
                    size: 0,
                    status: types_1.DownloadStatus.Failed,
                });
                history.fail(historyId, 'Download failed');
            }
        }
    };
    const workers = [];
    for (let i = 0; i < Math.min(fileAnswer.concurrent, urls.length); i++) {
        workers.push(downloadNext().then(function loop() {
            if (queue.length === 0)
                return Promise.resolve();
            return downloadNext().then(loop);
        }));
    }
    await Promise.all(workers);
    multibar.stop();
    console.log();
    console.log(chalk_1.default.green(`  Completed: ${completed}/${urls.length}`));
    if (failed > 0)
        console.log(chalk_1.default.red(`  Failed: ${failed}`));
    console.log();
    await notifier.notifyBatchComplete(completed, failed);
}
async function scheduleDownload() {
    const config = await (0, config_1.loadConfig)();
    const scheduler = (0, scheduler_1.getScheduler)();
    const answers = await inquirer_1.default.prompt([
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
    let scheduledDate;
    if (answers.type === '1h') {
        scheduledDate = new Date(Date.now() + 60 * 60 * 1000);
    }
    else if (answers.type === '3h') {
        scheduledDate = new Date(Date.now() + 3 * 60 * 60 * 1000);
    }
    else if (answers.type === 'tomorrow') {
        scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
    else if (answers.datetime) {
        scheduledDate = new Date(answers.datetime);
    }
    else {
        console.log(chalk_1.default.red('  Please provide a date/time'));
        return;
    }
    if (isNaN(scheduledDate.getTime())) {
        console.log(chalk_1.default.red('  Invalid date/time format'));
        return;
    }
    if (scheduledDate <= new Date()) {
        console.log(chalk_1.default.red('  Scheduled time must be in the future'));
        return;
    }
    scheduler.addDownload({
        url: answers.url,
        output: answers.output,
        scheduledTime: scheduledDate,
    });
    console.log();
    console.log(chalk_1.default.green(`  Download scheduled for ${(0, utils_1.formatDate)(scheduledDate)} at ${(0, utils_1.formatTime)(scheduledDate)}`));
    console.log();
}
async function showHistory() {
    const config = await (0, config_1.loadConfig)();
    const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
    await history.load();
    const entries = history.getRecent(20);
    if (entries.length === 0) {
        console.log(chalk_1.default.gray('  No download history'));
        return;
    }
    printBox('Download History', [
        ...entries.slice(0, 10).map(e => `${e.status === 'completed' ? chalk_1.default.green('✓') : e.status === 'failed' ? chalk_1.default.red('✗') : '○'} ${e.filename.substring(0, 35)} - ${(0, utils_1.formatDate)(new Date(e.startTime))}`),
    ]);
    const stats = history.getStats();
    console.log();
    console.log(chalk_1.default.gray(`  Total: ${stats.total} | Completed: ${stats.completed} | Failed: ${stats.failed}`));
    console.log(chalk_1.default.gray(`  Total downloaded: ${(0, utils_1.formatBytes)(stats.totalSize)}`));
    console.log();
}
async function showStats() {
    const config = await (0, config_1.loadConfig)();
    const history = (0, history_1.getHistoryManager)(config.maxHistoryItems, config.historyEnabled);
    const scheduler = (0, scheduler_1.getScheduler)();
    await history.load();
    const stats = history.getStats();
    const scheduleStats = scheduler.getScheduleStats();
    const nextScheduled = scheduler.getNextScheduled();
    printBox('Statistics', [
        `${chalk_1.default.white('Total Downloads:')} ${stats.total}`,
        `${chalk_1.default.white('Completed:')} ${chalk_1.default.green(stats.completed.toString())}`,
        `${chalk_1.default.white('Failed:')} ${stats.failed > 0 ? chalk_1.default.red(stats.failed.toString()) : '0'}`,
        `${chalk_1.default.white('Total Size:')} ${(0, utils_1.formatBytes)(stats.totalSize)}`,
    ]);
    console.log();
    console.log(chalk_1.default.cyan('  Scheduled Downloads'));
    console.log(chalk_1.default.gray(`  Pending: ${scheduleStats.pending} | Completed: ${scheduleStats.completed} | Failed: ${scheduleStats.failed}`));
    if (nextScheduled) {
        console.log(chalk_1.default.gray(`  Next: ${(0, utils_1.formatDate)(new Date(nextScheduled.scheduledTime))} at ${(0, utils_1.formatTime)(new Date(nextScheduled.scheduledTime))}`));
    }
    console.log();
}
async function manageCategories() {
    const categoryManager = (0, categories_1.getCategoryManager)();
    const categories = categoryManager.getAll();
    printBox('Categories', [
        ...categories.map(c => `${chalk_1.default.hex(c.color)('●')} ${c.name} - ${c.patterns.length} patterns - ${c.autoAssign ? chalk_1.default.green('Auto') : chalk_1.default.gray('Manual')}`),
    ]);
    const answer = await inquirer_1.default.prompt([
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
        const newCat = await inquirer_1.default.prompt([
            { type: 'input', name: 'name', message: 'Category name:' },
            { type: 'input', name: 'color', message: 'Color (hex):', default: '#FFFFFF' },
            { type: 'input', name: 'patterns', message: 'URL patterns (comma-separated):' },
        ]);
        categoryManager.add({
            name: newCat.name,
            color: newCat.color,
            patterns: newCat.patterns.split(',').map((p) => p.trim()),
            outputTemplate: '%(title)s.%(ext)s',
            autoAssign: true,
        });
        console.log(chalk_1.default.green('  Category added!'));
    }
    else if (answer.action === 'reset') {
        categoryManager.reset();
        console.log(chalk_1.default.green('  Categories reset to defaults!'));
    }
}
async function listPaused() {
    const config = await (0, config_1.loadConfig)();
    const tempDir = config.tempDir;
    if (!(await fs.pathExists(tempDir))) {
        console.log(chalk_1.default.gray('  No paused downloads'));
        return;
    }
    const files = await fs.readdir(tempDir);
    const stateFiles = files.filter(f => f.endsWith('.json'));
    if (stateFiles.length === 0) {
        console.log(chalk_1.default.gray('  No paused downloads'));
        return;
    }
    const choices = [];
    for (const file of stateFiles) {
        const state = await fs.readJson(path.join(tempDir, file));
        const id = file.replace('.json', '');
        const progress = state.totalSize > 0
            ? ((state.chunks.reduce((s, c) => s + c.downloaded, 0) / state.totalSize) * 100).toFixed(1)
            : '0';
        choices.push({
            name: `${id} - ${progress}% - ${state.url.substring(0, 40)}...`,
            value: id,
        });
    }
    const answer = await inquirer_1.default.prompt([
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
async function resumeDownload(id) {
    const config = await (0, config_1.loadConfig)();
    const stateFile = path.join(config.tempDir, `${id}.json`);
    if (!(await fs.pathExists(stateFile))) {
        console.log(chalk_1.default.red(`  Download not found: ${id}`));
        return;
    }
    const state = await fs.readJson(stateFile);
    console.log();
    console.log(chalk_1.default.gray(`  Resuming: ${state.url}`));
    console.log();
    const downloader = new downloader_1.Downloader({
        url: state.url,
        output: state.output,
        resume: true,
        headers: state.headers,
        proxy: state.proxy,
    }, config);
    const task = downloader.getTask();
    const progressBar = new cliProgress.SingleBar({
        format: `  ${chalk_1.default.cyan('|')}{bar}${chalk_1.default.cyan('|')} {percentage}% | {downloaded}/{total} | {speed}`,
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 30,
        hideCursor: true,
    });
    downloader.on('start', () => {
        progressBar.start(100, task.progress, {
            downloaded: (0, utils_1.formatBytes)(task.downloadedSize),
            total: (0, utils_1.formatBytes)(task.totalSize),
            speed: '0 B/s',
        });
    });
    downloader.on('progress', (t) => {
        progressBar.update(t.progress, {
            downloaded: (0, utils_1.formatBytes)(t.downloadedSize),
            total: (0, utils_1.formatBytes)(t.totalSize),
            speed: (0, utils_1.formatSpeed)(t.speed),
        });
    });
    downloader.on('complete', () => {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.green('  Done!'));
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
async function showQueue() {
    const config = await (0, config_1.loadConfig)();
    const tempDir = config.tempDir;
    console.log(chalk_1.default.cyan('  Download Queue'));
    console.log();
    if (!(await fs.pathExists(tempDir))) {
        console.log(chalk_1.default.gray('  No downloads in queue'));
        return;
    }
    const files = await fs.readdir(tempDir);
    const stateFiles = files.filter(f => f.endsWith('.json'));
    if (stateFiles.length === 0) {
        console.log(chalk_1.default.gray('  No downloads in queue'));
        return;
    }
    for (const file of stateFiles) {
        const state = await fs.readJson(path.join(tempDir, file));
        const id = file.replace('.json', '');
        const progress = state.totalSize > 0
            ? ((state.chunks.reduce((s, c) => s + c.downloaded, 0) / state.totalSize) * 100).toFixed(1)
            : '0';
        console.log(`  ${chalk_1.default.cyan(id)} ${progress}%`);
        console.log(chalk_1.default.gray(`    ${state.url.substring(0, 60)}...`));
        console.log(chalk_1.default.gray(`    Output: ${state.output}`));
        console.log();
    }
}
async function configureSettings() {
    const config = await (0, config_1.loadConfig)();
    printBox('Settings', [
        `${chalk_1.default.white('Threads:')} ${config.defaultThreads}`,
        `${chalk_1.default.white('Output:')} ${config.defaultOutput}`,
        `${chalk_1.default.white('Speed limit:')} ${config.defaultSpeedLimit ? (0, utils_1.formatBytes)(config.defaultSpeedLimit) + '/s' : 'None'}`,
        `${chalk_1.default.white('Proxy:')} ${config.proxy || 'None'}`,
        `${chalk_1.default.white('Concurrent:')} ${config.concurrentDownloads}`,
        `${chalk_1.default.white('Notifications:')} ${config.notifications ? chalk_1.default.green('On') : chalk_1.default.red('Off')}`,
        `${chalk_1.default.white('History:')} ${config.historyEnabled ? chalk_1.default.green('On') : chalk_1.default.red('Off')}`,
        `${chalk_1.default.white('Max history:')} ${config.maxHistoryItems}`,
    ]);
    const answers = await inquirer_1.default.prompt([
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
    await (0, config_1.saveConfig)({
        defaultThreads: answers.threads,
        defaultOutput: answers.output,
        defaultSpeedLimit: answers.limit * 1024,
        proxy: answers.proxy || undefined,
        concurrentDownloads: answers.concurrent,
        notifications: answers.notifications,
        historyEnabled: answers.history,
        maxHistoryItems: answers.maxHistory,
    });
    console.log(chalk_1.default.green('  Settings saved!'));
}
program
    .command('resume [id]')
    .description('Resume a paused download')
    .action(async (id) => {
    printBanner();
    if (id) {
        await resumeDownload(id);
    }
    else {
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
    .action(async (url, options) => {
    printBanner();
    if (!url) {
        await scheduleDownload();
    }
    else {
        const config = await (0, config_1.loadConfig)();
        const scheduler = (0, scheduler_1.getScheduler)();
        const scheduledDate = options.time ? new Date(options.time) : new Date(Date.now() + 60 * 60 * 1000);
        scheduler.addDownload({
            url,
            output: options.output || config.defaultOutput,
            scheduledTime: scheduledDate,
        });
        console.log(chalk_1.default.green(`  Scheduled for ${(0, utils_1.formatDate)(scheduledDate)} at ${(0, utils_1.formatTime)(scheduledDate)}`));
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
    .action(async (url, options) => {
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
    }
    else {
        console.log(chalk_1.default.red('  URL is not a supported video site'));
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
    .action(async (file, options, command) => {
    printBanner();
    const config = await (0, config_1.loadConfig)();
    const opts = command?.optsWithGlobals?.() || options;
    const outputPath = opts.output || config.defaultOutput;
    if (!(await fs.pathExists(file))) {
        console.log(chalk_1.default.red(`  File not found: ${file}`));
        return;
    }
    const content = await fs.readFile(file, 'utf-8');
    const urls = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (urls.length === 0) {
        console.log(chalk_1.default.red('  No URLs found'));
        return;
    }
    console.log(chalk_1.default.cyan(`  Found ${urls.length} URLs`));
    console.log();
    const notifier = (0, notifications_1.getNotificationManager)(config.notifications);
    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: `  {url} ${chalk_1.default.cyan('|')}{bar}${chalk_1.default.cyan('|')} {percentage}%`,
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 20,
    });
    const queue = [...urls];
    const concurrent = parseInt(opts.concurrent, 10) || 3;
    let completed = 0;
    let failed = 0;
    const downloadNext = async () => {
        if (queue.length === 0)
            return;
        const url = queue.shift();
        if (!url)
            return;
        const shortUrl = url.substring(0, 25);
        const bar = multibar.create(100, 0, { url: shortUrl });
        const dl = new downloader_1.Downloader({
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
            bar.update(100, { url: chalk_1.default.green('✓ ' + shortUrl) });
        }
        catch {
            failed++;
            bar.update(0, { url: chalk_1.default.red('✗ ' + shortUrl) });
        }
    };
    const workers = [];
    for (let i = 0; i < Math.min(concurrent, urls.length); i++) {
        workers.push(downloadNext().then(function loop() {
            if (queue.length === 0)
                return Promise.resolve();
            return downloadNext().then(loop);
        }));
    }
    await Promise.all(workers);
    multibar.stop();
    console.log();
    console.log(chalk_1.default.green(`  Completed: ${completed}/${urls.length}`));
    if (failed > 0)
        console.log(chalk_1.default.red(`  Failed: ${failed}`));
    console.log();
    await notifier.notifyBatchComplete(completed, failed);
});
program
    .command('clear [id]')
    .description('Clear paused downloads')
    .action(async (id) => {
    printBanner();
    const config = await (0, config_1.loadConfig)();
    const tempDir = config.tempDir;
    if (!id) {
        if (!(await fs.pathExists(tempDir))) {
            console.log(chalk_1.default.gray('  No downloads to clear'));
            return;
        }
        const files = await fs.readdir(tempDir);
        for (const f of files) {
            await fs.unlink(path.join(tempDir, f));
        }
        console.log(chalk_1.default.green('  All paused downloads cleared'));
    }
    else {
        const stateFile = path.join(tempDir, `${id}.json`);
        if (await fs.pathExists(stateFile)) {
            await fs.unlink(stateFile);
            console.log(chalk_1.default.green(`  Cleared: ${id}`));
        }
        else {
            console.log(chalk_1.default.red(`  Not found: ${id}`));
        }
    }
});
program
    .command('verify <file> <hash>')
    .description('Verify file checksum')
    .option('-t, --type <type>', 'Hash type: md5, sha256, sha1', 'sha256')
    .action(async (file, hash, options) => {
    printBanner();
    const { calculateChecksum } = await Promise.resolve().then(() => __importStar(require('./utils')));
    if (!(await fs.pathExists(file))) {
        console.log(chalk_1.default.red(`  File not found: ${file}`));
        return;
    }
    console.log(chalk_1.default.gray(`  Calculating ${options.type} checksum...`));
    const actual = await calculateChecksum(file, options.type);
    if (actual.toLowerCase() === hash.toLowerCase()) {
        console.log(chalk_1.default.green('  ✓ Checksum verified!'));
    }
    else {
        console.log(chalk_1.default.red('  ✗ Checksum mismatch!'));
        console.log(chalk_1.default.gray(`  Expected: ${hash}`));
        console.log(chalk_1.default.gray(`  Actual:   ${actual}`));
    }
});
program.parseAsync();
//# sourceMappingURL=index.js.map