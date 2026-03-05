import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { Category } from './types';

const CATEGORIES_FILE = path.join(os.homedir(), '.downlowdir', 'categories.json');

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'video',
    name: 'Video',
    color: '#FF6B6B',
    patterns: ['youtube\\.com', 'youtu\\.be', 'twitch\\.tv', 'vimeo\\.com', 'dailymotion\\.com'],
    outputTemplate: '%(title)s.%(ext)s',
    autoAssign: true,
  },
  {
    id: 'audio',
    name: 'Audio',
    color: '#4ECDC4',
    patterns: ['soundcloud\\.com', 'spotify\\.com', 'bandcamp\\.com'],
    outputTemplate: '%(title)s.%(ext)s',
    autoAssign: true,
  },
  {
    id: 'music',
    name: 'Music',
    color: '#45B7D1',
    patterns: ['\\.(mp3|wav|flac|aac|ogg)$'],
    outputTemplate: '%(title)s.%(ext)s',
    autoAssign: true,
  },
  {
    id: 'document',
    name: 'Document',
    color: '#96CEB4',
    patterns: ['\\.(pdf|doc|docx|txt|epub|mobi)$'],
    outputTemplate: '%(title)s.%(ext)s',
    autoAssign: true,
  },
  {
    id: 'archive',
    name: 'Archive',
    color: '#DDA0DD',
    patterns: ['\\.(zip|rar|7z|tar|gz)$'],
    outputTemplate: '%(title)s.%(ext)s',
    autoAssign: true,
  },
  {
    id: 'image',
    name: 'Image',
    color: '#FFEAA7',
    patterns: ['\\.(jpg|jpeg|png|gif|webp|svg|bmp)$'],
    outputTemplate: '%(title)s.%(ext)s',
    autoAssign: true,
  },
];

export class CategoryManager {
  private categories: Category[] = [];

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    try {
      if (await fs.pathExists(CATEGORIES_FILE)) {
        const data = await fs.readJson(CATEGORIES_FILE);
        this.categories = data.categories || [];
      } else {
        this.categories = [...DEFAULT_CATEGORIES];
        await this.save();
      }
    } catch {
      this.categories = [...DEFAULT_CATEGORIES];
    }
  }

  async save(): Promise<void> {
    await fs.ensureDir(path.dirname(CATEGORIES_FILE));
    await fs.writeJson(CATEGORIES_FILE, { categories: this.categories }, { spaces: 2 });
  }

  getAll(): Category[] {
    return [...this.categories];
  }

  getById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  getByName(name: string): Category | undefined {
    return this.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  match(url: string): Category | undefined {
    for (const category of this.categories) {
      if (!category.autoAssign) continue;
      for (const pattern of category.patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(url)) return category;
        } catch {
          if (url.toLowerCase().includes(pattern.toLowerCase())) return category;
        }
      }
    }
    return undefined;
  }

  add(category: Omit<Category, 'id'>): string {
    const id = category.name.toLowerCase().replace(/\s+/g, '-');
    const newCategory: Category = { ...category, id };
    this.categories.push(newCategory);
    this.save();
    return id;
  }

  update(id: string, updates: Partial<Category>): boolean {
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  remove(id: string): boolean {
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.categories.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  toggleAutoAssign(id: string): boolean {
    const category = this.categories.find(c => c.id === id);
    if (category) {
      category.autoAssign = !category.autoAssign;
      this.save();
      return category.autoAssign;
    }
    return false;
  }

  reset(): void {
    this.categories = [...DEFAULT_CATEGORIES];
    this.save();
  }

  exportToFile(filePath: string): Promise<void> {
    return fs.writeJson(filePath, { categories: this.categories }, { spaces: 2 });
  }

  async importFromFile(filePath: string): Promise<number> {
    const data = await fs.readJson(filePath);
    if (data.categories && Array.isArray(data.categories)) {
      const imported = data.categories.length;
      this.categories = data.categories;
      await this.save();
      return imported;
    }
    return 0;
  }
}

let categoryManager: CategoryManager | null = null;

export function getCategoryManager(): CategoryManager {
  if (!categoryManager) {
    categoryManager = new CategoryManager();
  }
  return categoryManager;
}
