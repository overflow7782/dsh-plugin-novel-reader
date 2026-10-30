// 样式：只用 nr- 前缀的类名，颜色走 DSH 的 --dsw-* 令牌（带回退），阅读面的配色由 surfaceVars 写入的 --nr-* 变量控制。

const STYLE_ID = 'dsh-plugin-novel-reader';

const CSS = `
/* 玻璃底色 = 壁纸引擎右侧栏（跟随全局）的配方：
   可读性地板（钳制后的玻璃色 × 地板常量×保真度）叠 玻璃色×玻璃份额，加白釉渐变、内高光；
   模糊 + 饱和度 1.3 + 亮度 1.04。深色主题换地板常量、釉层，并把玻璃份额乘 0.65。 */
.nr-surface{box-sizing:border-box;color:var(--nr-fg);font-family:var(--nr-font);--nr-floor:calc(0.45 * var(--nr-fidelity,1));--nr-base:var(--nr-tint-light,#ffffff);--nr-share:calc(var(--nr-glass-alpha,0.22) * 100%);--nr-sheen-a:0.10;--nr-sheen-b:0.03;--nr-sheen-c:0.05;background-color:color-mix(in srgb,var(--nr-base) calc(var(--nr-floor) * 100%),color-mix(in srgb,var(--nr-base) var(--nr-share),transparent) calc((1 - var(--nr-floor)) * 100%));background-image:linear-gradient(180deg,rgba(255,255,255,var(--nr-sheen-a)),rgba(255,255,255,var(--nr-sheen-b)) 38%,rgba(255,255,255,var(--nr-sheen-c)));-webkit-backdrop-filter:blur(var(--nr-blur)) saturate(1.3) brightness(1.04) contrast(1.01);backdrop-filter:blur(var(--nr-blur)) saturate(1.3) brightness(1.04) contrast(1.01)}
[data-ds-dark-theme] .nr-surface{--nr-floor:calc(0.59 * var(--nr-fidelity,1));--nr-base:var(--nr-tint-dark,#0d1524);--nr-share:calc(var(--nr-glass-alpha,0.22) * 65%);--nr-sheen-a:0.07;--nr-sheen-b:0.02;--nr-sheen-c:0.03}
.nr-root{box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(255,255,255,.08),inset 0 0 0 .5px rgba(255,255,255,.06)}
.nr-surface *,.nr-surface *::before,.nr-surface *::after{box-sizing:border-box}
.nr-muted{color:color-mix(in srgb,var(--nr-fg) 58%,transparent)}
.nr-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:28px;min-width:28px;padding:0 8px;border:none;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.nr-btn:hover:not(:disabled){background:color-mix(in srgb,var(--nr-fg) 10%,transparent)}
.nr-btn:disabled{opacity:.4;cursor:default}
.nr-btn[data-active]{background:color-mix(in srgb,var(--nr-fg) 14%,transparent)}
.nr-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:-2px}
.nr-btn-outline{border:.5px solid color-mix(in srgb,var(--nr-fg) 28%,transparent)}

.nr-root{position:relative;display:flex;flex-direction:column;width:100%;height:100%;min-height:0;overflow:hidden}
.nr-toolbar{flex:none;display:flex;align-items:center;gap:2px;height:40px;padding:0 6px 0 12px;border-bottom:.5px solid color-mix(in srgb,var(--nr-fg) 12%,transparent)}
.nr-toolbar-title{flex:1;min-width:0;font-size:13px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.nr-scroll{position:relative;flex:1;min-height:0;overflow-y:auto;padding:14px 22px 28px;scrollbar-width:thin}
.nr-chapter-title{margin:6px 0 18px;font-size:calc(var(--nr-size) * 1.25);font-weight:600;line-height:1.5;text-align:center}
.nr-para{margin:0 0 var(--nr-gap);font-size:var(--nr-size);line-height:var(--nr-lh);text-indent:var(--nr-indent);text-align:justify;overflow-wrap:anywhere}
.nr-chapnav{display:flex;justify-content:space-between;gap:8px;margin-top:22px}
.nr-footer{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;height:28px;padding:0 14px;font-size:12px;border-top:.5px solid color-mix(in srgb,var(--nr-fg) 10%,transparent)}
.nr-footer span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}

.nr-sheet{position:absolute;inset:40px 0 0;display:flex;flex-direction:column;z-index:2;-webkit-backdrop-filter:blur(calc(var(--nr-blur) + 8px)) saturate(1.4);backdrop-filter:blur(calc(var(--nr-blur) + 8px)) saturate(1.4);animation:nr-fade .14s ease-out}
/* 书架/目录浮层：默认用固定的实色（不走 --dsw-alias-bg-*，壁纸引擎会把那组令牌改成半透明玻璃，文字就会和底下正文叠在一起）。 */
.nr-sheet-solid{--nr-fg:var(--nr-sheet-fg,#1f2329);color:var(--nr-fg);background:var(--nr-sheet-bg,color-mix(in srgb,#ffffff var(--nr-sheet-op,96%),transparent))}
[data-ds-dark-theme] .nr-sheet-solid{--nr-fg:var(--nr-sheet-fg,#e8e9ec);background:var(--nr-sheet-bg,color-mix(in srgb,#1c1d21 var(--nr-sheet-op,96%),transparent))}
.nr-sheet-body{flex:1;min-height:0;overflow-y:auto;padding:8px 10px 20px;scrollbar-width:thin}
@keyframes nr-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

.nr-toc-item{display:block;width:100%;padding:7px 10px;border:none;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;line-height:1.4;text-align:left;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.nr-toc-item:hover{background:color-mix(in srgb,currentColor 9%,transparent)}
.nr-toc-item[data-current]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d6bfe) 16%,transparent);font-weight:600}

.nr-library{display:flex;flex-direction:column;gap:10px;padding:14px}
.nr-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:92px;padding:14px;border:1px dashed color-mix(in srgb,var(--nr-fg) 30%,transparent);border-radius:12px;font-size:13px;text-align:center;cursor:pointer;transition:background .12s,border-color .12s}
.nr-drop:hover,.nr-drop[data-over]{background:color-mix(in srgb,var(--nr-fg) 6%,transparent);border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}
.nr-book{display:flex;align-items:center;gap:10px;padding:10px 8px 10px 12px;border-radius:10px;border:.5px solid color-mix(in srgb,var(--nr-fg) 12%,transparent);background:color-mix(in srgb,var(--nr-fg) 3%,transparent);cursor:pointer}
.nr-book:hover{background:color-mix(in srgb,var(--nr-fg) 8%,transparent)}
.nr-book[data-current]{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d6bfe) 60%,transparent)}
.nr-book-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.nr-book-title{font-size:14px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.nr-book-meta{font-size:12px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.nr-bar{height:3px;border-radius:2px;background:color-mix(in srgb,var(--nr-fg) 12%,transparent);overflow:hidden}
.nr-bar>i{display:block;height:100%;background:var(--dsw-alias-state-business-primary,#4d6bfe)}
.nr-error{white-space:pre-wrap;padding:8px 10px;border-radius:8px;font-size:12px;background:rgba(217,63,11,.12);color:#d93f0b}

.nr-group{margin:6px 4px 14px}
.nr-group-title{margin:0 6px 6px;font-size:12px;font-weight:600;opacity:.62}
.nr-row{display:flex;align-items:center;gap:10px;min-height:34px;padding:2px 6px;font-size:13px}
.nr-row>label{flex:none;width:96px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nr-row>.nr-ctl{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.nr-row input[type=range]{flex:1;min-width:0;accent-color:var(--dsw-alias-state-business-primary,#4d6bfe)}
.nr-row input[type=checkbox]{accent-color:var(--dsw-alias-state-business-primary,#4d6bfe);width:15px;height:15px}
.nr-row select{flex:1;height:28px;padding:0 6px;border-radius:8px;border:.5px solid color-mix(in srgb,currentColor 25%,transparent);background:transparent;color:inherit;font:inherit;font-size:13px}
.nr-row select option{color:#1f2329;background:#fff}
.nr-row input[type=color]{width:28px;height:24px;padding:0;border:.5px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:6px;background:transparent;cursor:pointer}
.nr-val{flex:none;width:44px;text-align:right;font-variant-numeric:tabular-nums;opacity:.7;font-size:12px}
.nr-swatches{display:flex;flex-wrap:wrap;gap:6px}
.nr-swatch{width:30px;height:30px;padding:0;border-radius:8px;border:.5px solid color-mix(in srgb,currentColor 25%,transparent);cursor:pointer;font-size:13px;font-weight:600;display:grid;place-items:center}
.nr-swatch[data-active]{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:1px}

.nr-dock-btn{display:inline-grid;place-items:center;width:24px;height:24px;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary,#8a8f98);cursor:pointer;flex:none}
.nr-dock-btn:hover,.nr-dock-btn[data-open]{color:var(--dsw-alias-label-secondary,#5c6068);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.nr-dock-btn[data-pinned]{color:var(--dsw-alias-state-business-primary,#4d6bfe)}
.nr-dock-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:-2px}

/* 圆角跟随 DSH 输入框那张卡片：它用的是 --dsw-radius-panel（当前 28px），主题换了这边也自动跟着换。 */
.nr-peek{position:fixed;z-index:1000;display:flex;flex-direction:column;border-radius:var(--dsw-radius-panel,12px);border:.5px solid color-mix(in srgb,var(--nr-fg) 18%,transparent);box-shadow:0 10px 32px rgba(0,0,0,.18),0 1px 3px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.32),inset 0 0 0 .5px rgba(255,255,255,.06);overflow:hidden;animation:nr-fade .12s ease-out}
/* 右边留 20px：右上角的缩放手柄是 16px，别和「下一章」挤在一起。
   收起时高度归零、正文顺势长上来，所以高度也要能过渡。 */
/* 伪装输入框模式：底色和模糊都直接借输入框那张卡片的，边框、内嵌高光、投影全去掉。
   输入卡的底色是 --dsw-specific-input-major（壁纸引擎在 body[data-we-glass-page] 上把它改写成
   「可读性底 + 釉色」的 color-mix，所以这块天然带同样的可读性下限，字不会被背后的内容咬）；
   输入卡的模糊则由 [data-composer-card]::before 承载，配方与这里逐字相同（同一批 --we-* 变量）。
   选 .nr-peek.nr-surface 是为了压过 [data-nr-glass=wallpaper] / [data-ds-dark-theme] 那两组同权重的规则。
   边框只改颜色不改宽度，尺寸和缩放手柄的计算都不用跟着变。 */
.nr-peek.nr-surface[data-seamless]{background-color:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1,#fff));background-image:none;-webkit-backdrop-filter:blur(var(--we-blur,var(--nr-blur,16px))) saturate(var(--we-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);backdrop-filter:blur(var(--we-blur,var(--nr-blur,16px))) saturate(var(--we-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);border-color:transparent;box-shadow:none}
.nr-peek-head{flex:none;display:flex;align-items:center;gap:2px;height:28px;padding:0 20px 0 10px;font-size:11px;overflow:hidden;visibility:visible;transition:height .18s cubic-bezier(.32,.72,0,1),opacity .14s ease,padding .18s ease,visibility 0s}
.nr-peek-head[data-collapsed]{height:0;padding:0;opacity:0;pointer-events:none;visibility:hidden;transition:height .18s cubic-bezier(.32,.72,0,1),opacity .14s ease,padding .18s ease,visibility 0s linear .18s}
/* 顶栏收起后，指针贴近窗口顶部才露出来的小箭头，用来把顶栏叫回来。 */
.nr-peek-unhide{position:absolute;top:0;left:50%;transform:translateX(-50%);z-index:4;display:flex;align-items:center;justify-content:center;width:36px;height:13px;padding:0;border:none;border-radius:0 0 8px 8px;background:color-mix(in srgb,var(--nr-fg) 14%,transparent);color:inherit;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .14s ease}
.nr-peek-unhide[data-show]{opacity:.92;pointer-events:auto}
.nr-peek-body{position:relative;flex:1;min-height:0;overflow-y:auto;padding:2px 14px 10px;scrollbar-width:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 10px,#000 calc(100% - 14px),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 10px,#000 calc(100% - 14px),transparent 100%)}
.nr-peek-body::-webkit-scrollbar{display:none}
.nr-peek-body .nr-chapter-title{margin:4px 0 10px;font-size:calc(var(--nr-size) * 1.1)}
.nr-peek-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:100%;padding:12px;font-size:13px;text-align:center}
.nr-surface[data-nr-glass=wallpaper]{--nr-we-floor:var(--we-readability-floor,0);--nr-we-tint:var(--we-sidebar-tint,30%);background-color:color-mix(in srgb,var(--we-readability-base,var(--dsw-alias-bg-layer-1,#fff)) calc(var(--nr-we-floor) * 100%),color-mix(in srgb,var(--we-sidebar-color,#fff) var(--nr-we-tint),transparent) calc((1 - var(--nr-we-floor)) * 100%));background-image:linear-gradient(180deg,rgba(255,255,255,var(--we-sidebar-sheen-a,0)),rgba(255,255,255,var(--we-sidebar-sheen-b,0)) 38%,rgba(255,255,255,var(--we-sidebar-sheen-c,0)));-webkit-backdrop-filter:blur(var(--we-sidebar-blur,20px)) saturate(var(--we-sidebar-saturate,1.4)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);backdrop-filter:blur(var(--we-sidebar-blur,20px)) saturate(var(--we-sidebar-saturate,1.4)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01)}
body[data-ds-dark-theme] .nr-surface[data-nr-glass=wallpaper]{--nr-we-tint:calc(var(--we-sidebar-tint,30%) * 0.65)}
.nr-root.nr-surface[data-nr-glass=wallpaper]{box-shadow:none;background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none}
.nr-peek-head .nr-btn{height:22px;min-width:22px;padding:0 4px;border-radius:6px;font-size:11px}
.nr-peek-head .nr-peek-title{flex:1;min-width:0;justify-content:flex-start;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.nr-peek-toc{flex:1;min-height:0;overflow-y:auto;padding:0 8px 8px;scrollbar-width:thin}
.nr-settings-page{--nr-fg:var(--dsw-alias-label-primary,#1f2329);display:flex;flex-direction:column;gap:12px;color:var(--nr-fg);font-family:var(--dsw-font-family,inherit)}
.nr-settings-page .nr-group{margin:0;padding:12px 10px 8px;border-radius:12px;border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.25));background:var(--dsw-alias-bg-layer-1,transparent)}
.nr-settings-page .nr-row>label{width:120px}
.nr-settings-page>.nr-row{padding:0}
.nr-settings-page input[type=checkbox]{appearance:none;-webkit-appearance:none;position:relative;width:36px;height:20px;margin:0 0 0 auto;border-radius:999px;background:color-mix(in srgb,currentColor 22%,transparent);cursor:pointer;transition:background .15s}
.nr-settings-page input[type=checkbox]::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
.nr-settings-page input[type=checkbox]:checked{background:var(--dsw-alias-state-business-primary,#4d6bfe)}
.nr-settings-page input[type=checkbox]:checked::after{transform:translateX(16px)}
.nr-kbd{min-width:110px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}
.nr-num{width:64px;height:26px;padding:0 6px;border-radius:6px;border:.5px solid color-mix(in srgb,currentColor 25%,transparent);background:transparent;color:inherit;font:inherit;font-size:12px;font-variant-numeric:tabular-nums}
.nr-unit{flex:none;font-size:12px;opacity:.6}
.nr-hint{margin:0 6px 6px;font-size:12px;line-height:1.5;opacity:.62}
.nr-row .nr-hint{margin:0}
.nr-peek-grip{position:absolute;z-index:3;touch-action:none}
.nr-peek-grip[data-edge=top]{top:0;left:16px;right:16px;height:6px;cursor:ns-resize}
.nr-peek-grip[data-edge=bottom]{bottom:0;left:16px;right:16px;height:6px;cursor:ns-resize}
.nr-peek-grip[data-edge=left]{left:0;top:16px;bottom:16px;width:6px;cursor:ew-resize}
.nr-peek-grip[data-edge=right]{right:0;top:16px;bottom:16px;width:6px;cursor:ew-resize}
.nr-peek-grip[data-edge=top-left]{top:0;left:0;width:16px;height:16px;cursor:nwse-resize}
.nr-peek-grip[data-edge=top-right]{top:0;right:0;width:16px;height:16px;cursor:nesw-resize}
.nr-peek-grip[data-edge=bottom-left]{bottom:0;left:0;width:16px;height:16px;cursor:nesw-resize}
.nr-peek-grip[data-edge=bottom-right]{bottom:0;right:0;width:16px;height:16px;cursor:nwse-resize}
/* 缩放时浮窗中央的实时像素读数。 */
.nr-peek-size{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;padding:4px 10px;border-radius:999px;font-size:12px;line-height:1.4;font-variant-numeric:tabular-nums;pointer-events:none;background:rgba(18,20,24,.82);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.28)}
.nr-dock-btn{cursor:grab;transition:transform .12s ease}
.nr-dock-btn[data-dragging]{cursor:grabbing;transform:scale(1.18)}
.nr-swatches{align-items:center}
.nr-choices{display:flex;flex-wrap:wrap;gap:4px}
.nr-choices .nr-btn{height:24px;min-width:0;padding:0 9px;font-size:12px}
/* 「图标位置」的流程轴：一条滑杆 + 下面每一格的圆点，右边是「回归原位」。 */
.nr-axis{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}
.nr-axis input[type=range]{width:100%;margin:0}
.nr-ticks{display:flex;justify-content:space-between;padding:0 8px}
.nr-tick{width:6px;height:6px;padding:0;border:none;border-radius:50%;background:color-mix(in srgb,currentColor 24%,transparent);cursor:pointer;transition:transform .12s ease,background .12s ease}
.nr-tick:hover{transform:scale(1.6)}
.nr-tick[data-active]{background:var(--dsw-alias-state-business-primary,#4d6bfe)}
.nr-row .nr-ctl>button.nr-btn{flex:none;height:26px;padding:0 10px;font-size:12px}
.nr-swatch-round{width:24px;height:24px;border-radius:50%;border:.5px solid color-mix(in srgb,currentColor 30%,transparent)}
.nr-swatch-custom{position:relative;display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px 0 2px;border-radius:999px;font-size:12px;cursor:pointer;opacity:.85}
.nr-swatch-custom[data-active]{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:1px;opacity:1}
.nr-swatch-custom input[type=color]{width:20px;height:20px;border-radius:50%;padding:0;border:.5px solid color-mix(in srgb,currentColor 30%,transparent);overflow:hidden}
.nr-swatch-custom input[type=color]::-webkit-color-swatch-wrapper{padding:0}
.nr-swatch-custom input[type=color]::-webkit-color-swatch{border:none;border-radius:50%}
.nr-sync{display:flex;flex-direction:column;gap:6px;margin:0 6px 8px;padding:10px;border-radius:10px;font-size:12px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d6bfe) 10%,transparent)}
.nr-sync .nr-btn{align-self:flex-start}

`;

/** 注入样式，返回移除函数。 */
export function installStyles() {
  if (typeof document === 'undefined') return () => {};
  let tag = document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`);
  if (tag === null) {
    tag = document.createElement('style');
    tag.dataset.plugin = STYLE_ID;
    tag.dataset.pluginCss = STYLE_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = CSS;
  return () => tag.remove();
}
