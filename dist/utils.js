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
exports.sanitizeFilename = sanitizeFilename;
exports.generateId = generateId;
exports.formatBytes = formatBytes;
exports.formatSpeed = formatSpeed;
exports.formatDuration = formatDuration;
exports.formatTime = formatTime;
exports.formatDate = formatDate;
exports.parseTime = parseTime;
exports.parseDate = parseDate;
exports.isTimeInRange = isTimeInRange;
exports.matchUrlPattern = matchUrlPattern;
exports.getFileExtension = getFileExtension;
exports.getMimeType = getMimeType;
exports.calculateChecksum = calculateChecksum;
exports.getCategoryFromUrl = getCategoryFromUrl;
exports.isVideoUrl = isVideoUrl;
exports.getVideoIdFromUrl = getVideoIdFromUrl;
exports.getPlaylistIdFromUrl = getPlaylistIdFromUrl;
exports.isPlaylistUrl = isPlaylistUrl;
exports.delay = delay;
exports.clamp = clamp;
exports.getAvailableSpace = getAvailableSpace;
exports.ensureUniqueFilename = ensureUniqueFilename;
exports.parseUserAgent = parseUserAgent;
exports.truncateString = truncateString;
exports.extractDomain = extractDomain;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
function sanitizeFilename(filename) {
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
    let sanitized = filename.replace(invalidChars, '_');
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.trim();
    if (sanitized.length > 200) {
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        sanitized = name.substring(0, 200 - ext.length) + ext;
    }
    return sanitized;
}
function generateId(url) {
    return crypto.createHash('md5').update(url + Date.now()).digest('hex').substring(0, 8);
}
function formatBytes(bytes) {
    if (!bytes || bytes === 0)
        return 'Unknown';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function formatSpeed(bytesPerSec) {
    return formatBytes(bytesPerSec) + '/s';
}
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0)
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function parseTime(timeStr) {
    const match = timeStr.match(/^(\d{1,2}):?(\d{2})?$/);
    if (!match)
        return null;
    const hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59)
        return null;
    return { hours, minutes };
}
function parseDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime()))
        return null;
    return date;
}
function isTimeInRange(time, start, end) {
    const parseT = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const t = parseT(time);
    const s = parseT(start);
    const e = parseT(end);
    if (s <= e) {
        return t >= s && t <= e;
    }
    return t >= s || t <= e;
}
function matchUrlPattern(url, patterns) {
    for (const pattern of patterns) {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(url))
                return true;
        }
        catch {
            if (url.includes(pattern))
                return true;
        }
    }
    return false;
}
function getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
}
function getMimeType(filename) {
    const ext = getFileExtension(filename);
    const mimeTypes = {
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        webm: 'video/webm',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        flac: 'audio/flac',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        pdf: 'application/pdf',
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        tar: 'application/x-tar',
        gz: 'application/gzip',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
async function calculateChecksum(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}
function getCategoryFromUrl(url, categories) {
    for (const cat of categories) {
        if (matchUrlPattern(url, cat.patterns)) {
            return cat.name;
        }
    }
    return undefined;
}
function isVideoUrl(url) {
    const videoDomains = [
        'youtube.com', 'youtu.be', 'twitch.tv', 'vimeo.com',
        'twitter.com', 'x.com', 'tiktok.com', 'instagram.com',
        'facebook.com', 'fb.watch', 'reddit.com', 'soundcloud.com',
    ];
    try {
        const urlObj = new URL(url);
        return videoDomains.some(d => urlObj.hostname.includes(d));
    }
    catch {
        return false;
    }
}
function getVideoIdFromUrl(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:twitch\.tv\/videos\/|clips\.twitch\.tv\/)([0-9]+)/,
        /vimeo\.com\/([0-9]+)/,
        /(?:twitter\.com|x\.com)\/[\w]+\/status\/([0-9]+)/,
        /tiktok\.com\/@[\w]+\/video\/([0-9]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match)
            return match[1];
    }
    return null;
}
function getPlaylistIdFromUrl(url) {
    const patterns = [
        /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
        /youtube\.com\/@[\w]+\/videos/,
        /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match)
            return match[1];
    }
    return null;
}
function isPlaylistUrl(url) {
    return getPlaylistIdFromUrl(url) !== null;
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function getAvailableSpace(dirPath) {
    try {
        const stats = fs.statfsSync ? fs.statfsSync(dirPath) : null;
        if (stats) {
            return stats.bsize * stats.bfree;
        }
    }
    catch { }
    return 0;
}
function ensureUniqueFilename(outputPath) {
    if (!fs.existsSync(outputPath))
        return outputPath;
    const dir = path.dirname(outputPath);
    const ext = path.extname(outputPath);
    const name = path.basename(outputPath, ext);
    let counter = 1;
    let newPath;
    do {
        newPath = path.join(dir, `${name} (${counter})${ext}`);
        counter++;
    } while (fs.existsSync(newPath));
    return newPath;
}
function parseUserAgent() {
    const osName = os.platform();
    const osVersion = os.release();
    return `downlowdir/1.1.0 (${osName} ${osVersion})`;
}
function truncateString(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    }
    catch {
        return 'unknown';
    }
}
//# sourceMappingURL=utils.js.map