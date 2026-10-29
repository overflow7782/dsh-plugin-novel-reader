// 设置窗口导航里本插件那一行的图标。
// DSH 的 settings.section 注册只认 id / order / label，导航图标对未知 id 一律画兜底齿轮；
// 和 better-sidebar、wallpaper-engine 一样，在设置弹层挂进 body 后按 label 找到那颗按钮，把齿轮换成书本。

const NAV_ICON_MARK = 'data-novel-reader-nav-icon';
const BOOK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 1 4 16z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16z"/></svg>';

/**
 * @param {() => string} label 本插件 settings.section 的当前文案
 * @returns 停止观察的函数
 */
export function installNavIcon(label) {
  if (typeof document === 'undefined' || document.body === null || typeof MutationObserver !== 'function') return () => {};
  const patch = (root) => {
    if (typeof root.querySelectorAll !== 'function') return;
    const want = label();
    for (const button of root.querySelectorAll('nav button')) {
      if ((button.textContent ?? '').trim() !== want) continue;
      const icon = button.firstElementChild;
      if (icon === null || button.childElementCount < 2 || icon.hasAttribute(NAV_ICON_MARK)) continue;
      const holder = document.createElement('div');
      holder.innerHTML = BOOK_SVG;
      const ours = holder.firstElementChild;
      // 直接换成 svg 并沿用原图标的 class，保持与宿主同一个盒模型（class 要用 getAttribute 取，SVG 的 className 不是字符串）。
      const cls = icon.getAttribute('class');
      if (cls) ours.setAttribute('class', cls);
      ours.setAttribute(NAV_ICON_MARK, '');
      button.replaceChild(ours, icon);
    }
  };
  patch(document.body);
  // 设置弹层是 body 的直接子节点，只观察一层 childList。
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) patch(node);
  });
  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}
