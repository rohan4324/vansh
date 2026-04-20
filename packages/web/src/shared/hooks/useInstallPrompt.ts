import { useState, useEffect, useCallback, useMemo } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_COUNT_KEY = 'vansh_visit_count';
const DISMISS_COUNT_KEY = 'vansh_install_dismiss_count';

export type InstallPlatform =
  | 'ios-safari'
  | 'ios-other'
  | 'android-chrome'
  | 'android-firefox'
  | 'android-samsung'
  | 'desktop-chrome'
  | 'desktop-edge'
  | 'desktop-safari'
  | 'desktop-firefox'
  | 'unsupported';

export interface InstallInstructions {
  platform: InstallPlatform;
  title: string;
  steps: string[];
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'unsupported';
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    if (/CriOS|FxiOS|EdgiOS/i.test(ua)) return 'ios-other';
    return 'ios-safari';
  }
  if (isAndroid) {
    if (/SamsungBrowser/i.test(ua)) return 'android-samsung';
    if (/Firefox/i.test(ua)) return 'android-firefox';
    return 'android-chrome';
  }
  if (/Edg/i.test(ua)) return 'desktop-edge';
  if (/Chrome/i.test(ua)) return 'desktop-chrome';
  if (/Firefox/i.test(ua)) return 'desktop-firefox';
  if (/Safari/i.test(ua)) return 'desktop-safari';
  return 'unsupported';
}

function getInstructions(platform: InstallPlatform): InstallInstructions {
  switch (platform) {
    case 'ios-safari':
      return {
        platform,
        title: 'Install on iPhone / iPad',
        steps: [
          'Tap the Share button at the bottom of Safari.',
          'Scroll down and tap "Add to Home Screen".',
          'Tap "Add" in the top-right to confirm.',
        ],
      };
    case 'ios-other':
      return {
        platform,
        title: 'Open in Safari to install',
        steps: [
          'Copy this page\'s URL.',
          'Open Safari on your iPhone or iPad and paste the URL.',
          'Tap Share → "Add to Home Screen".',
        ],
      };
    case 'android-chrome':
      return {
        platform,
        title: 'Install on Android',
        steps: [
          'Tap the three-dot menu in Chrome\'s top-right.',
          'Tap "Install app" or "Add to Home screen".',
          'Tap "Install" to confirm.',
        ],
      };
    case 'android-samsung':
      return {
        platform,
        title: 'Install on Samsung Internet',
        steps: [
          'Tap the menu button at the bottom.',
          'Tap "Add page to" → "Home screen".',
          'Tap "Add" to confirm.',
        ],
      };
    case 'android-firefox':
      return {
        platform,
        title: 'Install on Firefox (Android)',
        steps: [
          'Tap the three-dot menu in Firefox.',
          'Tap "Install" or "Add to Home screen".',
          'Confirm on the prompt.',
        ],
      };
    case 'desktop-chrome':
    case 'desktop-edge':
      return {
        platform,
        title: 'Install on Desktop',
        steps: [
          'Look for the install icon (⊕ or a monitor icon) on the right side of the address bar.',
          'Click it, then click "Install".',
          'If you don\'t see it, open the browser menu and choose "Install Vansh...".',
        ],
      };
    case 'desktop-safari':
      return {
        platform,
        title: 'Install on Mac Safari',
        steps: [
          'Open the File menu in Safari.',
          'Choose "Add to Dock…".',
          'Click "Add" to confirm.',
        ],
      };
    case 'desktop-firefox':
      return {
        platform,
        title: 'Firefox does not support PWA install',
        steps: [
          'Firefox on desktop does not support installing web apps directly.',
          'Try Chrome, Edge, or Safari to install Vansh.',
          'You can still use Vansh in Firefox from your bookmarks.',
        ],
      };
    default:
      return {
        platform,
        title: 'Install not available',
        steps: [
          'Your browser does not appear to support installing this app.',
          'Try opening Vansh in Chrome, Edge, or Safari.',
        ],
      };
  }
}

function detectInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return !!(standalone || iosStandalone);
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(detectInstalled);
  const platform = useMemo(detectPlatform, []);
  const instructions = useMemo(() => getInstructions(platform), [platform]);

  useEffect(() => {
    const count = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    localStorage.setItem(VISIT_COUNT_KEY, String(count + 1));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    const mql = window.matchMedia?.('(display-mode: standalone)');
    const mqlHandler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mql?.addEventListener?.('change', mqlHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      mql?.removeEventListener?.('change', mqlHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    const count = Number(localStorage.getItem(DISMISS_COUNT_KEY) || '0');
    localStorage.setItem(DISMISS_COUNT_KEY, String(count + 1));
  }, []);

  const visitCount = Number(typeof window !== 'undefined' ? localStorage.getItem(VISIT_COUNT_KEY) || '0' : '0');
  const dismissCount = Number(typeof window !== 'undefined' ? localStorage.getItem(DISMISS_COUNT_KEY) || '0' : '0');

  const canPromptNatively = !!deferredPrompt;
  const canShowInstructions = platform !== 'unsupported';

  const shouldShow =
    !isInstalled &&
    visitCount >= 2 &&
    dismissCount < 2 &&
    (canPromptNatively || platform === 'ios-safari' || platform === 'ios-other');

  return {
    canInstall: canPromptNatively || canShowInstructions,
    canPromptNatively,
    shouldShow,
    isInstalled,
    platform,
    instructions,
    promptInstall,
    dismiss,
  };
}
