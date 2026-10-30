<div align="center">

[**简体中文**](https://github.com/overflow7782/dsh-plugin-novel-reader/blob/master/README.md) · [English](https://github.com/overflow7782/dsh-plugin-novel-reader/blob/master/README.en.md)

# 📖 摸鱼小说阅读器

DeepSeek Harness 插件 · 在状态栏里偷偷看小说

[![npm](https://img.shields.io/npm/v/dsh-plugin-novel-reader?style=flat-square&logo=npm&label=npm&color=4d6bfe)](https://www.npmjs.com/package/dsh-plugin-novel-reader)
[![下载量](https://img.shields.io/npm/dm/dsh-plugin-novel-reader?style=flat-square&label=downloads&color=4d6bfe)](https://www.npmjs.com/package/dsh-plugin-novel-reader)
[![DSH](https://img.shields.io/badge/DSH-0.2.1%2B-4d6bfe?style=flat-square)](https://github.com/deepseek-ai/DeepSeek-Harness)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-4d6bfe?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![License](https://img.shields.io/badge/License-MIT-4d6bfe?style=flat-square)](LICENSE)

</div>

---

## 它能做什么

| 功能 | 说明 |
|---|---|
| **状态栏速览** | 输入框下面那排（`dock`）多一个书本图标，鼠标移上去弹出毛玻璃速览窗，移开就收起，点一下可以钉住 |
| **位置随手挪** | 按住图标左右拖动，它插到状态栏的另一格，旁边的控件平滑让位；设置里还有一条轴可以指定位置。 |
| **大小随手改** | 速览窗四边四角都能拖，拖动时显示实时像素尺寸；底边上下拖就是改与图标之间的间距 |
| **侧边栏阅读** | 右侧栏「小说」页签是完整阅读器，带书架和目录，`←` `→` 翻章 |
| **老板键** | 默认 `Shift+F1`，一下收起速览窗并关掉侧边栏的「小说」页签；右键速览窗只是收起速览窗。 |
| **收起顶栏** | 默认 `Shift+F2`，或点速览窗右上角那个小箭头，顶部那一排按钮收起、正文占满整个窗口；鼠标移到窗口顶部的小横条就能叫回来。设置里也有开关 |
| **格式** | `txt`（UTF-8 / GBK / GB18030 / UTF-16，按「第 x 章」等分章，识别不到就按字数切）· `epub`（目录优先 nav，其次 NCX） |
| **外观** | 字号、行距、段距、字体、首行缩进、文字颜色；书架和目录浮层可单独设色；毛玻璃与 `dsh-plugin-wallpaper-engine` 同刻度同配方，也可以一键同步 |
| **伪装输入框模式** | 速览窗改用输入框那张卡片的底色与模糊，边框和投影全去掉，看起来就是输入框延伸出来的一块 |

## 安装

需要 **DSH 0.2.1+** 和 **Node.js 22+**。

```bash
dsh plugin --profile desktop add dsh-plugin-novel-reader
```

网页宿主把 `desktop` 换成 `web`。装完重启 DSH，或按 `Ctrl+Shift+R` 强制刷新。

也可以从 [Releases](https://github.com/overflow7782/dsh-plugin-novel-reader/releases) 下载 `dsh-plugin-novel-reader.tgz` 直接安装。

卸载：

```bash
dsh plugin --profile desktop remove dsh-plugin-novel-reader
```

## 使用

1. 打开右侧栏，点「小说」，把 `txt` / `epub` 点进来或直接拖进书架
2. 鼠标移到状态栏的书本图标上，浮出速览窗；点图标可以钉住
3. 设置 → **小说阅读**，调字号、颜色、玻璃、速览窗大小位置和快捷键

## 兼容性

| 插件 | 说明 |
|---|---|
| `dsh-better-sidebar` | 装了之后会用它的 `registerTab` 注册「小说」页签，没装会走 DSH 原生右侧栏。 |
| `dsh-plugin-wallpaper-engine` | 检测到它时可以「一键同步毛玻璃」，之后跟着它实时变化 |

状态栏图标挂在官方的 `conversation.composer.dock` 插槽上，和自带的活动、用量胶囊同一排。往这一排插东西的其他插件也能一起换位。

## 计划中

计划中的功能，欢迎提意见。

| 功能 | 说明 |
|---|---|
| **在线书源导入** | 导入书源规则（订阅地址或 JSON），配自己的源，也能导出分享给别人 |
| **在线书源搜索** | 按书名或作者跨源搜，点一下进书架，章节按需拉取并缓存 |
| **整本离线缓存** | 整本预下载到 IndexedDB，网卡、断网也能翻 |
| **书签与笔记** | 位置书签、划线、几句随感，能导出成 Markdown |
| **书内全文搜索** | 在一本书里搜关键词，点结果直接跳到那一段 |
| **朗读** | 用浏览器 TTS 读当前段落，配合自动滚动跟着走 |
| **epub 插图** | 把 epub 里内嵌的图片渲染出来 |
| **阅读统计** | 今天读了多少字、连了几天，摆进设置页 |

## 数据与隐私

书的正文、书架和阅读进度存在本机页面的 IndexedDB（库名 `dsh-novel-reader`），外观设置存在 localStorage。插件不访问网络。卸载插件后数据还在，要在书架里逐本删。

## 许可

[MIT](LICENSE)
