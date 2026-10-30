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
| **Peek from the status bar** | The row under the composer (`dock`) gets a book icon. Hover it for a frosted peek window, move away to dismiss, click to pin |
| **Move it anywhere** | Hold the icon and drag left or right — it drops into another slot of that row and the controls beside it slide over smoothly. Settings also has an axis to pick the slot |
| **Resize it** | All four edges and four corners of the peek window resize it, with a live pixel readout; dragging the bottom edge changes the gap above the icon |
| **Reader in the sidebar** | The "Novels" tab in the right sidebar is a full reader with a shelf and table of contents, `←` `→` to change chapters |
| **Boss key** | `Shift+F1` by default, or right-click — dismisses the peek window and closes the "Novels" sidebar tab |
| **Formats** | `txt` (UTF-8 / GBK / GB18030 / UTF-16, split on chapter headings, falling back to length) · `epub` (nav first, then NCX) |
| **Appearance** | Font size, line and paragraph spacing, typeface, first-line indent, text color; separate colors for the shelf and TOC overlays; the glass uses the same scale and formula as `dsh-plugin-wallpaper-engine` and can sync to it in one click |

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
2. Hover the book icon in the status bar for the peek window; click it to pin
3. Settings → **Novel Reader** to tune fonts, colors, glass, and the peek window's size, position and shortcut

## Compatibility

| Plugin | Details |
|---|---|
| `dsh-better-sidebar` | When installed it registers the "Novels" tab through its `registerTab`; otherwise the plugin uses DSH's native right sidebar |
| `dsh-plugin-wallpaper-engine` | When detected you can sync its glass in one click, and it keeps following along live |

The status bar icon lives in the official `conversation.composer.dock` slot, next to the built-in activity and usage pills. Other plugins that add controls to that row can be reordered with it.

## Planned

None of this is implemented yet — listed for visibility, suggestions welcome.

| Feature | Details |
|---|---|
| **Online book sources** | Import source rules (subscription URL or JSON), keep your own set, export them to share |
| **Search across sources** | Search by title or author, add a hit to the shelf, pull chapters on demand and cache them |
| **Offline cache** | Pre-download whole books into IndexedDB so they read fine on a bad or dead connection |
| **Bookmarks and notes** | Position bookmarks, highlights, short notes, exportable as Markdown |
| **In-book search** | Full-text search inside a book, jump straight to a hit |
| **Text to speech** | Read the current paragraph aloud, following along with the auto-scroll |
| **epub images** | Render the illustrations embedded in an epub |
| **Reading stats** | Words read today, streak, shown in settings |

## Data and privacy

Book text, the shelf and reading progress live in the page's IndexedDB (database `dsh-novel-reader`); appearance settings live in localStorage. The plugin makes no network requests. Data survives uninstalling — remove books from the shelf to clear it.

## License

[MIT](LICENSE)
