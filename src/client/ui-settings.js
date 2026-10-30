// DSH 设置窗口里「小说阅读」一页。玻璃一组与壁纸引擎「玻璃 UI」同名、同刻度、同配方。
/* global React, h */
import { comboOf, isUsableCombo, setRecordingCombo, settingsStore, wallpaperGlassActive } from './settings.js';
import { GLASS_COLOR_PRESETS } from '../core/glass.js';
import { DOCK_RANK_AUTO } from '../core/peek-geom.js';
import { dockItemCount } from './dock-order.js';
import { t } from './i18n.js';
import { useSettings } from './ui-shared.js';

const FONT_OPTIONS = [
  ['system', 'fontSystem'],
  ['song', 'fontSong'],
  ['kai', 'fontKai'],
  ['hei', 'fontHei'],
  ['fangsong', 'fontFangsong'],
];

const update = (key, value) => settingsStore.update({ [key]: value });

function Row(label, control, labelText) {
  return h('div', { className: 'nr-row' }, h('label', null, labelText ?? t(label)), h('div', { className: 'nr-ctl' }, control));
}

function RangeRow({ k, min, max, step = 1, unit = '' }) {
  const value = useSettings()[k];
  return Row(k, [
    h('input', { key: 'r', type: 'range', min, max, step, value, 'aria-label': t(k), onChange: (e) => update(k, Number(e.target.value)) }),
    h('span', { key: 'v', className: 'nr-val' }, `${step < 1 ? value.toFixed(1) : value}${unit}`),
  ]);
}

/** 滑杆 + 数字框，适合需要精确到像素的尺寸。数字框在失焦或回车时提交。 */
function SizeRow({ k, min, max, step = 10 }) {
  const value = useSettings()[k];
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n)) update(k, Math.round(n));
    else setDraft(String(value));
  };
  return Row(k, [
    h('input', { key: 'r', type: 'range', min, max, step, value, 'aria-label': t(k), onChange: (e) => update(k, Number(e.target.value)) }),
    h('input', {
      key: 'n',
      type: 'number',
      className: 'nr-num',
      min,
      max,
      value: draft,
      'aria-label': t(k),
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e) => {
        if (e.key === 'Enter') commit();
      },
    }),
    h('span', { key: 'u', className: 'nr-unit' }, 'px'),
  ]);
}

/**
 * 图标位置：一条流程轴。游标停在哪一格，图标就插在状态栏的第几格；
 * 轴下面每个点都是那一格，可以直接点。「回归原位」= 不再插手排序，跟在最后。
 */
function DockAxisRow() {
  const rank = useSettings().peekDockRank;
  // 还没探到状态栏（对话区没挂载过）就先按常见的四项给，别给出空轴。
  const count = Math.max(dockItemCount() || 4, 1);
  const last = count - 1;
  const auto = rank === DOCK_RANK_AUTO;
  const shown = auto ? last : Math.min(Math.max(rank, 0), last);
  const set = (next) => update('peekDockRank', next);
  return Row('peekDockRank', [
    h(
      'div',
      { key: 'axis', className: 'nr-axis' },
      h('input', {
        type: 'range',
        min: 0,
        max: last,
        step: 1,
        value: shown,
        'aria-label': t('peekDockRank'),
        onChange: (e) => set(Number(e.currentTarget.value)),
      }),
      h(
        'div',
        { className: 'nr-ticks' },
        Array.from({ length: count }, (_, i) =>
          h('button', {
            key: i,
            type: 'button',
            tabIndex: -1,
            className: 'nr-tick',
            title: t('dockRankN', { n: i + 1 }),
            'data-active': (!auto && shown === i) || undefined,
            onClick: () => set(i),
          }),
        ),
      ),
    ),
    h('span', { key: 'v', className: 'nr-val' }, auto ? t('dockRankAuto') : t('dockRankN', { n: shown + 1 })),
    h('button', { key: 'reset', type: 'button', className: 'nr-btn nr-btn-outline', disabled: auto || undefined, onClick: () => set(DOCK_RANK_AUTO) }, t('dockRankReset')),
  ]);
}

/** 点一下进入录制，按下新的组合键保存；Esc 取消，Backspace 关闭快捷键。 */
function BossKeyRow() {
  const value = useSettings().bossKey;
  const [recording, setRecording] = React.useState(false);
  React.useEffect(() => {
    if (!recording) return;
    setRecordingCombo(true);
    const onKey = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') return setRecording(false);
      if (event.key === 'Backspace' && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
        update('bossKey', '');
        return setRecording(false);
      }
      const combo = comboOf(event);
      if (!isUsableCombo(combo)) return;
      update('bossKey', combo);
      setRecording(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      setRecordingCombo(false);
    };
  }, [recording]);
  return Row('bossKey', [
    h('button', { key: 'rec', type: 'button', className: 'nr-btn nr-btn-outline nr-kbd', 'data-active': recording || undefined, onClick: () => setRecording((v) => !v) }, recording ? t('bossKeyRecording') : value || t('bossKeyOff')),
    value !== 'Shift+F1' ? h('button', { key: 'def', type: 'button', className: 'nr-btn', onClick: () => update('bossKey', 'Shift+F1') }, t('reset')) : null,
  ]);
}

function CheckRow({ k }) {
  const value = useSettings()[k];
  return Row(k, h('input', { type: 'checkbox', checked: value, 'aria-label': t(k), onChange: (e) => update(k, e.target.checked) }));
}

/** 可以「跟随主题」（空值）的颜色行。 */
function ColorRow({ k, fallback }) {
  const value = useSettings()[k];
  return Row(k, [
    h('input', { key: 'c', type: 'color', value: value || fallback, 'aria-label': t(k), onChange: (e) => update(k, e.target.value) }),
    h('button', { key: 'b', type: 'button', className: 'nr-btn nr-btn-outline', 'data-active': value === '' || undefined, onClick: () => update(k, '') }, t('followTheme')),
  ]);
}

/** 玻璃颜色：壁纸引擎同款六个色板 + 自定义取色。 */
function GlassColorRow({ k, label }) {
  const value = useSettings()[k];
  const custom = !GLASS_COLOR_PRESETS.includes(value);
  return Row(
    k,
    h(
      'div',
      { className: 'nr-swatches' },
      GLASS_COLOR_PRESETS.map((color) =>
        h('button', { key: color, type: 'button', className: 'nr-swatch nr-swatch-round', title: color, 'aria-label': color, 'data-active': value === color || undefined, style: { background: color }, onClick: () => update(k, color) }),
      ),
      h(
        'label',
        { key: 'custom', className: 'nr-swatch-custom', 'data-active': custom || undefined, title: t('custom') },
        h('input', { type: 'color', value, 'aria-label': t('custom'), onChange: (e) => update(k, e.target.value) }),
        t('custom'),
      ),
    ),
    label,
  );
}

function Group(title, ...rows) {
  return h('section', { className: 'nr-group' }, h('h3', { className: 'nr-group-title' }, t(title)), ...rows);
}

/** 一键同步 dsh-plugin-wallpaper-engine 的毛玻璃；没检测到它且未开启同步时不显示。 */
function GlassSyncRow() {
  const s = useSettings();
  if (!s.glassSync && !wallpaperGlassActive()) return null;
  return h(
    'div',
    { className: 'nr-sync' },
    h('span', null, s.glassSync ? t('glassSyncOn') : t('glassSyncHint')),
    h('button', { type: 'button', className: 'nr-btn nr-btn-outline', onClick: () => update('glassSync', !s.glassSync) }, s.glassSync ? t('glassSyncOff') : t('glassSync')),
  );
}

/** 玻璃一组：顺序与壁纸引擎「玻璃 UI」一致，另加本插件自己的文字颜色。 */
function GlassRows() {
  const s = useSettings();
  return [
    h(GlassSyncRow, { key: 'sync' }),
    h(CheckRow, { key: 'ds', k: 'glassDarkSeparate' }),
    h(GlassColorRow, { key: 'gl', k: 'glassColorLight', label: s.glassDarkSeparate ? t('glassColorLight') : t('glassColor') }),
    s.glassDarkSeparate ? h(GlassColorRow, { key: 'gd', k: 'glassColorDark', label: t('glassColorDark') }) : null,
    h(RangeRow, { key: 'ga', k: 'glassAlpha', min: 0, max: 100, step: 5, unit: '%' }),
    h(RangeRow, { key: 'bl', k: 'blur', min: 0, max: 60, unit: 'px' }),
    h(RangeRow, { key: 'gf', k: 'glassFidelity', min: 0, max: 100, step: 5, unit: '%' }),
    h(ColorRow, { key: 'fg', k: 'textColor', fallback: '#1f2329' }),
  ];
}

/** DSH 设置窗口里「小说阅读」一页（settings.section 插槽）。 */
export function SettingsPage() {
  return h('div', { className: 'nr-settings-page', 'data-novel-reader': 'settings' }, h(SettingsView));
}

function SettingsView() {
  const s = useSettings();
  return h(
    'div',
    null,
    Group(
      'groupText',
      h(RangeRow, { key: 'fs', k: 'fontSize', min: 12, max: 30, unit: 'px' }),
      h(RangeRow, { key: 'lh', k: 'lineHeight', min: 1.2, max: 2.8, step: 0.1 }),
      h(RangeRow, { key: 'ps', k: 'paraSpacing', min: 0, max: 2, step: 0.1, unit: 'em' }),
      Row('fontFamily', h('select', { value: s.fontFamily, onChange: (e) => update('fontFamily', e.target.value) }, FONT_OPTIONS.map(([id, label]) => h('option', { key: id, value: id }, t(label))))),
      h(CheckRow, { key: 'in', k: 'indent' }),
    ),
    Group('groupGlass', ...GlassRows()),
    Group(
      'groupSheet',
      h(ColorRow, { key: 'sb', k: 'sheetBg', fallback: '#ffffff' }),
      h(RangeRow, { key: 'so', k: 'sheetOpacity', min: 40, max: 100, unit: '%' }),
    ),
    Group(
      'groupPeek',
      h(CheckRow, { key: 'pe', k: 'peekEnabled' }),
      h(DockAxisRow, { key: 'dr' }),
      h('p', { key: 'dh', className: 'nr-hint' }, t('peekDockHint')),
      h(SizeRow, { key: 'pw', k: 'peekWidth', min: 240, max: 1200 }),
      h(SizeRow, { key: 'ph', k: 'peekHeight', min: 80, max: 720 }),
      h(SizeRow, { key: 'pb', k: 'peekBottom', min: 0, max: 800, step: 1 }),
      h('p', { key: 'rh', className: 'nr-hint' }, t('peekResizeHint')),
      h(CheckRow, { key: 'rc', k: 'peekRightClickClose' }),
      h(RangeRow, { key: 'pf', k: 'peekFontSize', min: 11, max: 24, unit: 'px' }),
      h(CheckRow, { key: 'as', k: 'autoScroll' }),
      h(RangeRow, { key: 'sp', k: 'scrollSpeed', min: 4, max: 90, unit: 'px/s' }),
    ),
    Group('groupShortcut', h(BossKeyRow, { key: 'bk' }), h('p', { key: 'hint', className: 'nr-hint' }, t('bossKeyHint'))),
    h('div', { className: 'nr-row' }, h('button', { type: 'button', className: 'nr-btn nr-btn-outline', onClick: () => settingsStore.reset() }, t('reset'))),
  );
}
