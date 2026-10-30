// 阅读方式一：状态栏小图标，鼠标移入弹出毛玻璃速览窗，自动滚动阅读。
/* global React, h, createPortal */
import { currentPercent, gotoChapter, nextChapter, prevChapter } from './state.js';
import { settingsStore, surfaceVars } from './settings.js';
import { t } from './i18n.js';
import { BookIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, PauseIcon, PlayIcon } from './icons.js';
import { ChapterText, pickFiles, useChapterScroll, useInitReader, useReader, useSettings } from './ui-shared.js';
import { DOCK_RANK_AUTO, RESIZE_GRIPS, applyGrip, dockRankFor, placePeek } from '../core/peek-geom.js';
import { clearCellOrder, dockOf, itemOf, itemsOf, placeCell } from './dock-order.js';

/** 每个挂着的状态栏图标登记自己的收起函数（多窗口 / 多会话时可能不止一个）。 */
const peekHiders = new Set();

/** 收起所有速览窗。 */
export function hideAllPeeks() {
  for (const hide of peekHiders) hide();
}

const OPEN_DELAY_MS = 140;
const CLOSE_DELAY_MS = 260;
const WHEEL_PAUSE_MS = 1500;
const CHAPTER_END_WAIT_MS = 1500;

/** 速览窗贴着图标上方（间隔可调），水平居中并限制在窗口内。几何计算在 core/peek-geom.js。 */
function place(anchor, size) {
  return placePeek(anchor.getBoundingClientRect(), size, { width: window.innerWidth, height: window.innerHeight });
}

const sizeOf = (s) => ({ width: s.peekWidth, height: s.peekHeight, bottom: s.peekBottom });

function useResize(hold) {
  const [live, setLive] = React.useState(null);
  const start = (grip) => (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const base = settingsStore.get();
    hold(true);
    const from = { x: event.clientX, y: event.clientY, width: base.peekWidth, height: base.peekHeight, bottom: base.peekBottom };
    let size = null;
    const move = (ev) => {
      size = applyGrip(grip, from, ev.clientX - from.x, ev.clientY - from.y);
      setLive(size);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (size !== null) settingsStore.update({ peekWidth: size.width, peekHeight: size.height, peekBottom: size.bottom });
      setLive(null);
      hold(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  return [live, start];
}

function useAutoScroll(ref, enabled, speed, lastWheel) {
  React.useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = performance.now();
    // 自己记浮点位置：高分屏上 scrollTop 会被取整，逐像素累加可能原地踏步。
    let pos = -1;
    let endSince = 0;
    const tick = (now) => {
      const dt = Math.min(500, now - last);
      last = now;
      const el = ref.current;
      if (el !== null && now - lastWheel.current > WHEEL_PAUSE_MS) {
        if (pos < 0 || Math.abs(el.scrollTop - pos) > 2) pos = el.scrollTop;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          if (endSince === 0) endSince = now;
          else if (now - endSince > CHAPTER_END_WAIT_MS) {
            endSince = 0;
            pos = -1;
            nextChapter();
          }
        } else {
          endSince = 0;
          pos += (speed * dt) / 1000;
          el.scrollTop = pos;
        }
      } else {
        pos = -1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, speed]);
}

function isEditable(target) {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null;
}

/** 速览窗里的章节列表，打开时把当前章滚到中间。 */
function PeekToc({ reader, onPick }) {
  const list = React.useRef(null);
  React.useLayoutEffect(() => {
    list.current?.querySelector('[data-current]')?.scrollIntoView({ block: 'center' });
  }, []);
  return h(
    'div',
    { ref: list, className: 'nr-peek-toc' },
    reader.book.chapters.map((chapter, i) =>
      h(
        'button',
        {
          key: i,
          type: 'button',
          className: 'nr-toc-item',
          title: chapter.title,
          'data-current': i === reader.progress.chapter || undefined,
          onClick: () => {
            gotoChapter(i);
            onPick();
          },
        },
        chapter.title,
      ),
    ),
  );
}

function PeekPopover({ anchor, onEnter, onLeave, onHide, hold }) {
  const reader = useReader();
  const settings = useSettings();
  const scroll = React.useRef(null);
  const lastWheel = React.useRef(0);
  const [running, setRunning] = React.useState(settings.autoScroll);
  const [showToc, setShowToc] = React.useState(false);
  const [liveSize, startResize] = useResize(hold);
  const [, setWinTick] = React.useState(0);
  React.useEffect(() => {
    const update = () => setWinTick((v) => v + 1);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const pos = place(anchor, liveSize ?? sizeOf(settings));
  // 收起顶栏时正文独占整个窗口，目录也跟着收起来（顶栏没了就点不到目录按钮）。
  const headHidden = settings.peekHeadHidden;
  const tocOpen = showToc && !headHidden;
  const onScroll = useChapterScroll(scroll, reader, !tocOpen);
  useAutoScroll(scroll, running && !tocOpen && reader.book !== null, settings.scrollSpeed, lastWheel);

  // ←/→ 换章：鼠标停在速览窗上时总是生效；否则焦点在输入框里（正在打字）就不拦截。
  const hovered = React.useRef(false);
  // 收起顶栏后那个下箭头只在指针贴近窗口顶部时才露出来，不然一直挡着正文第一行。
  const [hot, setHot] = React.useState(false);
  React.useEffect(() => {
    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (!hovered.current && isEditable(event.target))) return;
      if (event.key === 'ArrowLeft' && prevChapter()) event.preventDefault();
      else if (event.key === 'ArrowRight' && nextChapter()) event.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const book = reader.book;
  const index = reader.progress.chapter;
  const chapter = book?.chapters[index];
  const headButton = (key, label, icon, onClick, disabled) =>
    h('button', { key, type: 'button', className: 'nr-btn', title: label, 'aria-label': label, disabled, onClick }, h(icon, { size: 13 }));
  return h(
    'div',
    {
      className: 'nr-surface nr-peek',
      role: 'dialog',
      'aria-label': t('dockLabel'),
      'data-novel-reader': 'peek',
      'data-we-surface-preserve': '',
      'data-nr-glass': settings.glassSync ? 'wallpaper' : undefined,
      'data-seamless': settings.peekSeamless || undefined,
      style: { ...surfaceVars(settings, true), left: pos.left, bottom: pos.bottom, width: pos.width, height: pos.height },
      onPointerMove: (event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setHot(event.clientY - box.top <= 22);
      },
      onMouseEnter: () => {
        hovered.current = true;
        onEnter();
      },
      onMouseLeave: () => {
        hovered.current = false;
        setHot(false);
        onLeave();
      },
      // 右键速览窗直接收起（设置里可关）；关掉时保留浏览器原生右键菜单。
      onContextMenu: (event) => {
        if (!settings.peekRightClickClose) return;
        event.preventDefault();
        onHide();
      },
    },
    RESIZE_GRIPS.map((grip) => h('div', { key: grip.edge, className: 'nr-peek-grip', 'data-edge': grip.edge, onPointerDown: startResize(grip) })),
    liveSize === null ? null : h('div', { key: 'size', className: 'nr-peek-size' }, `${pos.width} × ${pos.height} px`),
    book === null
      ? h(
          'div',
          { className: 'nr-peek-empty' },
          h('span', { className: 'nr-muted' }, reader.busy === 'import' ? t('importing') : t('noBookPeek')),
          h('button', { type: 'button', className: 'nr-btn nr-btn-outline', onClick: pickFiles }, t('importBook')),
        )
      : [
          h(
            'div',
            { key: 'head', className: 'nr-peek-head nr-muted', 'data-collapsed': headHidden || undefined, 'aria-hidden': headHidden || undefined },
            headButton('prev', t('prevChapter'), ChevronLeftIcon, () => {
              setShowToc(false);
              prevChapter();
            }, index === 0),
            h(
              'button',
              { key: 'title', type: 'button', className: 'nr-btn nr-peek-title', title: t('toc'), 'aria-expanded': showToc, 'data-active': showToc || undefined, onClick: () => setShowToc((v) => !v) },
              `${book.meta.title} · ${chapter.title}`,
            ),
            h('span', { key: 'pct', style: { flex: 'none', padding: '0 4px' } }, `${currentPercent()}%`),
            headButton('play', running ? t('pause') : t('resume'), running ? PauseIcon : PlayIcon, () => setRunning((v) => !v), showToc),
            headButton('next', t('nextChapter'), ChevronRightIcon, () => {
              setShowToc(false);
              nextChapter();
            }, index >= book.chapters.length - 1),
            headButton('hide', t('peekHeadHide'), ChevronUpIcon, () => settingsStore.update({ peekHeadHidden: true })),
          ),
          h(
            'button',
            {
              key: 'unhide',
              type: 'button',
              className: 'nr-peek-unhide',
              title: t('peekHeadShow'),
              'aria-label': t('peekHeadShow'),
              'aria-hidden': headHidden && hot ? undefined : 'true',
              'data-show': headHidden && hot ? '1' : undefined,
              onClick: () => settingsStore.update({ peekHeadHidden: false }),
            },
            h(ChevronDownIcon, { size: 12 }),
          ),
          tocOpen
            ? h(PeekToc, { key: 'toc', reader, onPick: () => setShowToc(false) })
            : h(
                'div',
                {
                  key: 'body',
                  ref: scroll,
                  className: 'nr-peek-body',
                  onScroll,
                  onWheel: () => {
                    lastWheel.current = performance.now();
                  },
                },
                h(ChapterText, { chapter }),
              ),
        ],
  );
}

/** 挂在 conversation.composer.dock 里的图标。点击可钉住速览窗，Esc 立即收起。 */
export function DockPeek() {
  useInitReader();
  const settings = useSettings();
  const hasBook = useReader().book !== null;
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const button = React.useRef(null);
  const timers = React.useRef({ open: 0, close: 0 });
  const pinnedRef = React.useRef(false);
  pinnedRef.current = pinned;
  // 拖动图标换位置：插到指针所在的那一格，旁边的格子跟着让位；刚拖完的那一次点击不再当成「钉住/收起」。
  const suppressClick = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);

  const clearTimers = () => {
    clearTimeout(timers.current.open);
    clearTimeout(timers.current.close);
  };
  const enter = () => {
    clearTimeout(timers.current.close);
    timers.current.open = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  };
  // 拖动缩放期间鼠标会离开窗口，暂停「移开即收起」。
  const holdRef = React.useRef(false);
  const hold = (on) => {
    holdRef.current = on;
    if (on) clearTimeout(timers.current.close);
  };
  const leave = () => {
    clearTimeout(timers.current.open);
    if (!pinnedRef.current && !holdRef.current) timers.current.close = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };
  const hide = () => {
    clearTimers();
    setPinned(false);
    setOpen(false);
  };
  // 按住图标左右拖动：越过谁的中线就插到谁那一边，松手写入设置（peekDockRank）。
  const beginDrag = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const el = button.current;
    const dock = dockOf(el);
    if (dock === null) return;
    const startX = event.clientX;
    let moved = false;
    let rank = -1;
    hold(true);
    const move = (ev) => {
      if (!moved && Math.abs(ev.clientX - startX) < 3) return;
      const items = itemsOf(dock);
      const cell = itemOf(el, items);
      if (cell === null) return;
      const others = items.filter((node) => node !== cell).map((node) => node.getBoundingClientRect());
      const next = dockRankFor(ev.clientX, others);
      if (next === rank) return;
      if (!moved) {
        moved = true;
        hide();
        setDragging(true);
      }
      rank = next;
      placeCell(items, cell, next, true);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (moved && rank >= 0) settingsStore.update({ peekDockRank: rank });
      suppressClick.current = moved;
      setDragging(false);
      hold(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  React.useEffect(() => clearTimers, []);
  // 图标站在设置里定的那一格；别人后来往 dock 里插了新控件就重新对位一次。
  React.useEffect(() => {
    if (!settings.peekEnabled) return;
    const dock = dockOf(button.current);
    if (dock === null) return;
    const auto = settings.peekDockRank === DOCK_RANK_AUTO;
    const sync = () => {
      const items = itemsOf(dock);
      if (auto) clearCellOrder(items);
      else placeCell(items, itemOf(button.current, items), settings.peekDockRank, false);
    };
    sync();
    if (auto) return;
    // 有人往 dock 里插了/撤了控件：立刻对一次位，下一帧再校一次（那时尺寸已经量准）。
    const observer = new MutationObserver(() => {
      sync();
      window.requestAnimationFrame(sync);
    });
    observer.observe(dock, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [settings.peekDockRank, settings.peekEnabled]);
  // 老板键：收起速览窗。
  React.useEffect(() => {
    peekHiders.add(hide);
    return () => peekHiders.delete(hide);
  }, []);
  // Esc 或点击速览窗、图标以外的任何地方都收起（包括已钉住的状态）。
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === 'Escape') hide();
    };
    const onPointer = (event) => {
      const target = event.target;
      if (target instanceof Node && button.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-novel-reader="peek"]') !== null) return;
      hide();
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [open]);

  if (!settings.peekEnabled) return null;
  return h(
    React.Fragment,
    null,
    h(
      'button',
      {
        ref: button,
        type: 'button',
        className: 'nr-dock-btn',
        'aria-label': t('dockLabel'),
        'aria-expanded': open,
        'data-open': open || undefined,
        'data-pinned': pinned || undefined,
        'data-dragging': dragging || undefined,
        'data-novel-reader': 'dock',
        onMouseEnter: enter,
        onMouseLeave: leave,
        onPointerDown: beginDrag,
        onContextMenu: (event) => {
          if (!open || !settings.peekRightClickClose) return;
          event.preventDefault();
          hide();
        },
        onClick: () => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (pinned) hide();
          else {
            clearTimers();
            setPinned(true);
            setOpen(true);
          }
        },
        style: { opacity: hasBook ? undefined : 0.7 },
      },
      h(BookIcon, { size: 15 }),
    ),
    open && button.current !== null ? createPortal(h(PeekPopover, { anchor: button.current, onEnter: enter, onLeave: leave, onHide: hide, hold }), document.body) : null,
  );
}
