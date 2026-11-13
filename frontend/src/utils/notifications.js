const SW_PATH = '/sw.js';
const CURRENT_CACHES = new Set(['trackmate-v4', 'trackmate-static-v4']);
let registrationPromise;

export const registerServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (!CURRENT_CACHES.has(name)) {
          caches.delete(name);
        }
      });
    }).catch(() => {});
  }
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SW_PATH, { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
        return reg;
      })
      .catch((error) => {
        console.error('SW registration failed', error);
        return null;
      });
  }
  return registrationPromise;
};

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Notification permission request failed', error);
    return Notification.permission;
  }
};

export const showPageNotification = async (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const payload = {
    ...options,
    tag: options.tag || 'whereismybus-alert',
    icon: options.icon || '/favicon.ico',
    badge: options.badge || '/favicon.ico'
  };

  const isVisible = document.visibilityState === 'visible';
  if (isVisible && Notification.permission === 'granted') {
    try {
      new Notification(title, payload);
    } catch (error) {
      console.error('Inline notification failed', error);
    }
  }

  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, payload);
    return true;
  } catch (error) {
    console.error('Service worker notification failed', error);
    return false;
  }
};
