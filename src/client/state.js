// 阅读状态：书架、当前书、进度。侧边栏和状态栏悬停窗共用一份，进度互通。
import { deleteBook, listShelf, loadChapters, patchShelf, saveBook } from './db.js';
import { importBook, SUPPORTED_EXTS } from '../core/book.js';

const CURRENT_KEY = 'dsh-plugin-novel-reader:current';
const PROGRESS_SAVE_MS = 800;

let state = {
  ready: false,
  shelf: [],
  /** 已加载的当前书：{ meta, chapters } */
  book: null,
  progress: { chapter: 0, para: 0 },
  /** 显式跳转（换章、目录跳转、打开书）时递增，阅读面据此重新定位；滚动产生的进度变化不递增。 */
  jump: 0,
  busy: '',
  error: '',
};
const listeners = new Set();

function set(patch) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export const readerStore = {
  get: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function rememberCurrent(id) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch {
    // ignore
  }
}

function ratioOf(book, progress) {
  const chapter = book.chapters[progress.chapter];
  const within = chapter && chapter.paras.length > 0 ? progress.para / chapter.paras.length : 0;
  return Math.min(1, (progress.chapter + within) / book.chapters.length);
}

let saveTimer = null;
export function flushProgress() {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = null;
  const { book, progress } = state;
  if (book === null) return;
  const entry = { progress: { ...progress, ratio: ratioOf(book, progress) }, lastReadAt: Date.now() };
  void patchShelf(book.meta.id, entry).catch(() => {});
  set({ shelf: state.shelf.map((row) => (row.id === book.meta.id ? { ...row, ...entry } : row)) });
}

function scheduleSave() {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushProgress, PROGRESS_SAVE_MS);
}

export async function initReader() {
  if (state.ready) return;
  try {
    const shelf = await listShelf();
    set({ ready: true, shelf });
    let current = null;
    try {
      current = localStorage.getItem(CURRENT_KEY);
    } catch {
      current = null;
    }
    if (current && shelf.some((row) => row.id === current)) await openBook(current);
  } catch (error) {
    set({ ready: true, error: String(error?.message ?? error) });
  }
}

export async function openBook(id) {
  if (state.book?.meta.id === id) return;
  flushProgress();
  const meta = state.shelf.find((row) => row.id === id);
  if (meta === undefined) return;
  set({ busy: 'open', error: '' });
  try {
    const stored = await loadChapters(id);
    if (stored === undefined) throw new Error('书的正文丢失了，请重新导入');
    const chapter = Math.min(meta.progress?.chapter ?? 0, stored.chapters.length - 1);
    const para = meta.progress?.para ?? 0;
    rememberCurrent(id);
    set({ book: { meta, chapters: stored.chapters }, progress: { chapter, para }, jump: state.jump + 1, busy: '' });
  } catch (error) {
    set({ busy: '', error: String(error?.message ?? error) });
  }
}

export function closeBook() {
  flushProgress();
  rememberCurrent(null);
  set({ book: null });
}

export async function removeBook(id) {
  if (state.book?.meta.id === id) closeBook();
  await deleteBook(id);
  set({ shelf: state.shelf.filter((row) => row.id !== id) });
}

/** 导入若干文件，打开最后一本成功导入的书。 */
export async function importFiles(files) {
  const list = [...files].filter((file) => SUPPORTED_EXTS.includes(file.name.toLowerCase().split('.').pop()));
  if (list.length === 0) {
    set({ error: '只支持 .txt 和 .epub 文件' });
    return;
  }
  set({ busy: 'import', error: '' });
  let lastId = null;
  const errors = [];
  for (const file of list) {
    try {
      const book = await importBook(file.name, new Uint8Array(await file.arrayBuffer()));
      const entry = await saveBook(book);
      set({ shelf: [entry, ...state.shelf.filter((row) => row.id !== entry.id)] });
      lastId = entry.id;
    } catch (error) {
      errors.push(`${file.name}：${error?.message ?? error}`);
    }
  }
  set({ busy: '', error: errors.join('\n') });
  if (lastId !== null) {
    if (state.book?.meta.id === lastId) set({ book: null });
    await openBook(lastId);
  }
}

/** 阅读面滚动时上报当前段落（不触发重新定位）。 */
export function reportProgress(chapter, para) {
  if (state.book === null) return;
  if (state.progress.chapter === chapter && state.progress.para === para) return;
  set({ progress: { chapter, para } });
  scheduleSave();
}

export function gotoChapter(index, para = 0) {
  const book = state.book;
  if (book === null || index < 0 || index >= book.chapters.length) return false;
  set({ progress: { chapter: index, para }, jump: state.jump + 1 });
  scheduleSave();
  return true;
}

export const nextChapter = () => gotoChapter(state.progress.chapter + 1);
export const prevChapter = () => gotoChapter(state.progress.chapter - 1);

export function clearError() {
  set({ error: '' });
}

export function percentOf(row) {
  return Math.round((row?.progress?.ratio ?? 0) * 1000) / 10;
}

export function currentPercent() {
  return state.book === null ? 0 : Math.round(ratioOf(state.book, state.progress) * 1000) / 10;
}
