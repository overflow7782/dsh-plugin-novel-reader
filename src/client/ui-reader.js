// 阅读方式二：侧边栏阅读器（书架 / 目录 / 设置三张浮层）。
/* global React, h */
import { clearError, currentPercent, gotoChapter, nextChapter, openBook, percentOf, prevChapter, removeBook } from './state.js';
import { surfaceVars } from './settings.js';
import { t } from './i18n.js';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, GearIcon, ShelfIcon, TocIcon, TrashIcon } from './icons.js';
import { ChapterText, ImportZone, useChapterScroll, useInitReader, useReader, useSettings, useVisible } from './ui-shared.js';
import { SettingsView } from './ui-settings.js';

function IconButton({ icon, label, onClick, active, disabled }) {
  return h('button', { type: 'button', className: 'nr-btn', title: label, 'aria-label': label, 'aria-pressed': active ?? undefined, 'data-active': active || undefined, disabled, onClick }, h(icon, { size: 16 }));
}

function ErrorBox({ message }) {
  if (!message) return null;
  return h('div', { className: 'nr-error', role: 'alert', onClick: clearError }, message);
}

function formatSize(chars) {
  return chars >= 10000 ? `${Math.round(chars / 1000) / 10} 万字` : `${chars} 字`;
}

function BookRow({ row, current, onOpened }) {
  const [confirming, setConfirming] = React.useState(false);
  React.useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);
  const percent = percentOf(row);
  return h(
    'div',
    {
      className: 'nr-book',
      role: 'button',
      tabIndex: 0,
      'data-current': current || undefined,
      onClick: () => {
        void openBook(row.id).then(onOpened);
      },
      onKeyDown: (event) => {
        if (event.key === 'Enter') void openBook(row.id).then(onOpened);
      },
    },
    h(
      'div',
      { className: 'nr-book-main' },
      h('div', { className: 'nr-book-title', title: row.title }, row.title || '—'),
      h('div', { className: 'nr-book-meta nr-muted' }, [row.author, row.format.toUpperCase(), formatSize(row.chars), `${percent}%`].filter(Boolean).join(' · ')),
      h('div', { className: 'nr-bar' }, h('i', { style: { width: `${percent}%` } })),
    ),
    h(
      'button',
      {
        type: 'button',
        className: 'nr-btn',
        title: confirming ? t('confirmRemove') : t('remove'),
        'aria-label': confirming ? t('confirmRemove') : t('remove'),
        style: confirming ? { color: '#d93f0b' } : undefined,
        onClick: (event) => {
          event.stopPropagation();
          if (confirming) void removeBook(row.id);
          else setConfirming(true);
        },
      },
      confirming ? t('confirmRemove') : h(TrashIcon, { size: 15 }),
    ),
  );
}

function ShelfView({ onOpened }) {
  const reader = useReader();
  return h(
    'div',
    { className: 'nr-library' },
    h(ErrorBox, { message: reader.error }),
    h(ImportZone),
    reader.ready && reader.shelf.length === 0 ? h('div', { className: 'nr-muted', style: { textAlign: 'center', fontSize: 13, padding: 12 } }, t('emptyShelf')) : null,
    reader.shelf.map((row) => h(BookRow, { key: row.id, row, current: reader.book?.meta.id === row.id, onOpened })),
  );
}

function TocView({ onPick }) {
  const reader = useReader();
  const list = React.useRef(null);
  React.useLayoutEffect(() => {
    list.current?.querySelector('[data-current]')?.scrollIntoView({ block: 'center' });
  }, []);
  if (reader.book === null) return null;
  return h(
    'div',
    { ref: list },
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

function Sheet({ children }) {
  return h('div', { className: 'nr-sheet nr-sheet-solid' }, h('div', { className: 'nr-sheet-body' }, children));
}

function ReaderBody({ reader }) {
  const scroll = React.useRef(null);
  const visible = useVisible(scroll);
  const onScroll = useChapterScroll(scroll, reader, visible);
  const { book, progress } = reader;
  const chapter = book.chapters[progress.chapter];
  const isLast = progress.chapter >= book.chapters.length - 1;
  return h(
    'div',
    {
      ref: scroll,
      className: 'nr-scroll',
      tabIndex: 0,
      onScroll,
      onKeyDown: (event) => {
        if (event.key === 'ArrowLeft') prevChapter();
        else if (event.key === 'ArrowRight') nextChapter();
      },
    },
    h(ChapterText, { chapter }),
    h(
      'div',
      { className: 'nr-chapnav' },
      h('button', { type: 'button', className: 'nr-btn nr-btn-outline', disabled: progress.chapter === 0, onClick: prevChapter }, h(ChevronLeftIcon, { size: 14 }), t('prevChapter')),
      h('button', { type: 'button', className: 'nr-btn nr-btn-outline', disabled: isLast, onClick: nextChapter }, isLast ? t('lastChapter') : t('nextChapter'), isLast ? null : h(ChevronRightIcon, { size: 14 })),
    ),
  );
}

/** 侧边栏页签的完整阅读器。better-sidebar 与原生右侧栏挂的都是它。 */
export function ReaderSurface() {
  useInitReader();
  const reader = useReader();
  const settings = useSettings();
  const [sheet, setSheet] = React.useState(null);
  const toggle = (name) => setSheet((cur) => (cur === name ? null : name));
  const book = reader.book;
  const title = book !== null ? book.meta.title : t('shelf');
  return h(
    'div',
    // data-we-surface-preserve：告诉 wallpaper-engine 这一面自带毛玻璃，不要接管底色。
    { className: 'nr-surface nr-root', style: surfaceVars(settings, false), 'data-novel-reader': 'sidebar', 'data-we-surface-preserve': '' },
    h(
      'div',
      { className: 'nr-toolbar' },
      h('div', { className: 'nr-toolbar-title', title }, title),
      sheet !== null ? h(IconButton, { icon: CloseIcon, label: t('close'), onClick: () => setSheet(null) }) : null,
      h(IconButton, { icon: ShelfIcon, label: t('shelf'), active: sheet === 'shelf', onClick: () => toggle('shelf') }),
      h(IconButton, { icon: TocIcon, label: t('toc'), active: sheet === 'toc', disabled: book === null, onClick: () => toggle('toc') }),
      h(IconButton, { icon: GearIcon, label: t('settings'), active: sheet === 'settings', onClick: () => toggle('settings') }),
    ),
    book !== null
      ? h(ReaderBody, { reader })
      : h('div', { className: 'nr-scroll', style: { padding: 0 } }, reader.busy === 'open' ? h('div', { className: 'nr-library nr-muted' }, t('opening')) : h(ShelfView, { onOpened: () => setSheet(null) })),
    book !== null
      ? h(
          'div',
          { className: 'nr-footer nr-muted' },
          h('span', null, `${t('chapterOf', { n: reader.progress.chapter + 1, total: book.chapters.length })} · ${book.chapters[reader.progress.chapter].title}`),
          h('span', null, `${currentPercent()}%`),
        )
      : null,
    sheet === 'shelf' && book !== null
      ? h(Sheet, null, h(ShelfView, { onOpened: () => setSheet(null) }))
      : null,
    sheet === 'toc' && book !== null ? h(Sheet, null, h(TocView, { onPick: () => setSheet(null) })) : null,
    sheet === 'settings' ? h(Sheet, null, h(SettingsView)) : null,
  );
}
