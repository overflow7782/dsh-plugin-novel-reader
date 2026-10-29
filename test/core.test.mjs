import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { decodeText, splitTxt, isHeading } from '../src/core/text.js';
import { htmlToParas, htmlHeading } from '../src/core/html.js';
import { parseEpub, resolvePath } from '../src/core/epub.js';
import { importBook } from '../src/core/book.js';

/** 写一个最小 zip：每个条目可选 store / deflate。 */
function makeZip(files) {
  const enc = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, text, deflate] of files) {
    const nameBytes = enc.encode(name);
    const raw = enc.encode(text);
    const data = deflate ? new Uint8Array(deflateRawSync(raw)) : raw;
    const method = deflate ? 8 : 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    locals.push(local, nameBytes, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const cdSize = centrals.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, ...centrals, eocd]));
}

const xhtml = (body) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title><style>p{}</style></head><body>${body}</body></html>`;

function sampleEpub({ withNav = true } = {}) {
  const files = [
    ['mimetype', 'application/epub+zip', false],
    ['META-INF/container.xml', '<container><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>', true],
    [
      'OEBPS/content.opf',
      `<package><metadata><dc:title>测试之书</dc:title><dc:creator>某作者</dc:creator></metadata><manifest>
        ${withNav ? '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>' : ''}
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="cover" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>
        <item id="c1" href="Text/ch%201.xhtml" media-type="application/xhtml+xml"/>
        <item id="c1b" href="Text/ch1b.xhtml" media-type="application/xhtml+xml"/>
        <item id="c2" href="Text/ch2.xhtml" media-type="application/xhtml+xml"/>
      </manifest><spine toc="ncx"><itemref idref="cover"/><itemref idref="c1"/><itemref idref="c1b"/><itemref idref="c2"/></spine></package>`,
      true,
    ],
    ['OEBPS/nav.xhtml', xhtml('<nav epub:type="toc"><ol><li><a href="Text/ch%201.xhtml">第一章 起点</a></li><li><a href="Text/ch2.xhtml#s">第二章 终点</a></li></ol></nav>'), true],
    ['OEBPS/toc.ncx', '<ncx><navMap><navPoint><navLabel><text>NCX 一</text></navLabel><content src="Text/ch%201.xhtml"/></navPoint><navPoint><navLabel><text>NCX 二</text></navLabel><content src="Text/ch2.xhtml"/></navPoint></navMap></ncx>', true],
    ['OEBPS/Text/cover.xhtml', xhtml('<div><img src="cover.jpg"/></div>'), false],
    ['OEBPS/Text/ch 1.xhtml', xhtml('<h1>第一章 起点</h1><p>　　第一段&amp;内容。</p><p>第二段<br/>换行</p>'), true],
    ['OEBPS/Text/ch1b.xhtml', xhtml('<p>续接的段落</p>'), true],
    ['OEBPS/Text/ch2.xhtml', xhtml('<h2>第二章</h2><p>结尾&#x3002;</p>'), true],
  ];
  return makeZip(files);
}

test('decodeText handles utf-8, BOM and gbk', () => {
  const utf8 = new TextEncoder().encode('你好，世界');
  assert.equal(decodeText(utf8), '你好，世界');
  assert.equal(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8])), '你好，世界');
  // “你好” in GBK
  assert.equal(decodeText(new Uint8Array([0xc4, 0xe3, 0xba, 0xc3])), '你好');
});

test('isHeading recognises common chapter titles but not prose', () => {
  for (const line of ['第一章 少年', '第12章', '第一百二十三回　大结局', '序章', '楔子', '番外一 春日', 'Chapter 7 The End', '第三卷 风起']) assert.ok(isHeading(line), line);
  for (const line of ['他说第一章写得不好，然后转身离开了房间，留下一脸茫然的众人。', '序列号是多少', '今天天气不错']) assert.ok(!isHeading(line), line);
});

test('splitTxt splits on headings and keeps the preface', () => {
  const chapters = splitTxt('书名\r\n作者：某某\r\n\r\n第一章 开始\r\n　　第一段。\r\n第二段。\r\n第二章 继续\r\n　　第三段。\n');
  assert.deepEqual(chapters.map((c) => c.title), ['正文', '第一章 开始', '第二章 继续']);
  assert.deepEqual(chapters[1].paras, ['第一段。', '第二段。']);
});

test('splitTxt falls back to fixed-size sections without headings', () => {
  const text = Array.from({ length: 30 }, (_, i) => `第${i}行`.padEnd(400, '字')).join('\n');
  const chapters = splitTxt(text);
  assert.ok(chapters.length >= 3);
  assert.equal(chapters[0].title, '第 1 节');
});

test('htmlToParas extracts paragraphs and decodes entities', () => {
  assert.deepEqual(htmlToParas(xhtml('<h1>标题</h1><p>　a &amp; b</p><div>c<br/>d</div><script>x()</script>')), ['标题', 'a & b', 'c', 'd']);
  assert.equal(htmlHeading('<h2 class="t">第三章&nbsp;夜</h2>'), '第三章 夜');
});

test('resolvePath normalises relative hrefs', () => {
  assert.equal(resolvePath('OEBPS/content.opf', 'Text/a%20b.xhtml#x'), 'OEBPS/Text/a b.xhtml');
  assert.equal(resolvePath('OEBPS/Text/nav.xhtml', '../Text/c.xhtml'), 'OEBPS/Text/c.xhtml');
});

test('parseEpub reads metadata, nav toc and merges untitled spine items', async () => {
  const book = await parseEpub(sampleEpub());
  assert.equal(book.title, '测试之书');
  assert.equal(book.author, '某作者');
  assert.deepEqual(book.chapters.map((c) => c.title), ['第一章 起点', '第二章 终点']);
  assert.deepEqual(book.chapters[0].paras, ['第一段&内容。', '第二段', '换行', '续接的段落']);
  assert.deepEqual(book.chapters[1].paras, ['第二章', '结尾。']);
});

test('parseEpub falls back to the NCX when there is no nav document', async () => {
  const book = await parseEpub(sampleEpub({ withNav: false }));
  assert.deepEqual(book.chapters.map((c) => c.title), ['NCX 一', 'NCX 二']);
});

test('importBook gives stable ids and parses file names', async () => {
  const bytes = new TextEncoder().encode('第一章 甲\n内容\n第二章 乙\n内容二');
  const a = await importBook('《长安》作者：某人.txt', bytes);
  const b = await importBook('copy.txt', bytes);
  assert.equal(a.id, b.id);
  assert.equal(a.title, '长安');
  assert.equal(a.author, '某人');
  assert.equal(a.chapters.length, 2);
  await assert.rejects(importBook('a.pdf', bytes), /不支持/);
});
