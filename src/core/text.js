// TXT 解码与分章。纯函数，浏览器与 Node 测试共用。

const PREFACE_TITLE = '正文';
const CHUNK_CHARS = 4000;
const LONG_PARA_CHARS = 1200;

// 章节标题：第x章/节/回/卷…、序章楔子尾声番外、Chapter N。整行匹配且长度受限，避免误伤正文。
const HEADING_RE = /^(?:第\s*[0-9０-９零〇一二两三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+\s*[章节回卷集部篇幕](?:[\s:：、.．·—\-_].{0,40}|.{0,40})|(?:序章|序言|序|楔子|引子|引言|前言|尾声|后记|终章|番外)(?:[\s:：、.．·—\-_].{0,30}|[0-9一二三四五六七八九十]{1,4}.{0,30})?|chapter\s+[0-9ivxlc]+\b.{0,40}|卷[0-9零〇一二三四五六七八九十百]+.{0,30})$/i;

/**
 * 解码 txt 字节：BOM 优先，其次严格 UTF-8，失败回退 GB18030（覆盖 GBK/GB2312）。
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function decodeText(bytes) {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new TextDecoder('utf-8').decode(bytes.subarray(3));
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // not UTF-8
  }
  try {
    return new TextDecoder('gb18030').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

/** 去掉行首尾的半角/全角空白与 BOM。 */
export function cleanLine(line) {
  return line.replace(/^[\s　 ﻿]+|[\s　 ]+$/g, '');
}

export function isHeading(line) {
  return line.length <= 48 && HEADING_RE.test(line);
}

/** 过长的段落按句末标点切开，保证进度定位有足够粒度。 */
export function splitLongPara(para) {
  if (para.length <= LONG_PARA_CHARS) return [para];
  const out = [];
  let rest = para;
  while (rest.length > LONG_PARA_CHARS) {
    const window = rest.slice(0, LONG_PARA_CHARS);
    const cut = Math.max(window.lastIndexOf('。'), window.lastIndexOf('！'), window.lastIndexOf('？'), window.lastIndexOf('. '), window.lastIndexOf('”'));
    const at = cut > LONG_PARA_CHARS / 3 ? cut + 1 : LONG_PARA_CHARS;
    out.push(rest.slice(0, at));
    rest = rest.slice(at);
  }
  if (rest) out.push(rest);
  return out;
}

/** 没有可识别章节时，按字数把段落切成若干节。 */
export function chunkParas(paras) {
  const chapters = [];
  let cur = null;
  let size = 0;
  for (const para of paras) {
    if (cur === null || size >= CHUNK_CHARS) {
      cur = { title: `第 ${chapters.length + 1} 节`, paras: [] };
      chapters.push(cur);
      size = 0;
    }
    cur.paras.push(para);
    size += para.length;
  }
  return chapters;
}

/**
 * 把 txt 正文切成章节。
 * @param {string} text
 * @returns {{ title: string, paras: string[] }[]}
 */
export function splitTxt(text) {
  const chapters = [];
  let cur = null;
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = cleanLine(raw);
    if (!line || line.includes('\u0000')) continue;
    if (isHeading(line)) {
      cur = { title: line, paras: [] };
      chapters.push(cur);
      continue;
    }
    if (cur === null) {
      cur = { title: PREFACE_TITLE, paras: [] };
      chapters.push(cur);
    }
    for (const piece of splitLongPara(line)) cur.paras.push(piece);
  }
  const headed = chapters.filter((c) => c.title !== PREFACE_TITLE).length;
  if (headed < 2) return chunkParas(chapters.flatMap((c) => (c.title === PREFACE_TITLE ? c.paras : [c.title, ...c.paras])));
  return chapters.filter((c) => c.paras.length > 0 || c.title !== PREFACE_TITLE);
}
