const DEFAULT_API_BASE = 'http://localhost:3001/api/v1';
const DEFAULT_TRACKED_DOMAINS = [
  'instagram.com', 'tiktok.com', 'youtube.com',
  'x.com', 'twitter.com', 'facebook.com',
];
const FLUSH_ALARM = 'break-flush';
const RESET_ALARM = 'break-reset';

// Runtime state — rebuilt on each SW wake-up from storage
let activeTabDomain: string | null = null;
let activeTabStart: number | null = null;

interface StorageData {
  accessToken?: string | null;
  apiBase?: string;
  settings?: { dailyLimitMinutes: number; trackedDomains: string[]; notificationEnabled: boolean } | null;
  todayUsage?: Record<string, number>;
  todayDate?: string;
  notificationState?: { level1: boolean; level2: boolean };
  pendingLogs?: Array<{ domain: string; seconds: number; loggedAt: string }>;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]!;
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function getStorage(): Promise<StorageData> {
  return chrome.storage.local.get([
    'accessToken', 'apiBase', 'settings',
    'todayUsage', 'todayDate', 'notificationState', 'pendingLogs',
  ]) as Promise<StorageData>;
}

async function isTracked(domain: string | null): Promise<boolean> {
  if (!domain) return false;
  const { settings } = await getStorage();
  const domains = settings?.trackedDomains ?? DEFAULT_TRACKED_DOMAINS;
  return domains.some((d) => domain === d || domain.endsWith('.' + d));
}

// Accumulate elapsed seconds for current active tab into storage
async function accumulateActiveTab(): Promise<void> {
  if (!activeTabDomain || !activeTabStart) return;
  const now = Date.now();
  const seconds = Math.floor((now - activeTabStart) / 1000);
  if (seconds <= 0) return;

  const { todayUsage = {}, todayDate, pendingLogs = [] } = await getStorage();
  const today = todayString();
  const usage = todayDate === today ? { ...todayUsage } : {};
  usage[activeTabDomain] = (usage[activeTabDomain] ?? 0) + seconds;

  pendingLogs.push({ domain: activeTabDomain, seconds, loggedAt: new Date().toISOString() });
  await chrome.storage.local.set({ todayUsage: usage, todayDate: today, pendingLogs });
  activeTabStart = now;
}

async function checkAndNotify(): Promise<void> {
  const { settings, todayUsage = {}, todayDate, notificationState = { level1: false, level2: false } } =
    await getStorage();

  if (settings?.notificationEnabled === false) return;

  const today = todayString();
  if (todayDate !== today) return;

  const limitSec = (settings?.dailyLimitMinutes ?? 60) * 60;
  const totalSec = Object.values(todayUsage).reduce((s, v) => s + v, 0);
  const overSec = totalSec - limitSec;

  if (overSec >= 30 * 60 && !notificationState.level2) {
    chrome.notifications.create('break-l2', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon48.png'),
      title: 'BREAK — Masih di sini?',
      message: `Udah ${Math.round(totalSec / 60)} menit scrolling hari ini. Yuk kerjakan misimu!`,
      buttons: [{ title: 'Buka BREAK sekarang' }],
      requireInteraction: true,
    });
    await chrome.storage.local.set({ notificationState: { level1: true, level2: true } });
  } else if (overSec >= 0 && !notificationState.level1) {
    chrome.notifications.create('break-l1', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon48.png'),
      title: 'BREAK — Waktunya istirahat!',
      message: `Eh, udah ${Math.round(totalSec / 60)} menit scrolling hari ini. Cek BREAK dulu yuk.`,
    });
    await chrome.storage.local.set({ notificationState: { ...notificationState, level1: true } });
  }
}

async function flushToAPI(): Promise<void> {
  await accumulateActiveTab();

  const { accessToken, apiBase = DEFAULT_API_BASE, pendingLogs = [] } = await getStorage();
  if (!accessToken || pendingLogs.length === 0) {
    await checkAndNotify();
    return;
  }

  try {
    const res = await fetch(`${apiBase}/usage-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ logs: pendingLogs }),
    });
    if (res.ok) {
      await chrome.storage.local.set({ pendingLogs: [] });
    }
  } catch {
    // Network error — keep pending logs, retry next alarm
  }

  await checkAndNotify();
}

async function updateActiveTab(tabId: number): Promise<void> {
  await accumulateActiveTab();

  try {
    const tab = await chrome.tabs.get(tabId);
    const domain = tab.url ? extractDomain(tab.url) : null;
    const tracked = await isTracked(domain);

    if (tracked && domain) {
      activeTabDomain = domain;
      activeTabStart = Date.now();
    } else {
      activeTabDomain = null;
      activeTabStart = null;
    }
  } catch {
    activeTabDomain = null;
    activeTabStart = null;
  }
}

// Tab event listeners
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateActiveTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id === tabId) updateActiveTab(tabId);
  });
});

chrome.tabs.onRemoved.addListener(() => {
  accumulateActiveTab().then(() => {
    activeTabDomain = null;
    activeTabStart = null;
  });
});

// Alarm handlers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FLUSH_ALARM) {
    flushToAPI();
  } else if (alarm.name === RESET_ALARM) {
    chrome.storage.local.set({
      todayUsage: {},
      todayDate: todayString(),
      notificationState: { level1: false, level2: false },
    });
  }
});

// Notification button click — Level 2 CTA
chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
  if (notifId === 'break-l2' && buttonIndex === 0) {
    chrome.tabs.create({ url: `${DEFAULT_API_BASE.replace('/api/v1', '')}/missions` });
    chrome.notifications.clear('break-l2');
  }
});

// Setup on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 });
  const midnight = new Date();
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  chrome.alarms.create(RESET_ALARM, { when: midnight.getTime(), periodInMinutes: 24 * 60 });
});

// Recreate flush alarm on browser startup (SW can be terminated)
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 });
});

export {};
