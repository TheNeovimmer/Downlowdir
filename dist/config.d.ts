import type { Config } from './types';
export declare function loadConfig(): Promise<Config>;
export declare function saveConfig(config: Partial<Config>): Promise<void>;
export declare function ensureTempDir(): Promise<string>;
export declare function resetConfig(): Promise<Config>;
export declare function getConfigPath(): string;
