// 两种阅读面共用的 hooks 与小组件。React / h 由构建前言提供（宿主的 react）。
/* global React, h */
import { readerStore, importFiles, reportProgress, initReader } from './state.js';
import { settingsStore } from './settings.js';
import { t } from './i18n.js';
import { PlusIcon } from './icons.js';

export function useReader() {
  return React.useSyncExternalStore(readerStore.subscribe, readerStore.get);
}

export function useSettings() {
  return React.useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
}

export function useInitReader() {
  React.useEffect(() => {
    void initReader();
  }, []);
}

/**
 * 打开系统文件选择框。input 不挂在 React 树上：悬停窗在对话框弹出时会因鼠标移开而卸载，
 * 挂在树上的 input 会跟着丢掉 change 事件。
 */
export function pickFiles() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.epub';
  input.multiple = true;
  input.onchange = () => {
    if (input.files && input.files.length > 0) void importFiles(input.files);
  };
  input.click();
}

/** 元素是否在可视区（侧栏页签被切走、侧栏收起时为 false）。 */
export function useVisible(ref) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (el === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => setVisible(entries.some((entry) => entry.isIntersecting)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return visible;
}

function paraNodes(el) {
  return el.querySelectorAll('[data-i]');
}

function scrollToPara(el, para) {
  if (para <= 0) {
    el.scrollTop = 0;
    return;
  }
  const node = el.querySelector(`[data-i="${para}"]`);
  el.scrollTop = node === null ? el.scrollHeight : Math.max(0, node.offsetTop - 6);
}

/** 二分找视口顶部的第一个段落。 */
function topPara(el) {
  const nodes = paraNodes(el);
  if (nodes.length === 0) return 0;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) return nodes.length - 1;
  const top = el.scrollTop + 4;
  let lo = 0;
  let hi = nodes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const node = nodes[mid];
    if (node.offsetTop + node.offsetHeight > top) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * 章节滚动容器：显式跳转 / 换书 / 重新可见时定位到当前进度，滚动时回报进度。
 * @returns onScroll 处理函数
 */
export function useChapterScroll(ref, reader, visible) {
  const { book, progress, jump } = reader;
  React.useLayoutEffect(() => {
    if (!visible || book === null || ref.current === null) return;
    scrollToPara(ref.current, readerStore.get().progress.para);
  }, [book, jump, progress.chapter, visible]);
  const frame = React.useRef(0);
  return React.useCallback(() => {
    if (frame.current !== 0) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      const current = readerStore.get();
      if (el !== null && current.book !== null) reportProgress(current.progress.chapter, topPara(el));
    });
  }, []);
}

export const ChapterText = React.memo(function ChapterText({ chapter }) {
  return h(
    React.Fragment,
    null,
    h('h2', { className: 'nr-chapter-title' }, chapter.title),
    chapter.paras.map((para, i) => h('p', { key: i, className: 'nr-para', 'data-i': i }, para)),
  );
});

/** 点击或拖入导入。拖放会 stopPropagation，避免被 DSH 当成会话附件。 */
export function ImportZone() {
  const reader = useReader();
  const [over, setOver] = React.useState(false);
  const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return h(
    'div',
    {
      className: 'nr-drop nr-muted',
      role: 'button',
      tabIndex: 0,
      'data-over': over || undefined,
      onClick: pickFiles,
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') pickFiles();
      },
      onDragEnter: (event) => {
        stop(event);
        setOver(true);
      },
      onDragOver: stop,
      onDragLeave: (event) => {
        stop(event);
        setOver(false);
      },
      onDrop: (event) => {
        stop(event);
        setOver(false);
        if (event.dataTransfer?.files?.length) void importFiles(event.dataTransfer.files);
      },
    },
    h(PlusIcon, { size: 18 }),
    h('span', null, reader.busy === 'import' ? t('importing') : t('importHint')),
  );
}

/** 渲染出错时只吞掉本插件的那一块，不影响宿主界面。 */
export class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error('[novel-reader] render failed', error);
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
