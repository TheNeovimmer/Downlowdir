declare module 'node-notifier' {
  interface NotificationOptions {
    title?: string;
    message?: string;
    icon?: string;
    sound?: boolean;
    wait?: boolean;
    appID?: string;
  }

  interface NotificationCallback {
    (err: Error | null, response: string, metadata?: unknown): void;
  }

  export function notify(
    notification: NotificationOptions,
    callback?: NotificationCallback
  ): void;

  export function isSupported(): boolean;
}
