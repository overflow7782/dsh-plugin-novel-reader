# dsh-plugin-novel-reader · 摸鱼小说阅读器

DeepSeek Harness（DSH）插件：在 DSH 里看 txt / epub 小说。

- **状态栏速览**：输入框下方状态栏（`8 轮 287 步 … 40%` 那一行）多一个书本小图标。鼠标移入弹出毛玻璃速览窗，移开就收起；点一下图标可以钉住，按 `Esc` 立刻收起。
  - 顶栏：`‹` 上一章 · 点章节名展开目录 · 进度 · `▷` 开始/暂停自动滚动 · `›` 下一章。鼠标停在速览窗上时 `←` / `→` 也能换章。
  - 默认不自动滚动（设置里可改成「打开即滚动」）。自动滚动时用滚轮手动翻会暂停 1.5 秒，滚到章末自动进入下一章。
- **侧边栏阅读**：右侧栏「开始」页里多一个「小说」入口，打开是完整阅读器，带书架和目录。左右方向键可以切换章节。
- **设置**：在 DSH 设置窗口左侧的「小说阅读」里（账号菜单 → 设置，或 Ctrl+Alt+,）。
- 两种方式共用同一本书和同一份进度。
- **导入**：txt（自动识别 UTF-8 / GBK / GB18030 / UTF-16，按「第 x 章 / 回 / 卷」、序章、楔子、番外等分章，识别不到章节时按约 4000 字分节）和 epub（目录优先取 nav，其次 NCX）。可以点击选择文件，也可以把文件拖进书架。
- **外观**：字号、行距、段距、字体、首行缩进；书架和目录浮层单独的背景颜色与不透明度（默认按深浅主题用实色，不透出正文）；6 套配色（跟随主题 / 纸白 / 护眼绿 / 羊皮纸 / 夜间 / 墨蓝），也能自定义文字和背景颜色；背景不透明度、毛玻璃模糊；速览窗的宽度、高度、字号、自动滚动速度。

## 兼容性

| 插件 | 处理方式 |
|---|---|
| `dsh-better-sidebar` | 装了它就用 `ctx.betterSidebar.registerTab` 注册「小说」页签（它会再同步到原生右侧栏）；没装就直接注册到 DSH 原生右侧栏（`sidebarRightTabs` + `sidebar.right.pane.tab` 插槽）。两边用同一个 kind（`novel-reader`），不会出现两个入口。 |
| `dsh-plugin-wallpaper-engine` | 阅读面和速览窗都带 `data-we-surface-preserve`，让壁纸引擎不接管它们的底色，默认用插件自己的毛玻璃。速览窗挂在 `document.body` 下，不调整其他插件的层级。<br>**一键同步**：检测到壁纸引擎时，DSH 设置 → 小说阅读 → 背景里会出现「一键同步壁纸引擎毛玻璃」。开启后侧边栏阅读器变透明，直接透出壁纸引擎给右侧栏画的玻璃；速览窗套用它右侧栏玻璃的同一套配方（模糊、饱和度、亮度、染色、可读性底色、高光，深色主题同样处理），读的是它实时写在 `body` 上的 `--we-*` 变量，所以壁纸引擎里改参数会立刻跟着变。之后再调背景颜色、不透明度或模糊，会自动退出同步。 |

状态栏图标挂在官方的 `conversation.composer.dock` 插槽上（和 DSH 自带的活动、用量胶囊同一排，在上下文百分比前面）。

## 安装（本地开发版）

需要 DSH 0.2.1 及以上。在 DSH 自带的终端里执行（profile 名按自己的改，桌面版默认是 `desktop`）：

```bash
dsh plugin --profile desktop add link:D:/dsh-plugin-novel-reader
```

`link:` 是软链接，之后改完代码执行 `npm run build`，再在 DSH 里刷新就能生效。装好后重启 DSH，或用 Ctrl+Shift+R 强制刷新。

卸载：

```bash
dsh plugin --profile desktop remove dsh-plugin-novel-reader
```

## 数据存放

书的正文、书架和阅读进度存在 DSH 页面的 IndexedDB 里（库名 `dsh-novel-reader`），外观设置存在 localStorage。所有数据都只在本机，不访问网络。卸载插件后数据还在；要清空，在书架里逐本删除即可。

## 开发

```
src/core/      解析（纯函数，node --test 可测）：txt 解码分章、zip 读取、epub 解析
src/client/    浏览器端：存储、状态、样式、React 组件、apply 入口
lib/client.js  构建产物（tools/build.mjs 拼接生成，不要手改）
lib/index.js   Node 端空插件行
tools/dev.html 本地预览用的假宿主（模拟插槽、状态栏、右侧栏）
```

```bash
npm run build     # 生成 lib/client.js
npm test          # 解析器测试
npm run check     # 构建 + 语法检查 + 测试
node tools/serve.mjs   # 打开 http://localhost:5179/tools/dev.html 预览
```

构建不需要任何依赖：源码是 ES 模块，构建时按顺序拼进 DSH 的 `__ModuleLoader__` 包装，`react` / `react-dom` 由宿主提供。

## 一期范围外

在线书源、按 epub 目录里的锚点细分同一文件内的多个章节、图片与插图、书签、全文搜索。
