// XHTML → 段落文本。正则实现，不依赖 DOMParser，Node 测试里也能跑。

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·', copy: '©' };
const BLOCK_TAGS = 'p|div|h[1-6]|li|blockquote|tr|section|article|header|footer|aside|pre|dd|dt|figcaption|table|ul|ol';

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

function inlineText(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/[\s　 ]+/g, ' ').trim();
}

/** 读取第一个 h1–h3 作为候选章节标题。 */
export function htmlHeading(html) {
  const m = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/i.exec(html);
  if (!m) return '';
  const text = inlineText(m[2]);
  return text.length <= 60 ? text : '';
}

/** @returns {string[]} */
export function htmlToParas(html) {
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  const text = body
    .replace(/<(script|style|head|svg)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<rt\b[\s\S]*?<\/rt>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<[^>]*>/g, '');
  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/^[\s　 ]+|[\s　 ]+$/g, '').replace(/[ \t]+/g, ' '))
    .filter(Boolean);
}
