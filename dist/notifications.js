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
exports.NotificationManager = void 0;
exports.getNotificationManager = getNotificationManager;
exports.setNotificationEnabled = setNotificationEnabled;
const notifier = __importStar(require("node-notifier"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class NotificationManager {
    constructor(enabled = true) {
        this.enabled = true;
        this.enabled = enabled;
        this.iconPath = path.join(__dirname, '../../assets/icon.png');
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    async notify(options) {
        if (!this.enabled)
            return;
        return new Promise((resolve) => {
            notifier.notify({
                title: options.title,
                message: options.message,
                icon: options.icon || this.getDefaultIcon(),
                sound: options.sound !== false,
                wait: options.wait || false,
                appID: 'downlowdir',
            }, () => resolve());
        });
    }
    async notifyDownloadComplete(filename, outputPath, size) {
        await this.notify({
            title: 'Download Complete',
            message: `${filename}\nSaved to: ${outputPath}\nSize: ${size}`,
            sound: true,
        });
    }
    async notifyDownloadFailed(filename, error) {
        await this.notify({
            title: 'Download Failed',
            message: `${filename}\nError: ${error}`,
            sound: true,
        });
    }
    async notifyBatchComplete(completed, failed) {
        await this.notify({
            title: 'Batch Download Complete',
            message: `Completed: ${completed}${failed > 0 ? ` | Failed: ${failed}` : ''}`,
            sound: true,
        });
    }
    async notifyScheduledDownload(filename) {
        await this.notify({
            title: 'Scheduled Download Started',
            message: `Now downloading: ${filename}`,
            sound: false,
        });
    }
    getDefaultIcon() {
        if (fs.existsSync(this.iconPath)) {
            return this.iconPath;
        }
        return undefined;
    }
}
exports.NotificationManager = NotificationManager;
let notificationManager = null;
function getNotificationManager(enabled = true) {
    if (!notificationManager) {
        notificationManager = new NotificationManager(enabled);
    }
    return notificationManager;
}
function setNotificationEnabled(enabled) {
    if (notificationManager) {
        notificationManager.setEnabled(enabled);
    }
}
//# sourceMappingURL=notifications.js.map