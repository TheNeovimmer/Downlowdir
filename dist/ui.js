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
exports.theme = void 0;
exports.createScreen = createScreen;
exports.createHeader = createHeader;
exports.createFooter = createFooter;
exports.createMainMenu = createMainMenu;
exports.createStatusBar = createStatusBar;
exports.createInfoBox = createInfoBox;
exports.createProgressBox = createProgressBox;
exports.createSearchBox = createSearchBox;
exports.createListBox = createListBox;
exports.createForm = createForm;
exports.createConfirmDialog = createConfirmDialog;
exports.createLogBox = createLogBox;
exports.clearScreenChildren = clearScreenChildren;
exports.showMessage = showMessage;
/* eslint-disable @typescript-eslint/no-explicit-any */
const blessed = __importStar(require("blessed"));
exports.theme = {
    primary: 'cyan',
    secondary: 'magenta',
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'blue',
    border: 'blue',
    text: 'white',
    muted: 'gray',
};
const c = (color) => color;
function createScreen() {
    return blessed.screen({
        smartCSR: true,
        title: 'downlowdir - Download Manager',
        fullUnicode: true,
    });
}
function createHeader(screen) {
    const header = blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        width: '100%',
        height: 5,
        style: {
            fg: 'white',
            bg: 'black',
        },
        content: `
 {cyan.bold.italic}▶ downlowdir{/}
 {gray}Advanced IDM alternative - Multi-threaded downloader{/}

 {gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/}
`,
    });
    return header;
}
function createFooter(screen) {
    const footer = blessed.box({
        parent: screen,
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        style: {
            fg: 'gray',
            bg: 'black',
        },
        content: ` {gray}↑↓{/} Navigate {gray}|{/} {gray}Enter{/} Select {gray}|{/} {gray}Esc{/} Back {gray}|{/} {gray}Ctrl+C{/} Exit {gray}|{/} {gray}/{/} Search`,
    });
    return footer;
}
function createMainMenu(screen, options, onSelect, onCancel) {
    const icons = {
        'Download File': '⬇',
        'Download Playlist': '📋',
        'Batch Download': '📁',
        'Schedule Download': '⏰',
        'Resume Downloads': '▶',
        'Download Queue': '📑',
        'View History': '📜',
        'Manage Categories': '🏷',
        'Statistics': '📊',
        'Settings': '⚙',
        'Exit': '✕',
    };
    const menu = blessed.list({
        parent: screen,
        top: 6,
        left: 'center',
        width: '60%',
        height: options.length + 4,
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            selected: { bg: c(exports.theme.primary), fg: 'black', bold: true },
            item: { fg: exports.theme.text },
            hover: { bg: c(exports.theme.primary), fg: 'black' },
        },
        items: options.map((opt) => ` ${icons[opt] || '•'}  ${opt}`),
        keys: true,
        mouse: true,
        vi: true,
    });
    menu.on('select', (_item, index) => {
        onSelect(index);
    });
    menu.on('cancel', () => {
        onCancel();
    });
    return menu;
}
function createStatusBar(screen, message = '') {
    const statusBar = blessed.box({
        parent: screen,
        bottom: 3,
        left: 0,
        width: '100%',
        height: 1,
        style: {
            fg: exports.theme.muted,
            bg: 'black',
        },
        content: message,
    });
    return statusBar;
}
function createInfoBox(screen, title, lines, top = 6) {
    const height = Math.min(lines.length + 4, 20);
    const box = blessed.box({
        parent: screen,
        top,
        left: 'center',
        width: '70%',
        height,
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(exports.theme.primary) },
        },
        content: `{bold}${title}{/}\n${'─'.repeat(title.length)}\n${lines.join('\n')}`,
    });
    return box;
}
function createProgressBox(screen, title) {
    const box = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '60%',
        height: 10,
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(exports.theme.primary) },
        },
        content: `{bold}${title}{/}`,
    });
    const progress = blessed.progressbar({
        parent: box,
        top: 3,
        left: 3,
        width: '94%',
        height: 3,
        style: {
            fg: c(exports.theme.primary),
            bg: 'black',
            bar: {
                fg: c(exports.theme.success),
                bg: c(exports.theme.primary),
            },
        },
    });
    return { box, progress };
}
function createSearchBox(screen, placeholder = 'Search...') {
    const box = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '50%',
        height: 5,
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(exports.theme.primary) },
        },
    });
    blessed.text({
        parent: box,
        top: 0,
        left: 3,
        content: 'Search:',
        style: { fg: exports.theme.text },
    });
    const input = blessed.textbox({
        parent: box,
        top: 1,
        left: 3,
        width: '90%',
        height: 1,
        border: { type: 'line', fg: c(exports.theme.muted) },
        inputOnFocus: true,
        placeholder,
        style: {
            fg: exports.theme.text,
            placeholder: { fg: exports.theme.muted },
        },
    });
    return { box, input };
}
function createListBox(screen, _title, items, onSelect, onCancel, options = {}) {
    const height = Math.min(items.length + 6, 25);
    const list = blessed.list({
        parent: screen,
        top: 6,
        left: 'center',
        width: '80%',
        height,
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            selected: { bg: c(exports.theme.primary), fg: 'black', bold: true },
            item: { fg: exports.theme.text },
            hover: { bg: c(exports.theme.primary), fg: 'black' },
        },
        items,
        keys: true,
        mouse: true,
        vi: true,
        searchable: options.searchable,
    });
    list.on('select', (_item, index) => {
        onSelect(index);
    });
    list.on('cancel', () => {
        onCancel();
    });
    return list;
}
function createForm(screen, fields, onSubmit, onCancel) {
    const formHeight = fields.length * 3 + 5;
    const formBox = blessed.form({
        parent: screen,
        top: 6,
        left: 'center',
        width: '60%',
        height: formHeight,
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(exports.theme.primary) },
        },
    });
    const inputs = {};
    fields.forEach((field, index) => {
        const y = index * 3 + 1;
        blessed.text({
            parent: formBox,
            top: y,
            left: 3,
            content: field.label + ':',
            style: { fg: exports.theme.text },
        });
        if (field.type === 'confirm') {
            const checkbox = blessed.checkbox({
                parent: formBox,
                top: y + 1,
                left: 3,
                checked: field.value === 'true',
                style: { fg: exports.theme.text },
            });
            inputs[field.label] = checkbox;
        }
        else {
            const input = blessed.textbox({
                parent: formBox,
                top: y + 1,
                left: 3,
                width: '90%',
                height: 1,
                border: { type: 'line', fg: c(exports.theme.muted) },
                inputOnFocus: true,
                value: field.value,
                style: {
                    fg: exports.theme.text,
                    focus: { border: { fg: c(exports.theme.primary) } },
                },
            });
            inputs[field.label] = input;
        }
    });
    const submitBtn = blessed.button({
        parent: formBox,
        top: formHeight - 3,
        left: '30%',
        width: 15,
        height: 1,
        content: ' Submit ',
        style: {
            fg: 'black',
            bg: c(exports.theme.success),
            bold: true,
        },
    });
    const cancelBtn = blessed.button({
        parent: formBox,
        top: formHeight - 3,
        left: '55%',
        width: 10,
        height: 1,
        content: ' Cancel ',
        style: {
            fg: 'black',
            bg: c(exports.theme.error),
            bold: true,
        },
    });
    submitBtn.on('press', () => {
        const values = {};
        for (const [key, input] of Object.entries(inputs)) {
            if ('getValue' in input) {
                values[key] = input.getValue();
            }
            else if ('checked' in input) {
                values[key] = input.checked;
            }
        }
        onSubmit(values);
    });
    cancelBtn.on('press', () => {
        onCancel();
    });
    return { form: formBox, inputs };
}
function createConfirmDialog(screen, message, onConfirm, onCancel) {
    const dialog = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 50,
        height: 7,
        border: { type: 'line', fg: c(exports.theme.warning) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(exports.theme.warning) },
        },
    });
    blessed.text({
        parent: dialog,
        top: 1,
        left: 'center',
        content: message,
        style: { fg: exports.theme.text },
    });
    const yesBtn = blessed.button({
        parent: dialog,
        top: 4,
        left: 10,
        width: 8,
        height: 1,
        content: ' Yes ',
        style: {
            fg: 'black',
            bg: c(exports.theme.success),
        },
    });
    const noBtn = blessed.button({
        parent: dialog,
        top: 4,
        left: 25,
        width: 8,
        height: 1,
        content: ' No ',
        style: {
            fg: 'black',
            bg: c(exports.theme.error),
        },
    });
    yesBtn.on('press', () => {
        screen.remove(dialog);
        screen.render();
        onConfirm();
    });
    noBtn.on('press', () => {
        screen.remove(dialog);
        screen.render();
        onCancel();
    });
    return dialog;
}
function createLogBox(screen, _title) {
    const scrollable = blessed.scrollablebox({
        parent: screen,
        top: 6,
        left: 'center',
        width: '80%',
        height: '60%',
        border: { type: 'line', fg: c(exports.theme.primary) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(exports.theme.primary) },
        },
    });
    const log = blessed.log({
        parent: scrollable,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        scrollable: true,
        style: {
            fg: exports.theme.text,
        },
    });
    return { box: log, scrollable };
}
function clearScreenChildren(screen) {
    const children = screen.children.filter((child) => child.type !== 'terminal');
    for (const child of children) {
        screen.remove(child);
    }
}
function showMessage(screen, message, type = 'info', duration = 2000) {
    const colors = {
        success: exports.theme.success,
        error: exports.theme.error,
        info: exports.theme.primary,
    };
    const msg = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: message.length + 10,
        height: 3,
        border: { type: 'line', fg: c(colors[type]) },
        style: {
            fg: exports.theme.text,
            border: { fg: c(colors[type]) },
        },
        content: ` ${message} `,
    });
    screen.render();
    setTimeout(() => {
        screen.remove(msg);
        screen.render();
    }, duration);
}
//# sourceMappingURL=ui.js.map