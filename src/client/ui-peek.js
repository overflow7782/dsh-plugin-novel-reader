// 阅读方式一：状态栏小图标，鼠标移入弹出毛玻璃速览窗，自动滚动阅读。
/* global React, h, createPortal */
import { currentPercent, gotoChapter, nextChapter, prevChapter } from './state.js';
import { settingsStore, surfaceVars } from './settings.js';
import { t } from './i18n.js';
import { BookIcon, ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from './icons.js';
import { ChapterText, pickFiles, useChapterScroll, useInitReader, useReader, useSettings } from './ui-shared.js';

const OPEN_DELAY_MS = 140;
const CLOSE_DELAY_MS = 260;
const WHEEL_PAUSE_MS = 1500;
const CHAPTER_END_WAIT_MS = 1500;

/** 速览窗贴着图标上方，水平居中并限制在窗口内。 */
function place(anchor, settings) {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(settings.peekWidth, window.innerWidth - 16);
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
  const height = Math.max(80, Math.min(settings.peekHeight, rect.top - 16));
  return { left, width, height, bottom: window.innerHeight - rect.top + 8 };
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

function PeekPopover({ anchor, onEnter, onLeave }) {
  const reader = useReader();
  const settings = useSettings();
  const scroll = React.useRef(null);
  const lastWheel = React.useRef(0);
  const [running, setRunning] = React.useState(settings.autoScroll);
  const [showToc, setShowToc] = React.useState(false);
  const [pos, setPos] = React.useState(() => place(anchor, settings));
  React.useLayoutEffect(() => {
    const update = () => setPos(place(anchor, settingsStore.get()));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [anchor, settings.peekWidth, settings.peekHeight]);
  const onScroll = useChapterScroll(scroll, reader, !showToc);
  useAutoScroll(scroll, running && !showToc && reader.book !== null, settings.scrollSpeed, lastWheel);

  // ←/→ 换章：鼠标停在速览窗上时总是生效；否则焦点在输入框里（正在打字）就不拦截。
  const hovered = React.useRef(false);
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
      style: { ...surfaceVars(settings, true), left: pos.left, bottom: pos.bottom, width: pos.width, height: pos.height },
      onMouseEnter: () => {
        hovered.current = true;
        onEnter();
      },
      onMouseLeave: () => {
        hovered.current = false;
        onLeave();
      },
    },
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
            { key: 'head', className: 'nr-peek-head nr-muted' },
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
          ),
          showToc
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

  const clearTimers = () => {
    clearTimeout(timers.current.open);
    clearTimeout(timers.current.close);
  };
  const enter = () => {
    clearTimeout(timers.current.close);
    timers.current.open = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  };
  const leave = () => {
    clearTimeout(timers.current.open);
    if (!pinnedRef.current) timers.current.close = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };
  const hide = () => {
    clearTimers();
    setPinned(false);
    setOpen(false);
  };

  React.useEffect(() => clearTimers, []);
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
        'data-novel-reader': 'dock',
        onMouseEnter: enter,
        onMouseLeave: leave,
        onClick: () => {
          if (pinned) hide();
          else {
            clearTimers();
            setPinned(true);
            setOpen(true);
          }
        },
        style: hasBook ? undefined : { opacity: 0.7 },
      },
      h(BookIcon, { size: 15 }),
    ),
    open && button.current !== null ? createPortal(h(PeekPopover, { anchor: button.current, onEnter: enter, onLeave: leave }), document.body) : null,
  );
}
