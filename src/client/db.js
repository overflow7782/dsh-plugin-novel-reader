// 书库存储：IndexedDB（DSH 桌面版页面源固定为 dsh-app://app，重启后仍在）。
// shelf 存元数据和进度，books 存正文；没有 IndexedDB 时退化成内存。

const DB_NAME = 'dsh-novel-reader';
const DB_VERSION = 1;

let dbPromise = null;
const memory = { shelf: new Map(), books: new Map() };

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise === null) {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('shelf')) db.createObjectStore('shelf', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'id' });
    };
    dbPromise = request(req).catch((error) => {
      console.warn('[novel-reader] IndexedDB 不可用，书库只保存在内存里', error);
      return null;
    });
  }
  return dbPromise;
}

async function tx(storeNames, mode, run) {
  const db = await openDb();
  if (db === null) return run(null);
  const t = db.transaction(storeNames, mode);
  const done = new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
  const result = await run(t);
  await done;
  return result;
}

/** @returns {Promise<object[]>} 按最近阅读排序的书架 */
export async function listShelf() {
  const rows = await tx(['shelf'], 'readonly', (t) => (t === null ? [...memory.shelf.values()] : request(t.objectStore('shelf').getAll())));
  return rows.sort((a, b) => (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt));
}

/** 写入一本书，返回书架条目。重复导入保留原进度。 */
export async function saveBook(book) {
  const { chapters, ...meta } = book;
  return tx(['shelf', 'books'], 'readwrite', async (t) => {
    const prev = t === null ? memory.shelf.get(book.id) : await request(t.objectStore('shelf').get(book.id));
    const entry = {
      ...meta,
      chapterCount: chapters.length,
      addedAt: prev?.addedAt ?? Date.now(),
      lastReadAt: Date.now(),
      progress: prev?.progress ?? { chapter: 0, para: 0, frac: 0, ratio: 0 },
    };
    if (t === null) {
      memory.shelf.set(book.id, entry);
      memory.books.set(book.id, { id: book.id, chapters });
    } else {
      t.objectStore('shelf').put(entry);
      t.objectStore('books').put({ id: book.id, chapters });
    }
    return entry;
  });
}

/** @returns {Promise<{ id: string, chapters: { title: string, paras: string[] }[] } | undefined>} */
export function loadChapters(id) {
  return tx(['books'], 'readonly', (t) => (t === null ? memory.books.get(id) : request(t.objectStore('books').get(id))));
}

export function patchShelf(id, patch) {
  return tx(['shelf'], 'readwrite', async (t) => {
    const prev = t === null ? memory.shelf.get(id) : await request(t.objectStore('shelf').get(id));
    if (prev === undefined) return;
    const next = { ...prev, ...patch };
    if (t === null) memory.shelf.set(id, next);
    else t.objectStore('shelf').put(next);
  });
}

export function deleteBook(id) {
  return tx(['shelf', 'books'], 'readwrite', (t) => {
    if (t === null) {
      memory.shelf.delete(id);
      memory.books.delete(id);
      return;
    }
    t.objectStore('shelf').delete(id);
    t.objectStore('books').delete(id);
  });
}
