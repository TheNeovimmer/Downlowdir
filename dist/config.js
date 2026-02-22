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
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.ensureTempDir = ensureTempDir;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_FILE = path.join(os.homedir(), '.downlowdir', 'config.json');
const DEFAULT_CONFIG = {
    defaultThreads: 8,
    defaultOutput: process.cwd(),
    defaultSpeedLimit: 0,
    maxRetries: 3,
    retryDelay: 1000,
    chunkSize: 1024 * 1024,
    tempDir: path.join(os.homedir(), '.downlowdir', 'temp'),
    proxy: undefined,
    concurrentDownloads: 3,
};
async function loadConfig() {
    try {
        if (await fs.pathExists(CONFIG_FILE)) {
            const config = await fs.readJson(CONFIG_FILE);
            return { ...DEFAULT_CONFIG, ...config };
        }
    }
    catch {
        return DEFAULT_CONFIG;
    }
    return DEFAULT_CONFIG;
}
async function saveConfig(config) {
    const currentConfig = await loadConfig();
    const newConfig = { ...currentConfig, ...config };
    await fs.ensureDir(path.dirname(CONFIG_FILE));
    await fs.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
}
async function ensureTempDir() {
    const config = await loadConfig();
    await fs.ensureDir(config.tempDir);
    return config.tempDir;
}
//# sourceMappingURL=config.js.map