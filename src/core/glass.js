// 毛玻璃配方：照搬 dsh-plugin-wallpaper-engine 的「全局玻璃」数学（侧栏玻璃跟随全局时右侧栏用的那一套），
// 同样的参数在两边得到同样的底色。纯函数，Node 测试可用。

/** 壁纸引擎的玻璃颜色预设（同序）。 */
export const GLASS_COLOR_PRESETS = ['#ffffff', '#0d1524', '#67dce7', '#dd8fac', '#f3b75f', '#f1717f'];

/** 可读性地板常量（浅 / 深），实际地板 = 常量 × 玻璃保真度。 */
export const READABILITY_FLOOR = { light: 0.45, dark: 0.59 };

/** 玻璃透明度（0–100，越大越透）→ 玻璃色份额。 */
export function glassAlphaOf(pct) {
  return Math.max(0.1, 0.25 - (pct / 100) * 0.15);
}

/**
 * 把玻璃色钳进可读亮度带（正文对比度 ≥ 4.6:1），再按保真度向原色线性回退。
 * 与壁纸引擎 weClampSurfaceColor 逐步一致。
 * @param {string} hex #rrggbb
 * @param {'light'|'dark'} theme
 * @param {number} fidelity 0–1
 */
export function clampSurfaceColor(hex, theme, fidelity = 1) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || ''));
  if (!m) return theme === 'dark' ? '#0d1524' : '#ffffff';
  const f = Number.isFinite(fidelity) ? Math.min(1, Math.max(0, fidelity)) : 1;
  const rgb = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const s2l = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]);
  const F = READABILITY_FLOOR[theme === 'dark' ? 'dark' : 'light'];
  const aMin = F + 0.1 * (theme === 'dark' ? 0.4 : 1) * (1 - F);
  const passes = (c) => {
    const comp = c.map((v) => v * aMin + (theme === 'dark' ? 255 : 0) * (1 - aMin));
    const contrast = theme === 'dark' ? 1.05 / (lum(comp) + 0.05) : (lum(comp) + 0.05) / 0.05;
    return contrast >= 4.6;
  };
  const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  let clamped = rgb;
  if (!passes(rgb)) {
    const target = theme === 'dark' ? [0, 0, 0] : [255, 255, 255];
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 12; i++) {
      const t = (lo + hi) / 2;
      if (passes(rgb.map((v, j) => v * (1 - t) + target[j] * t))) hi = t;
      else lo = t;
    }
    clamped = rgb.map((v, j) => v * (1 - hi) + target[j] * hi);
  }
  if (f >= 1) return toHex(clamped);
  return toHex(clamped.map((v, j) => v * f + rgb[j] * (1 - f)));
}
