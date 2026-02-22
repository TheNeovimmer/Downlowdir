"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDEO_SITES = exports.DownloadStatus = void 0;
var DownloadStatus;
(function (DownloadStatus) {
    DownloadStatus["Pending"] = "pending";
    DownloadStatus["Queued"] = "queued";
    DownloadStatus["Downloading"] = "downloading";
    DownloadStatus["Paused"] = "paused";
    DownloadStatus["Completed"] = "completed";
    DownloadStatus["Failed"] = "failed";
    DownloadStatus["Cancelled"] = "cancelled";
})(DownloadStatus || (exports.DownloadStatus = DownloadStatus = {}));
exports.VIDEO_SITES = {
    youtube: /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/,
    twitch: /(?:twitch\.tv|clips\.twitch\.tv)/,
    vimeo: /vimeo\.com/,
    twitter: /(?:twitter\.com|x\.com)/,
    tiktok: /tiktok\.com/,
    instagram: /instagram\.com/,
    facebook: /facebook\.com|fb\.watch/,
    other: /.*/,
};
//# sourceMappingURL=types.js.map