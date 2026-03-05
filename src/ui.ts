/* eslint-disable @typescript-eslint/no-explicit-any */
import * as blessed from 'blessed';

export interface UITheme {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  border: string;
  text: string;
  muted: string;
}

export const theme: UITheme = {
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

const c = (color: string): any => color;

export function createScreen(): blessed.Widgets.Screen {
  return blessed.screen({
    smartCSR: true,
    title: 'downlowdir - Download Manager',
    fullUnicode: true,
  });
}

export function createHeader(screen: blessed.Widgets.Screen): any {
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

export function createFooter(screen: blessed.Widgets.Screen): any {
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

export function createMainMenu(
  screen: blessed.Widgets.Screen,
  options: string[],
  onSelect: (index: number) => void,
  onCancel: () => void
): any {
  const icons: Record<string, string> = {
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
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      selected: { bg: c(theme.primary), fg: 'black', bold: true },
      item: { fg: theme.text },
      hover: { bg: c(theme.primary), fg: 'black' },
    },
    items: options.map((opt) => ` ${icons[opt] || '•'}  ${opt}`),
    keys: true,
    mouse: true,
    vi: true,
  });

  menu.on('select', (_item: any, index: any) => {
    onSelect(index);
  });

  menu.on('cancel', () => {
    onCancel();
  });

  return menu;
}

export function createStatusBar(
  screen: blessed.Widgets.Screen,
  message: string = ''
): any {
  const statusBar = blessed.box({
    parent: screen,
    bottom: 3,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      fg: theme.muted,
      bg: 'black',
    },
    content: message,
  });
  return statusBar;
}

export function createInfoBox(
  screen: blessed.Widgets.Screen,
  title: string,
  lines: string[],
  top: number = 6
): any {
  const height = Math.min(lines.length + 4, 20);

  const box = blessed.box({
    parent: screen,
    top,
    left: 'center',
    width: '70%',
    height,
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      fg: theme.text,
      border: { fg: c(theme.primary) },
    },
    content: `{bold}${title}{/}\n${'─'.repeat(title.length)}\n${lines.join('\n')}`,
  });
  return box;
}

export function createProgressBox(
  screen: blessed.Widgets.Screen,
  title: string
): { box: any; progress: any } {
  const box = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: 10,
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      fg: theme.text,
      border: { fg: c(theme.primary) },
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
      fg: c(theme.primary),
      bg: 'black',
      bar: {
        fg: c(theme.success),
        bg: c(theme.primary),
      },
    },
  });

  return { box, progress };
}

export function createSearchBox(
  screen: blessed.Widgets.Screen,
  placeholder: string = 'Search...'
): { box: any; input: any } {
  const box = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 5,
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      fg: theme.text,
      border: { fg: c(theme.primary) },
    },
  });

  blessed.text({
    parent: box,
    top: 0,
    left: 3,
    content: 'Search:',
    style: { fg: theme.text },
  });

  const input = blessed.textbox({
    parent: box,
    top: 1,
    left: 3,
    width: '90%',
    height: 1,
    border: { type: 'line' as const, fg: c(theme.muted) },
    inputOnFocus: true,
    placeholder,
    style: {
      fg: theme.text,
      placeholder: { fg: theme.muted },
    },
  });

  return { box, input };
}

export function createListBox(
  screen: blessed.Widgets.Screen,
  _title: string,
  items: string[],
  onSelect: (index: number) => void,
  onCancel: () => void,
  options: {
    searchable?: boolean;
    multiSelect?: boolean;
  } = {}
): any {
  const height = Math.min(items.length + 6, 25);

  const list = blessed.list({
    parent: screen,
    top: 6,
    left: 'center',
    width: '80%',
    height,
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      selected: { bg: c(theme.primary), fg: 'black', bold: true },
      item: { fg: theme.text },
      hover: { bg: c(theme.primary), fg: 'black' },
    },
    items,
    keys: true,
    mouse: true,
    vi: true,
    searchable: options.searchable,
  });

  list.on('select', (_item: any, index: any) => {
    onSelect(index);
  });

  list.on('cancel', () => {
    onCancel();
  });

  return list;
}

export function createForm(
  screen: blessed.Widgets.Screen,
  fields: { label: string; value: string; type?: 'input' | 'number' | 'confirm' }[],
  onSubmit: (values: Record<string, string | boolean>) => void,
  onCancel: () => void
): { form: any; inputs: Record<string, any> } {
  const formHeight = fields.length * 3 + 5;
  const formBox = blessed.form({
    parent: screen,
    top: 6,
    left: 'center',
    width: '60%',
    height: formHeight,
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      fg: theme.text,
      border: { fg: c(theme.primary) },
    },
  });

  const inputs: Record<string, any> = {};

  fields.forEach((field, index) => {
    const y = index * 3 + 1;

    blessed.text({
      parent: formBox,
      top: y,
      left: 3,
      content: field.label + ':',
      style: { fg: theme.text },
    });

    if (field.type === 'confirm') {
      const checkbox = blessed.checkbox({
        parent: formBox,
        top: y + 1,
        left: 3,
        checked: field.value === 'true',
        style: { fg: theme.text },
      });
      inputs[field.label] = checkbox;
    } else {
      const input = blessed.textbox({
        parent: formBox,
        top: y + 1,
        left: 3,
        width: '90%',
        height: 1,
        border: { type: 'line' as const, fg: c(theme.muted) },
        inputOnFocus: true,
        value: field.value,
        style: {
          fg: theme.text,
          focus: { border: { fg: c(theme.primary) } },
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
      bg: c(theme.success),
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
      bg: c(theme.error),
      bold: true,
    },
  });

  submitBtn.on('press', () => {
    const values: Record<string, string | boolean> = {};
    for (const [key, input] of Object.entries(inputs)) {
      if ('getValue' in input) {
        values[key] = input.getValue();
      } else if ('checked' in input) {
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

export function createConfirmDialog(
  screen: blessed.Widgets.Screen,
  message: string,
  onConfirm: () => void,
  onCancel: () => void
): any {
  const dialog = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 50,
    height: 7,
    border: { type: 'line' as const, fg: c(theme.warning) },
    style: {
      fg: theme.text,
      border: { fg: c(theme.warning) },
    },
  });

  blessed.text({
    parent: dialog,
    top: 1,
    left: 'center',
    content: message,
    style: { fg: theme.text },
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
      bg: c(theme.success),
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
      bg: c(theme.error),
    },
  });

  yesBtn.on('press', () => {
    screen.remove(dialog as any);
    screen.render();
    onConfirm();
  });

  noBtn.on('press', () => {
    screen.remove(dialog as any);
    screen.render();
    onCancel();
  });

  return dialog;
}

export function createLogBox(
  screen: blessed.Widgets.Screen,
  _title: string
): { box: any; scrollable: any } {
  const scrollable = blessed.scrollablebox({
    parent: screen,
    top: 6,
    left: 'center',
    width: '80%',
    height: '60%',
    border: { type: 'line' as const, fg: c(theme.primary) },
    style: {
      fg: theme.text,
      border: { fg: c(theme.primary) },
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
      fg: theme.text,
    },
  });

  return { box: log, scrollable };
}

export function clearScreenChildren(screen: blessed.Widgets.Screen): void {
  const children = screen.children.filter((child: any) => child.type !== 'terminal');
  for (const child of children) {
    screen.remove(child);
  }
}

export function showMessage(
  screen: blessed.Widgets.Screen,
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 2000
): void {
  const colors: Record<string, string> = {
    success: theme.success,
    error: theme.error,
    info: theme.primary,
  };

  const msg = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: message.length + 10,
    height: 3,
    border: { type: 'line' as const, fg: c(colors[type]) },
    style: {
      fg: theme.text,
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
