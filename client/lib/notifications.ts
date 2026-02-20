export type NotificationKind = 'reminder' | 'hazard' | 'campaign';

export function requestPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function notify(title: string, options?: NotificationOptions) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  } catch {}
}

export function scheduleReminder(when: Date, title: string, options?: NotificationOptions) {
  const delay = Math.max(0, when.getTime() - Date.now());
  window.setTimeout(() => notify(title, options), delay);
}
