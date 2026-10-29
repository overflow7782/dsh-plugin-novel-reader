// 最小 ZIP 读取器（epub 用）：只读中央目录，支持 store / deflate，解压走浏览器原生 DecompressionStream。

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

async function inflateRaw(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * @param {Uint8Array} bytes
 * @returns {Map<string, () => Promise<Uint8Array>>} 路径 → 读取函数
 */
export function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('不是有效的 zip/epub 文件');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const utf8 = new TextDecoder('utf-8');
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== SIG_CENTRAL) throw new Error('zip 目录损坏');
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = utf8.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue;
    entries.set(name, async () => {
      if (view.getUint32(localOffset, true) !== SIG_LOCAL) throw new Error(`zip 条目损坏：${name}`);
      const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const data = bytes.subarray(start, start + compSize);
      if (method === 0) return data;
      if (method === 8) return inflateRaw(data);
      throw new Error(`不支持的压缩方式 ${method}：${name}`);
    });
  }
  return entries;
}
