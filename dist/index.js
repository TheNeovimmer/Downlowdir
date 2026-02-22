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
const types_1 = require("./types");
const formatBytes = (bytes) => {
    if (!bytes || bytes === 0)
        return 'Unknown';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const formatSpeed = (bytesPerSec) => formatBytes(bytesPerSec) + '/s';
const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0)
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};
const printBanner = () => {
    console.log();
    console.log(chalk_1.default.cyan.bold('  ▶ downlowdir'));
    console.log(chalk_1.default.gray('  Fast multi-threaded downloader with video support'));
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
const isVideoUrl = (url) => {
    return detectVideoSite(url) !== 'other';
};
const program = new commander_1.Command();
program
    .name('dld')
    .description('Fast downloader with video support')
    .version('1.0.0')
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
                    { name: 'Batch download from file', value: 'batch' },
                    { name: 'Resume paused downloads', value: 'resume' },
                    { name: 'View download queue', value: 'queue' },
                    { name: 'Configure settings', value: 'config' },
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
    if (site !== 'other') {
        await downloadVideo(url, options, site);
    }
    else {
        await downloadFile(url, options);
    }
});
async function downloadVideo(url, options, site) {
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
        `${chalk_1.default.white('Duration:')} ${formatDuration(info.duration)}`,
        `${chalk_1.default.white('Views:')} ${info.viewCount.toLocaleString()}`,
        `${chalk_1.default.white('Site:')} ${site}`,
    ]);
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
        if (formatType.type === 'video') {
            const qualityChoices = info.qualities.map((q) => {
                const size = q.filesize || q.filesizeApprox;
                const sizeStr = size ? ` (${formatBytes(size)})` : '';
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
            options.formatId = qualityAnswer.quality;
        }
        else {
            options.format = formatType.type;
        }
        const outputAnswer = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'output',
                message: 'Output directory',
                default: options.output || process.cwd(),
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
    yt.on('progress', (p) => {
        progressBar.update(p.progress, { speed: formatSpeed(p.speed) });
    });
    try {
        await yt.download({
            url,
            output: options.output,
            format: options.format,
            formatId: options.formatId,
            proxy: options.proxy,
            cookies: options.cookies,
        });
        progressBar.update(100);
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.green('  Done!'));
        console.log();
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
    const headers = {};
    for (const h of options.header || []) {
        const [key, ...vals] = h.split(':');
        if (key && vals.length) {
            headers[key.trim()] = vals.join(':').trim();
        }
    }
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
    console.log();
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
    downloader.on('complete', (t) => {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.green('  Done!'));
        console.log(chalk_1.default.gray(`  Saved: ${t.output}`));
        console.log();
    });
    downloader.on('error', (_, err) => {
        progressBar.stop();
        console.log();
        console.log(chalk_1.default.red(`  Failed: ${err}`));
        console.log();
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
        }
        catch {
            failed++;
            bar.update(0, { url: chalk_1.default.red('✗ ' + shortUrl) });
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
        `${chalk_1.default.white('Speed limit:')} ${config.defaultSpeedLimit ? formatBytes(config.defaultSpeedLimit) + '/s' : 'None'}`,
        `${chalk_1.default.white('Proxy:')} ${config.proxy || 'None'}`,
        `${chalk_1.default.white('Concurrent:')} ${config.concurrentDownloads}`,
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
    ]);
    await (0, config_1.saveConfig)({
        defaultThreads: answers.threads,
        defaultOutput: answers.output,
        defaultSpeedLimit: answers.limit * 1024,
        proxy: answers.proxy || undefined,
        concurrentDownloads: answers.concurrent,
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
        bars.set(url, bar);
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
program.parseAsync();
//# sourceMappingURL=index.js.map