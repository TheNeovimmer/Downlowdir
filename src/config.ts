import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { Config } from './types';

const CONFIG_FILE = path.join(os.homedir(), '.downlowdir', 'config.json');

const DEFAULT_CONFIG: Config = {
  defaultThreads: 8,
  defaultOutput: process.cwd(),
  defaultSpeedLimit: 0,
  maxRetries: 3,
  retryDelay: 1000,
  chunkSize: 1024 * 1024,
  tempDir: path.join(os.homedir(), '.downlowdir', 'temp'),
  proxy: undefined,
  concurrentDownloads: 3,
  notifications: true,
  historyEnabled: true,
  maxHistoryItems: 1000,
  autoCleanup: false,
  cleanupDays: 30,
  defaultCategory: undefined,
  startMinimized: false,
  clipboardMonitor: false,
};

export async function loadConfig(): Promise<Config> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const config = await fs.readJson(CONFIG_FILE);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch {
    return DEFAULT_CONFIG;
  }
  return DEFAULT_CONFIG;
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...config };
  await fs.ensureDir(path.dirname(CONFIG_FILE));
  await fs.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
}

export async function ensureTempDir(): Promise<string> {
  const config = await loadConfig();
  await fs.ensureDir(config.tempDir);
  return config.tempDir;
}

export async function resetConfig(): Promise<Config> {
  await fs.ensureDir(path.dirname(CONFIG_FILE));
  await fs.writeJson(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
  return DEFAULT_CONFIG;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
