const DEFAULT_API_BASE = 'http://localhost:3001/api/v1';
const WEB_BASE = 'http://localhost:5173';

interface StorageData {
  accessToken?: string | null;
  apiBase?: string;
  settings?: { dailyLimitMinutes: number; trackedDomains: string[] } | null;
  todayUsage?: Record<string, number>;
  todayDate?: string;
}

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]!;
}

function fmtMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m} mnt` : `${Math.floor(m / 60)} jam ${m % 60} mnt`;
}

async function getStorage(): Promise<StorageData> {
  return chrome.storage.local.get([
    'accessToken', 'apiBase', 'settings', 'todayUsage', 'todayDate',
  ]) as Promise<StorageData>;
}

async function showError(msg: string): Promise<void> {
  const el = $('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function doLogin(): Promise<void> {
  const email = ($('email') as HTMLInputElement).value.trim();
  const password = ($('password') as HTMLInputElement).value;
  const btn = $('login-btn') as HTMLButtonElement;

  if (!email || !password) {
    showError('Isi email dan password');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Masuk...';

  const { apiBase = DEFAULT_API_BASE } = await getStorage();

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      showError(json.error?.message ?? 'Login gagal');
      return;
    }

    const { accessToken, refreshToken, user } = json.data;

    // Fetch settings after login
    let settings = null;
    try {
      const settingsRes = await fetch(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        settings = settingsJson.data?.settings;
      }
    } catch { /* ignore */ }

    await chrome.storage.local.set({
      accessToken,
      refreshToken,
      userId: user.id,
      settings,
      todayUsage: {},
      todayDate: todayString(),
      notificationState: { level1: false, level2: false },
      pendingLogs: [],
    });

    renderDashboard();
  } catch {
    showError('Gagal terhubung ke server BREAK');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}

async function doLogout(): Promise<void> {
  await chrome.storage.local.set({
    accessToken: null,
    refreshToken: null,
    pendingLogs: [],
    todayUsage: {},
  });
  renderLogin();
}

function renderLogin(): void {
  $('view-login').classList.remove('hidden');
  $('view-dashboard').classList.add('hidden');

  $('login-btn').addEventListener('click', doLogin);
  $('password').addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') doLogin();
  });
}

function renderDashboard(): void {
  $('view-login').classList.add('hidden');
  $('view-dashboard').classList.remove('hidden');
  $('view-footer').classList.remove('hidden');

  getStorage().then(({ todayUsage = {}, todayDate, settings }) => {
    const today = todayString();
    const usage = todayDate === today ? todayUsage : {};
    const totalSec = Object.values(usage).reduce((s, v) => s + v, 0);
    const limitSec = (settings?.dailyLimitMinutes ?? 60) * 60;
    const pct = Math.min(100, Math.round((totalSec / limitSec) * 100));

    $('total-time').textContent = fmtMinutes(totalSec);
    $('limit-label').textContent = `dari batas ${fmtMinutes(limitSec)}`;

    const bar = $('usage-bar');
    bar.style.width = `${pct}%`;
    bar.className = `h-full rounded-full transition-all ${
      pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
    }`;

    const list = $('domain-list');
    const entries = Object.entries(usage).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      list.innerHTML = '<li class="text-gray-400 text-xs">Belum ada aktivitas hari ini.</li>';
    } else {
      list.innerHTML = entries
        .map(([domain, sec]) => `
          <li class="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
            <span class="text-gray-700">${domain}</span>
            <span class="text-gray-500">${fmtMinutes(sec)}</span>
          </li>
        `)
        .join('');
    }
  });

  $('open-missions').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_BASE}/missions` });
    window.close();
  });

  $('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_BASE}/dashboard` });
    window.close();
  });

  $('logout-btn').addEventListener('click', doLogout);
}

// Init
getStorage().then(({ accessToken }) => {
  if (accessToken) {
    renderDashboard();
  } else {
    renderLogin();
  }
});
