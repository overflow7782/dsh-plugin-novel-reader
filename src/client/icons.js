// 线性图标，统一 1.6 描边、currentColor。React / h 由构建前言提供。
/* global h */

function svg(size, children) {
  return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, ...children);
}

const path = (d) => h('path', { d, key: d });

export const BookIcon = ({ size = 16 }) => svg(size, [path('M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 1 4 16z'), path('M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16z')]);
export const ShelfIcon = ({ size = 16 }) => svg(size, [path('M5 4v16'), path('M9 4v16'), path('M13.5 4.5l4.5 15'), path('M3 20h18')]);
export const TocIcon = ({ size = 16 }) => svg(size, [path('M9 6h11'), path('M9 12h11'), path('M9 18h11'), path('M4.5 6h.01'), path('M4.5 12h.01'), path('M4.5 18h.01')]);
export const GearIcon = ({ size = 16 }) => svg(size, [path('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'), path('M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z')]);
export const CloseIcon = ({ size = 16 }) => svg(size, [path('M6 6l12 12'), path('M18 6L6 18')]);
export const PlusIcon = ({ size = 16 }) => svg(size, [path('M12 5v14'), path('M5 12h14')]);
export const TrashIcon = ({ size = 16 }) => svg(size, [path('M4 7h16'), path('M10 11v6'), path('M14 11v6'), path('M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12'), path('M9 7V4h6v3')]);
export const ChevronLeftIcon = ({ size = 16 }) => svg(size, [path('M15 6l-6 6 6 6')]);
export const ChevronRightIcon = ({ size = 16 }) => svg(size, [path('M9 6l6 6-6 6')]);
