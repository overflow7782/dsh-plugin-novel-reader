// DSH 设置窗口里「小说阅读」一页。玻璃一组与壁纸引擎「玻璃 UI」同名、同刻度、同配方。
/* global h */
import { settingsStore, wallpaperGlassActive } from './settings.js';
import { GLASS_COLOR_PRESETS } from '../core/glass.js';
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
      h(RangeRow, { key: 'pw', k: 'peekWidth', min: 260, max: 760, step: 10, unit: 'px' }),
      h(RangeRow, { key: 'ph', k: 'peekHeight', min: 90, max: 480, step: 10, unit: 'px' }),
      h(RangeRow, { key: 'pf', k: 'peekFontSize', min: 11, max: 24, unit: 'px' }),
      h(CheckRow, { key: 'as', k: 'autoScroll' }),
      h(RangeRow, { key: 'sp', k: 'scrollSpeed', min: 4, max: 90, unit: 'px/s' }),
    ),
    h('div', { className: 'nr-row' }, h('button', { type: 'button', className: 'nr-btn nr-btn-outline', onClick: () => settingsStore.reset() }, t('reset'))),
  );
}
