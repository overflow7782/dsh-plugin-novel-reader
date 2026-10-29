// 外观设置面板。
/* global h */
import { settingsStore, THEME_PRESETS, wallpaperGlassActive } from './settings.js';
import { t } from './i18n.js';
import { useSettings } from './ui-shared.js';

const FONT_OPTIONS = [
  ['system', 'fontSystem'],
  ['song', 'fontSong'],
  ['kai', 'fontKai'],
  ['hei', 'fontHei'],
  ['fangsong', 'fontFangsong'],
];
const PRESET_LABELS = { auto: 'presetAuto', paper: 'presetPaper', green: 'presetGreen', parchment: 'presetParchment', night: 'presetNight', ink: 'presetInk' };

const update = (key, value) => settingsStore.update({ [key]: value });

function Row(label, control) {
  return h('div', { className: 'nr-row' }, h('label', null, t(label)), h('div', { className: 'nr-ctl' }, control));
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

function ColorRow({ k, fallback }) {
  const value = useSettings()[k];
  return Row(k, [
    h('input', { key: 'c', type: 'color', value: value || fallback, 'aria-label': t(k), onChange: (e) => update(k, e.target.value) }),
    h('button', { key: 'b', type: 'button', className: 'nr-btn nr-btn-outline', 'data-active': value === '' || undefined, onClick: () => update(k, '') }, t('followTheme')),
  ]);
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
    Group(
      'groupSurface',
      h(GlassSyncRow, { key: 'sync' }),
      Row(
        'theme',
        h(
          'div',
          { className: 'nr-swatches' },
          THEME_PRESETS.map((preset) =>
            h(
              'button',
              {
                key: preset.id,
                type: 'button',
                className: 'nr-swatch',
                title: t(PRESET_LABELS[preset.id]),
                'aria-label': t(PRESET_LABELS[preset.id]),
                'data-active': (s.bgColor === preset.bg && s.textColor === preset.fg) || undefined,
                style: { background: preset.bg || 'var(--dsw-alias-bg-layer-1, #fff)', color: preset.fg || 'var(--dsw-alias-label-primary, #1f2329)' },
                onClick: () => settingsStore.update({ bgColor: preset.bg, textColor: preset.fg }),
              },
              '文',
            ),
          ),
        ),
      ),
      h(ColorRow, { key: 'bg', k: 'bgColor', fallback: '#ffffff' }),
      h(ColorRow, { key: 'fg', k: 'textColor', fallback: '#1f2329' }),
      h(RangeRow, { key: 'op', k: 'bgOpacity', min: 0, max: 100, unit: '%' }),
      h(RangeRow, { key: 'bl', k: 'blur', min: 0, max: 40, unit: 'px' }),
    ),
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
