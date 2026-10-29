// 阅读外观设置：localStorage 持久化，useSyncExternalStore 订阅。

const SETTINGS_KEY = 'dsh-plugin-novel-reader:settings:v1';

export const DEFAULT_SETTINGS = Object.freeze({
  fontSize: 15,
  lineHeight: 1.8,
  paraSpacing: 0.5,
  fontFamily: 'system',
  indent: true,
  textColor: '',
  bgColor: '',
  bgOpacity: 62,
  blur: 20,
  peekEnabled: true,
  peekWidth: 420,
  peekHeight: 168,
  peekFontSize: 14,
  autoScroll: true,
  scrollSpeed: 18,
});

export const FONT_STACKS = {
  system: 'var(--dsw-font-family, system-ui, sans-serif)',
  song: '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif',
  kai: '"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif',
  hei: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  fangsong: '"STFangsong", "FangSong", "仿宋", serif',
};

/** 背景/文字配色预设；空字符串 = 跟随 DSH 主题。 */
export const THEME_PRESETS = [
  { id: 'auto', bg: '', fg: '' },
  { id: 'paper', bg: '#f6f1e7', fg: '#3b3630' },
  { id: 'green', bg: '#d7ead3', fg: '#29382a' },
  { id: 'parchment', bg: '#e8dcc2', fg: '#4a3b28' },
  { id: 'night', bg: '#17181c', fg: '#b9bec7' },
  { id: 'ink', bg: '#0d1b2a', fg: '#c9d6e3' },
];

const RANGES = {
  fontSize: [12, 30],
  lineHeight: [1.2, 2.8],
  paraSpacing: [0, 2],
  bgOpacity: [0, 100],
  blur: [0, 40],
  peekWidth: [260, 760],
  peekHeight: [90, 480],
  peekFontSize: [11, 24],
  scrollSpeed: [4, 90],
};

function sanitize(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {};
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = source[key];
    const fallback = DEFAULT_SETTINGS[key];
    if (typeof fallback === 'number' && typeof value === 'number' && Number.isFinite(value)) {
      const [min, max] = RANGES[key];
      out[key] = Math.min(max, Math.max(min, value));
    } else if (typeof fallback === 'boolean' && typeof value === 'boolean') {
      out[key] = value;
    } else if (key === 'fontFamily' && typeof value === 'string' && value in FONT_STACKS) {
      out[key] = value;
    } else if ((key === 'textColor' || key === 'bgColor') && typeof value === 'string' && /^(#[0-9a-f]{6})?$/i.test(value)) {
      out[key] = value;
    }
  }
  return out;
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = load();
const settingsListeners = new Set();

export const settingsStore = {
  get: () => settings,
  subscribe(listener) {
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
  },
  update(patch) {
    settings = sanitize({ ...settings, ...patch });
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // storage full or blocked: keep in memory
    }
    for (const listener of settingsListeners) listener();
  },
  reset() {
    settingsStore.update(DEFAULT_SETTINGS);
  },
};

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** 把设置换算成阅读面板上的 CSS 变量。 */
export function surfaceVars(s, peek) {
  const alpha = s.bgOpacity / 100;
  return {
    '--nr-bg': s.bgColor ? hexToRgba(s.bgColor, alpha) : `color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) ${s.bgOpacity}%, transparent)`,
    '--nr-fg': s.textColor || 'var(--dsw-alias-label-primary, #1f2329)',
    '--nr-blur': `${s.blur}px`,
    '--nr-font': FONT_STACKS[s.fontFamily],
    '--nr-size': `${peek ? s.peekFontSize : s.fontSize}px`,
    '--nr-lh': String(s.lineHeight),
    '--nr-gap': `${s.paraSpacing}em`,
    '--nr-indent': s.indent ? '2em' : '0',
  };
}
