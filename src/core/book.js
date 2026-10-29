// 导入入口：文件名 + 字节 → 统一的书籍对象。
import { decodeText, splitTxt } from './text.js';
import { parseEpub } from './epub.js';

export const SUPPORTED_EXTS = ['txt', 'epub'];

/** 取文件内容的指纹（首尾各 64KB + 长度），同一本书重复导入会得到同一个 id。 */
export function fingerprint(bytes) {
  let h = 0x811c9dc5;
  const feed = (from, to) => {
    for (let i = from; i < to; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193);
    }
  };
  const span = 65536;
  feed(0, Math.min(bytes.length, span));
  feed(Math.max(span, bytes.length - span), bytes.length);
  return `${(h >>> 0).toString(36)}${bytes.length.toString(36)}`;
}

function baseName(fileName) {
  return fileName.replace(/\.[^.]+$/, '').replace(/^.*[\\/]/, '');
}

/** 文件名里常见的「《书名》作者：xxx」写法。 */
function titleFromFileName(fileName) {
  const name = baseName(fileName);
  const quoted = /《([^》]+)》/.exec(name);
  const author = /作者[:：\s]*([^\s_\-.（）()]+)/.exec(name)?.[1] ?? '';
  return { title: quoted ? quoted[1] : name, author };
}

/**
 * @param {string} fileName
 * @param {Uint8Array} bytes
 */
export async function importBook(fileName, bytes) {
  const ext = fileName.toLowerCase().split('.').pop();
  let parsed;
  if (ext === 'epub') {
    parsed = await parseEpub(bytes);
    if (!parsed.title) parsed.title = titleFromFileName(fileName).title;
  } else if (ext === 'txt') {
    const named = titleFromFileName(fileName);
    parsed = { ...named, chapters: splitTxt(decodeText(bytes)) };
  } else {
    throw new Error(`不支持的格式：.${ext}（仅支持 txt / epub）`);
  }
  if (parsed.chapters.length === 0) throw new Error('文件里没有读到正文');
  let chars = 0;
  for (const chapter of parsed.chapters) for (const para of chapter.paras) chars += para.length;
  return {
    id: `b${fingerprint(bytes)}`,
    title: parsed.title,
    author: parsed.author,
    format: ext,
    size: bytes.length,
    chars,
    chapters: parsed.chapters,
  };
}
