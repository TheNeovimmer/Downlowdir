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
exports.CategoryManager = void 0;
exports.getCategoryManager = getCategoryManager;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CATEGORIES_FILE = path.join(os.homedir(), '.downlowdir', 'categories.json');
const DEFAULT_CATEGORIES = [
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
class CategoryManager {
    constructor() {
        this.categories = [];
        this.load();
    }
    async load() {
        try {
            if (await fs.pathExists(CATEGORIES_FILE)) {
                const data = await fs.readJson(CATEGORIES_FILE);
                this.categories = data.categories || [];
            }
            else {
                this.categories = [...DEFAULT_CATEGORIES];
                await this.save();
            }
        }
        catch {
            this.categories = [...DEFAULT_CATEGORIES];
        }
    }
    async save() {
        await fs.ensureDir(path.dirname(CATEGORIES_FILE));
        await fs.writeJson(CATEGORIES_FILE, { categories: this.categories }, { spaces: 2 });
    }
    getAll() {
        return [...this.categories];
    }
    getById(id) {
        return this.categories.find(c => c.id === id);
    }
    getByName(name) {
        return this.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    }
    match(url) {
        for (const category of this.categories) {
            if (!category.autoAssign)
                continue;
            for (const pattern of category.patterns) {
                try {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(url))
                        return category;
                }
                catch {
                    if (url.toLowerCase().includes(pattern.toLowerCase()))
                        return category;
                }
            }
        }
        return undefined;
    }
    add(category) {
        const id = category.name.toLowerCase().replace(/\s+/g, '-');
        const newCategory = { ...category, id };
        this.categories.push(newCategory);
        this.save();
        return id;
    }
    update(id, updates) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...updates };
            this.save();
            return true;
        }
        return false;
    }
    remove(id) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            this.categories.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }
    toggleAutoAssign(id) {
        const category = this.categories.find(c => c.id === id);
        if (category) {
            category.autoAssign = !category.autoAssign;
            this.save();
            return category.autoAssign;
        }
        return false;
    }
    reset() {
        this.categories = [...DEFAULT_CATEGORIES];
        this.save();
    }
    exportToFile(filePath) {
        return fs.writeJson(filePath, { categories: this.categories }, { spaces: 2 });
    }
    async importFromFile(filePath) {
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
exports.CategoryManager = CategoryManager;
let categoryManager = null;
function getCategoryManager() {
    if (!categoryManager) {
        categoryManager = new CategoryManager();
    }
    return categoryManager;
}
//# sourceMappingURL=categories.js.map