// 客户端入口：状态栏图标 + 侧边栏页签（优先 better-sidebar，未安装时退回 DSH 原生右侧栏）。
/* global h */
import { bindLocale, MESSAGES, NS, t } from './i18n.js';
import { installStyles } from './styles.js';
import { comboOf, isRecordingCombo, settingsStore } from './settings.js';
import { flushProgress } from './state.js';
import { BookIcon } from './icons.js';
import { Boundary } from './ui-shared.js';
import { ReaderSurface } from './ui-reader.js';
import { DockPeek, hideAllPeeks } from './ui-peek.js';
import { SettingsPage } from './ui-settings.js';
import { installNavIcon } from './nav-icon.js';

export const inject = ['slots', 'locale'];

/** 侧栏页签类型；better-sidebar 和原生右侧栏用同一个 kind，会话里保存的页签两边都能恢复。 */
const TAB_KIND = 'novel-reader';
const NATIVE_TAB_ID = 'dsh-plugin-novel-reader:reader';
/** 等 better-sidebar 服务就位的宽限期，过后仍没有才注册原生页签，避免出现两个同名入口。 */
const BETTER_SIDEBAR_GRACE_MS = 1500;

const SidebarTab = () => h(Boundary, { fallback: null }, h(ReaderSurface));
const DockSlot = () => h(Boundary, { fallback: null }, h(DockPeek));
const SettingsSlot = () => h(Boundary, { fallback: null }, h(SettingsPage));

function serviceOf(ctx, name) {
  try {
    return ctx.get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

function tabMeta() {
  return {
    title: () => t('tabTitle'),
    description: () => t('tabDesc'),
  };
}

function registerNativeTab(ctx, tabs) {
  const disposeType = tabs.register({
    id: NATIVE_TAB_ID,
    kind: TAB_KIND,
    keepMounted: true,
    priority: 'extension',
    title: () => t('tabTitle'),
    guide: [{ id: TAB_KIND, order: 90, ...tabMeta(), icon: (props) => h(BookIcon, { size: props?.size ?? 16 }) }],
  });
  let disposeBody;
  try {
    disposeBody = ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: NATIVE_TAB_ID, locale: NS }, SidebarTab));
  } catch (error) {
    disposeType();
    throw error;
  }
  return () => {
    disposeBody?.();
    disposeType();
  };
}

/** 老板键：收起速览窗，并关掉所有会话里打开的「小说」侧栏页签。 */
function hideReader(ctx) {
  hideAllPeeks();
  const sidebar = serviceOf(ctx, 'sidebarRight');
  try {
    // better-sidebar 也把页签同步成原生右侧栏的同一个 kind，所以这一条路径两种情况都能关掉。
    for (const tab of sidebar?.openTabs?.getSnapshot?.() ?? []) {
      if (tab.kind === TAB_KIND) sidebar.closeIn(tab.sessionId, tab.tabId);
    }
  } catch (error) {
    console.warn('[novel-reader] closing sidebar tabs failed', error);
  }
}

/**
 * 老板键和「顶栏快捷键」用插件自己的按键监听，而不是 DSH 的快捷键服务：那边 Web 端只放行少数组合、
 * Linux 上单 Shift 也算「缺修饰键」，Shift+F1 会被直接拒绝注册。键位在本插件设置页里录制。
 */
function registerShortcuts(ctx) {
  ctx.effect(() => {
    const onKey = (event) => {
      if (event.repeat || isRecordingCombo()) return;
      const current = settingsStore.get();
      const combo = comboOf(event);
      if (combo === '') return;
      if (current.bossKey !== '' && combo === current.bossKey) {
        event.preventDefault();
        event.stopPropagation();
        hideReader(ctx);
        return;
      }
      if (current.peekHeadKey !== '' && combo === current.peekHeadKey) {
        event.preventDefault();
        event.stopPropagation();
        settingsStore.update({ peekHeadHidden: !current.peekHeadHidden });
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, 'novel-reader: shortcuts');
}

function registerSidebar(ctx) {
  ctx.inject(['betterSidebar'], (scope) => {
    const sidebar = serviceOf(scope, 'betterSidebar');
    if (sidebar === undefined) return;
    scope.effect(
      () =>
        sidebar.registerTab({
          id: TAB_KIND,
          ...tabMeta(),
          icon: (size) => h(BookIcon, { size }),
          order: 90,
          single: true,
          component: SidebarTab,
        }),
      'novel-reader: better-sidebar tab',
    );
  });

  ctx.inject(['sidebarRightTabs'], (scope) => {
    const tabs = serviceOf(scope, 'sidebarRightTabs');
    if (tabs === undefined) return;
    let dispose = null;
    let timer = 0;
    const sync = () => {
      if (serviceOf(ctx, 'betterSidebar') !== undefined) {
        dispose?.();
        dispose = null;
      } else if (dispose === null) {
        dispose = registerNativeTab(ctx, tabs);
      }
    };
    const later = (ms) => {
      clearTimeout(timer);
      timer = setTimeout(sync, ms);
    };
    scope.effect(() => {
      later(BETTER_SIDEBAR_GRACE_MS);
      return () => {
        clearTimeout(timer);
        dispose?.();
        dispose = null;
      };
    }, 'novel-reader: native sidebar tab');
    try {
      scope.on('internal/service', () => later(300));
    } catch {
      // 没有服务变更事件时只做一次判断
    }
  });
}

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, MESSAGES), 'novel-reader: locale');
  bindLocale(ctx.locale.bind(NS));
  ctx.effect(() => installStyles(), 'novel-reader: styles');
  ctx.effect(() => {
    window.addEventListener('beforeunload', flushProgress);
    return () => {
      window.removeEventListener('beforeunload', flushProgress);
      flushProgress();
    };
  }, 'novel-reader: progress flush');

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register({ name: 'settings.section', id: 'novel-reader', order: 400, locale: NS, label: () => t('settingsNav') }, SettingsSlot),
  );
  ctx.effect(() => installNavIcon(() => t('settingsNav')), 'novel-reader: settings nav icon');

  ctx.slots.inject('conversation.composer.dock', () =>
    ctx.slots.register({ name: 'conversation.composer.dock', id: 'novel-reader', order: 5, locale: NS, label: () => t('dockLabel') }, DockSlot),
  );
  registerSidebar(ctx);
  registerShortcuts(ctx);
}
