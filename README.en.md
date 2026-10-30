<div align="center">

[简体中文](https://github.com/overflow7782/dsh-plugin-novel-reader/blob/master/README.md) · [**English**](https://github.com/overflow7782/dsh-plugin-novel-reader/blob/master/README.en.md)

# 📖 Novel Reader

A DeepSeek Harness plugin · read novels in the status bar

[![npm](https://img.shields.io/npm/v/dsh-plugin-novel-reader?style=flat-square&logo=npm&label=npm&color=4d6bfe)](https://www.npmjs.com/package/dsh-plugin-novel-reader)
[![downloads](https://img.shields.io/npm/dm/dsh-plugin-novel-reader?style=flat-square&label=downloads&color=4d6bfe)](https://www.npmjs.com/package/dsh-plugin-novel-reader)
[![DSH](https://img.shields.io/badge/DSH-0.2.1%2B-4d6bfe?style=flat-square)](https://github.com/deepseek-ai/DeepSeek-Harness)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-4d6bfe?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![License](https://img.shields.io/badge/License-MIT-4d6bfe?style=flat-square)](LICENSE)

</div>

---

## What it does

| Feature | Details |
|---|---|
| **Peek from the status bar** | A small book icon joins the row under the composer (`12 turns 88 steps … 41%`). Hover it for a frosted peek window, move away to dismiss, click to pin |
| **Move it anywhere** | Drag the icon left or right and it drops into another slot, with the controls beside it sliding over smoothly. Settings also has an axis to pick the slot, plus a reset button |
| **Resize it** | All four edges and four corners resize the peek window, with a live pixel readout. Dragging the bottom edge changes the gap above the icon |
| **Full reader in the sidebar** | A "Novels" tab in the right sidebar with a bookshelf and table of contents, arrow keys to change chapters |
| **Boss key** | `Shift+F1` by default — hides the peek window and closes the sidebar tab; you can record your own |
| **Formats** | `txt` (UTF-8 / GBK / GB18030 / UTF-16, split on chapter headings, falling back to length) · `epub` (nav first, then NCX) |
| **Appearance** | Font size, line and paragraph spacing, typeface, first-line indent, text color; separate colors for the shelf and TOC overlays; the glass uses the same scale and formula as `dsh-plugin-wallpaper-engine`, and can sync to it in one click |

Both views share the same book and the same reading position.

## Install

Requires **DSH 0.2.1+** and **Node.js 22+**.

```bash
dsh plugin --profile desktop add dsh-plugin-novel-reader
```

Use `web` instead of `desktop` for the web host. Restart DSH afterwards, or press `Ctrl+Shift+R`.

You can also grab `dsh-plugin-novel-reader.tgz` from [Releases](https://github.com/overflow7782/dsh-plugin-novel-reader/releases) and install it directly.

Uninstall:

```bash
dsh plugin --profile desktop remove dsh-plugin-novel-reader
```

## Usage

1. Open the right sidebar, click "Novels", then pick or drag in `txt` / `epub` files
2. Hover the book icon in the status bar to peek; click it to pin
3. Settings → **Novel Reader** to tune fonts, colors, glass, and the peek window's size and position

## Compatibility

| Plugin | Behavior |
|---|---|
| `dsh-better-sidebar` | Registers the "Novels" tab through its `registerTab` when present; otherwise uses DSH's native right sidebar, so you never get two entries |
| `dsh-plugin-wallpaper-engine` | Leaves its surface colors alone; when detected you can sync its glass in one click and follow its settings live |

The status bar icon lives in the official `conversation.composer.dock` slot, next to the built-in activity and usage pills. Other plugins that add controls to that row can be swapped with it too.

## Data and privacy

Book text, the shelf and reading progress live in the page's IndexedDB (database `dsh-novel-reader`); appearance settings live in localStorage. The plugin makes no network requests. Data survives uninstalling — remove books from the shelf to clear it.

## License

[MIT](LICENSE)
