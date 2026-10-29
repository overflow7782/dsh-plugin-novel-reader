// Node 半边：这个插件只有浏览器端，书和进度都存在 DSH 页面自己的 IndexedDB 里。
// 保留一个空插件行，让 DSH 加载 package.json 里声明的客户端（./client）。
export const name = 'novelReader';

export function apply() {}
