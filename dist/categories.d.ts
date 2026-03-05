import type { Category } from './types';
export declare class CategoryManager {
    private categories;
    constructor();
    load(): Promise<void>;
    save(): Promise<void>;
    getAll(): Category[];
    getById(id: string): Category | undefined;
    getByName(name: string): Category | undefined;
    match(url: string): Category | undefined;
    add(category: Omit<Category, 'id'>): string;
    update(id: string, updates: Partial<Category>): boolean;
    remove(id: string): boolean;
    toggleAutoAssign(id: string): boolean;
    reset(): void;
    exportToFile(filePath: string): Promise<void>;
    importFromFile(filePath: string): Promise<number>;
}
export declare function getCategoryManager(): CategoryManager;
