// 样式：只用 nr- 前缀的类名，颜色走 DSH 的 --dsw-* 令牌（带回退），阅读面的配色由 surfaceVars 写入的 --nr-* 变量控制。

const STYLE_ID = 'dsh-plugin-novel-reader';

const CSS = `
.nr-surface{box-sizing:border-box;color:var(--nr-fg);background:var(--nr-bg);-webkit-backdrop-filter:blur(var(--nr-blur)) saturate(1.4);backdrop-filter:blur(var(--nr-blur)) saturate(1.4);font-family:var(--nr-font)}
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

.nr-sheet{position:absolute;inset:40px 0 0;display:flex;flex-direction:column;z-index:2;background:var(--nr-bg);-webkit-backdrop-filter:blur(calc(var(--nr-blur) + 8px)) saturate(1.4);backdrop-filter:blur(calc(var(--nr-blur) + 8px)) saturate(1.4);animation:nr-fade .14s ease-out}
.nr-sheet-solid{--nr-fg:var(--dsw-alias-label-primary,#1f2329);color:var(--nr-fg);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 94%,transparent)}
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

.nr-peek{position:fixed;z-index:1000;display:flex;flex-direction:column;border-radius:12px;border:.5px solid color-mix(in srgb,var(--nr-fg) 18%,transparent);box-shadow:0 10px 32px rgba(0,0,0,.18),0 1px 3px rgba(0,0,0,.08);overflow:hidden;animation:nr-fade .12s ease-out}
.nr-peek-head{flex:none;display:flex;align-items:center;gap:2px;height:28px;padding:0 6px 0 8px;font-size:11px}
.nr-peek-body{position:relative;flex:1;min-height:0;overflow-y:auto;padding:2px 14px 10px;scrollbar-width:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 10px,#000 calc(100% - 14px),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 10px,#000 calc(100% - 14px),transparent 100%)}
.nr-peek-body::-webkit-scrollbar{display:none}
.nr-peek-body .nr-chapter-title{margin:4px 0 10px;font-size:calc(var(--nr-size) * 1.1)}
.nr-peek-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:100%;padding:12px;font-size:13px;text-align:center}
.nr-surface[data-nr-glass=wallpaper]{--nr-we-floor:var(--we-readability-floor,0);--nr-we-tint:var(--we-sidebar-tint,30%);background-color:color-mix(in srgb,var(--we-readability-base,var(--dsw-alias-bg-layer-1,#fff)) calc(var(--nr-we-floor) * 100%),color-mix(in srgb,var(--we-sidebar-color,#fff) var(--nr-we-tint),transparent) calc((1 - var(--nr-we-floor)) * 100%));background-image:linear-gradient(180deg,rgba(255,255,255,var(--we-sidebar-sheen-a,0)),rgba(255,255,255,var(--we-sidebar-sheen-b,0)) 38%,rgba(255,255,255,var(--we-sidebar-sheen-c,0)));-webkit-backdrop-filter:blur(var(--we-sidebar-blur,20px)) saturate(var(--we-sidebar-saturate,1.4)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);backdrop-filter:blur(var(--we-sidebar-blur,20px)) saturate(var(--we-sidebar-saturate,1.4)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01)}
body[data-ds-dark-theme] .nr-surface[data-nr-glass=wallpaper]{--nr-we-tint:calc(var(--we-sidebar-tint,30%) * 0.65)}
.nr-root.nr-surface[data-nr-glass=wallpaper]{background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none}
.nr-peek-head .nr-btn{height:22px;min-width:22px;padding:0 4px;border-radius:6px;font-size:11px}
.nr-peek-head .nr-peek-title{flex:1;min-width:0;justify-content:flex-start;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.nr-peek-toc{flex:1;min-height:0;overflow-y:auto;padding:0 8px 8px;scrollbar-width:thin}
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
