// EPUB 解析：container.xml → OPF（元数据 / manifest / spine）→ 目录（nav 或 NCX）→ 按 spine 读正文。
import { readZip } from './zip.js';
import { decodeEntities, htmlHeading, htmlToParas } from './html.js';

function xmlAttr(tag, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decodeEntities(m[1] ?? m[2]) : undefined;
}

function xmlText(xml, tag) {
  const m = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'i').exec(xml);
  return m ? decodeEntities(m[1].replace(/<[^>]*>/g, '')).trim() : '';
}

function dirOf(path) {
  const i = path.lastIndexOf('/');
  return i < 0 ? '' : path.slice(0, i + 1);
}

/** 以 base 所在目录解析相对路径，去掉 #fragment 与 ?query。 */
export function resolvePath(base, rel) {
  let href = rel.split('#')[0].split('?')[0];
  try {
    href = decodeURIComponent(href);
  } catch {
    // keep raw
  }
  const parts = (href.startsWith('/') ? href.slice(1) : dirOf(base) + href).split('/');
  const out = [];
  for (const part of parts) {
    if (part === '..') out.pop();
    else if (part !== '.' && part !== '') out.push(part);
  }
  return out.join('/');
}

function tocFromNav(html, navPath) {
  const nav = /<nav\b[^>]*(?:epub:)?type\s*=\s*["'][^"']*\btoc\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i.exec(html)?.[1] ?? html;
  const toc = [];
  for (const m of nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = xmlAttr(m[1], 'href');
    const label = decodeEntities(m[2].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    if (href && label) toc.push({ path: resolvePath(navPath, href), label });
  }
  return toc;
}

function tocFromNcx(xml, ncxPath) {
  const toc = [];
  for (const m of xml.matchAll(/<navLabel\b[^>]*>\s*<text\b[^>]*>([\s\S]*?)<\/text>[\s\S]*?<content\b([^>]*)\/?>/gi)) {
    const src = xmlAttr(m[2], 'src');
    const label = decodeEntities(m[1].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    if (src && label) toc.push({ path: resolvePath(ncxPath, src), label });
  }
  return toc;
}

/**
 * @param {Uint8Array} bytes
 * @returns {Promise<{ title: string, author: string, chapters: { title: string, paras: string[] }[] }>}
 */
export async function parseEpub(bytes) {
  const zip = readZip(bytes);
  const utf8 = new TextDecoder('utf-8');
  const readText = async (path) => {
    const read = zip.get(path);
    if (read === undefined) throw new Error(`epub 缺少文件：${path}`);
    return utf8.decode(await read());
  };

  const container = await readText('META-INF/container.xml');
  const rootTag = /<rootfile\b[^>]*>/i.exec(container)?.[0];
  const opfPath = rootTag ? xmlAttr(rootTag, 'full-path') : undefined;
  if (!opfPath) throw new Error('epub 缺少 OPF 声明');
  const opf = await readText(opfPath);

  const manifest = new Map();
  for (const m of opf.matchAll(/<(?:\w+:)?item\b[^>]*>/gi)) {
    const id = xmlAttr(m[0], 'id');
    const href = xmlAttr(m[0], 'href');
    if (id && href) manifest.set(id, { path: resolvePath(opfPath, href), type: xmlAttr(m[0], 'media-type') ?? '', props: xmlAttr(m[0], 'properties') ?? '' });
  }
  const spineTag = /<(?:\w+:)?spine\b[^>]*>/i.exec(opf)?.[0] ?? '';
  const spine = [...opf.matchAll(/<(?:\w+:)?itemref\b[^>]*>/gi)]
    .filter((m) => xmlAttr(m[0], 'linear') !== 'no')
    .map((m) => manifest.get(xmlAttr(m[0], 'idref') ?? ''))
    .filter((item) => item !== undefined && /html|xml/i.test(item.type || 'html'));

  let toc = [];
  const navItem = [...manifest.values()].find((item) => /\bnav\b/.test(item.props));
  const ncxItem = manifest.get(xmlAttr(spineTag, 'toc') ?? '') ?? [...manifest.values()].find((item) => item.type === 'application/x-dtbncx+xml');
  try {
    if (navItem) toc = tocFromNav(await readText(navItem.path), navItem.path);
    if (toc.length === 0 && ncxItem) toc = tocFromNcx(await readText(ncxItem.path), ncxItem.path);
  } catch {
    toc = [];
  }
  const labelOf = new Map();
  for (const entry of toc) if (!labelOf.has(entry.path)) labelOf.set(entry.path, entry.label);

  const chapters = [];
  for (const item of spine) {
    if (navItem && item.path === navItem.path) continue;
    let html;
    try {
      html = await readText(item.path);
    } catch {
      continue;
    }
    const paras = htmlToParas(html);
    if (paras.length === 0) continue;
    const label = labelOf.get(item.path);
    const prev = chapters[chapters.length - 1];
    if (label === undefined && labelOf.size > 0 && prev !== undefined) {
      prev.paras.push(...paras);
      continue;
    }
    const title = label ?? (htmlHeading(html) || `第 ${chapters.length + 1} 节`);
    if (paras[0] === title) paras.shift();
    chapters.push({ title, paras });
  }
  if (chapters.length === 0) throw new Error('epub 中没有可读的正文');
  return { title: xmlText(opf, 'title'), author: xmlText(opf, 'creator'), chapters };
}
