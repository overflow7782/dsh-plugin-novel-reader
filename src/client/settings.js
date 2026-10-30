// 阅读外观设置：localStorage 持久化，useSyncExternalStore 订阅。
import { clampSurfaceColor, glassAlphaOf } from '../core/glass.js';
import { DOCK_RANK_AUTO, DOCK_RANK_MAX } from '../core/peek-geom.js';

const SETTINGS_KEY = 'dsh-plugin-novel-reader:settings:v3';
const LEGACY_KEYS = ['dsh-plugin-novel-reader:settings:v2', 'dsh-plugin-novel-reader:settings:v1'];
/** 改动这些键视为「自己调玻璃」，会退出壁纸引擎同步。 */
const OWN_GLASS_KEYS = ['glassColorLight', 'glassColorDark', 'glassDarkSeparate', 'glassAlpha', 'blur', 'glassFidelity'];

export const DEFAULT_SETTINGS = Object.freeze({
  fontSize: 15,
  lineHeight: 1.8,
  paraSpacing: 0.5,
  fontFamily: 'system',
  indent: true,
  textColor: '',
  // 玻璃：与壁纸引擎「玻璃 UI」同名同刻度同默认值，填一样的数就得到一样的底色。
  glassColorLight: '#ffffff',
  glassColorDark: '#ffffff',
  glassDarkSeparate: false,
  glassAlpha: 20,
  blur: 16,
  glassFidelity: 100,
  /** 背景直接用 dsh-plugin-wallpaper-engine 的毛玻璃（实时跟随它的设置）。 */
  glassSync: false,
  /** 书架、目录等浮层的底色；空 = 按深浅主题用实色。 */
  sheetBg: '',
  sheetOpacity: 96,
  peekEnabled: true,
  /** 右键速览窗即收起。 */
  peekRightClickClose: true,
  /** 隐藏小说的快捷键（收起速览窗 + 关掉侧栏「小说」分页）；空串 = 关闭。 */
  bossKey: 'Shift+F1',
  peekWidth: 420,
  peekHeight: 168,
  /** 速览窗底边离状态栏图标上方的距离（px）；拖速览窗的底边会改它。 */
  peekBottom: 8,
  /** 图标在状态栏里站第几格（0 = 最左）；-1 = 不插手，保持注册顺序。拖图标会改它。 */
  peekDockRank: DOCK_RANK_AUTO,
  peekFontSize: 14,
  autoScroll: false,
  scrollSpeed: 18,
});

export const FONT_STACKS = {
  system: 'var(--dsw-font-family, system-ui, sans-serif)',
  song: '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif',
  kai: '"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif',
  hei: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  fangsong: '"STFangsong", "FangSong", "仿宋", serif',
};

const RANGES = {
  fontSize: [12, 30],
  lineHeight: [1.2, 2.8],
  paraSpacing: [0, 2],
  glassAlpha: [0, 100],
  blur: [0, 60],
  glassFidelity: [0, 100],
  sheetOpacity: [40, 100],
  peekWidth: [240, 1200],
  peekHeight: [80, 720],
  peekBottom: [0, 800],
  peekDockRank: [DOCK_RANK_AUTO, DOCK_RANK_MAX],
  peekFontSize: [11, 24],
  scrollSpeed: [4, 90],
};

const COLOR_KEYS = ['textColor', 'sheetBg', 'glassColorLight', 'glassColorDark'];
/** 允许为空串（= 跟随主题）的颜色键。 */
const OPTIONAL_COLOR_KEYS = ['textColor', 'sheetBg'];

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
    } else if (key === 'bossKey' && typeof value === 'string' && (value === '' || COMBO_RE.test(value))) {
      out[key] = value;
    } else if (COLOR_KEYS.includes(key) && typeof value === 'string' && (/^#[0-9a-f]{6}$/i.test(value) || (value === '' && OPTIONAL_COLOR_KEYS.includes(key)))) {
      out[key] = value.toLowerCase();
    }
  }
  return out;
}

/** v1/v2 的背景是「颜色 + 不透明度」，与壁纸引擎的玻璃模型不同：迁移时只带走能对上的项，玻璃回到壁纸引擎默认值。 */
function migrate(legacy, fromV1) {
  const { bgColor, bgOpacity, blur, ...rest } = legacy;
  return { ...rest, ...(fromV1 ? { autoScroll: false } : {}) };
}

function load() {
  try {
    const current = localStorage.getItem(SETTINGS_KEY);
    if (current !== null) return sanitize(JSON.parse(current));
    for (const [i, key] of LEGACY_KEYS.entries()) {
      const legacy = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (legacy !== null && typeof legacy === 'object') return sanitize(migrate(legacy, i === 1));
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

// ── 快捷键组合：形如 "Ctrl+Alt+Shift+Meta+KEY"，修饰键顺序固定，主键取 event.code（与键盘布局无关）。
const MODIFIER_CODES = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'];
const COMBO_RE = /^(Ctrl\+)?(Alt\+)?(Shift\+)?(Meta\+)?[A-Za-z0-9]+$/;

/** 把按键事件换成组合串；只按了修饰键时返回空串。 */
export function comboOf(event) {
  if (MODIFIER_CODES.includes(event.code) || !event.code) return '';
  const key = event.code.replace(/^Key/, '').replace(/^Digit/, '');
  return `${event.ctrlKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.metaKey ? 'Meta+' : ''}${key}`;
}

/** 录制时要求带修饰键或是功能键，避免把普通打字的按键设成老板键。 */
export function isUsableCombo(combo) {
  return combo !== '' && (combo.includes('+') || /^F([1-9]|1[0-9]|2[0-4])$/.test(combo));
}

let recordingCombo = false;
export const isRecordingCombo = () => recordingCombo;
export function setRecordingCombo(on) {
  recordingCombo = on;
}

/** 页面上是否有 dsh-plugin-wallpaper-engine 的玻璃在工作。 */
export function wallpaperGlassActive() {
  if (typeof document === 'undefined' || document.body === null) return false;
  return document.body.hasAttribute('data-we-glass-page') || getComputedStyle(document.body).getPropertyValue('--we-sidebar-blur').trim() !== '';
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
    const ownGlass = !('glassSync' in patch) && OWN_GLASS_KEYS.some((key) => key in patch);
    settings = sanitize({ ...settings, ...patch, ...(ownGlass ? { glassSync: false } : {}) });
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

/** 自定义浮层底色时，按亮度挑深色或浅色文字。 */
function readableInk(hex) {
  const n = parseInt(hex.slice(1), 16);
  const luma = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return luma > 0.55 ? '#1f2329' : '#eef0f3';
}

/** 「深色单独设置」关着时深色也用浅色那一个玻璃色（与壁纸引擎一致）。 */
export function glassColorFor(s, theme) {
  return theme === 'dark' && s.glassDarkSeparate ? s.glassColorDark : s.glassColorLight;
}

/** 把设置换算成阅读面板上的 CSS 变量；玻璃底色的组合在 styles.js 里按主题完成。 */
export function surfaceVars(s, peek) {
  const fidelity = s.glassFidelity / 100;
  const sheet = s.sheetBg ? { '--nr-sheet-bg': hexToRgba(s.sheetBg, s.sheetOpacity / 100), '--nr-sheet-fg': readableInk(s.sheetBg) } : { '--nr-sheet-op': `${s.sheetOpacity}%` };
  return {
    ...sheet,
    '--nr-tint-light': clampSurfaceColor(glassColorFor(s, 'light'), 'light', fidelity),
    '--nr-tint-dark': clampSurfaceColor(glassColorFor(s, 'dark'), 'dark', fidelity),
    '--nr-glass-alpha': String(glassAlphaOf(s.glassAlpha)),
    '--nr-fidelity': String(fidelity),
    '--nr-fg': s.textColor || 'var(--dsw-alias-label-primary, #1f2329)',
    '--nr-blur': `${s.blur}px`,
    '--nr-font': FONT_STACKS[s.fontFamily],
    '--nr-size': `${peek ? s.peekFontSize : s.fontSize}px`,
    '--nr-lh': String(s.lineHeight),
    '--nr-gap': `${s.paraSpacing}em`,
    '--nr-indent': s.indent ? '2em' : '0',
  };
}
