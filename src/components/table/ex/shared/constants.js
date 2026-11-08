/**
 * table-ex 跨模块镜像常量（单一事实源）：取值均镜像 DOM 规格或探针不可达
 * 变量，非新增设计值；各模块同值副本统一自此 import。零依赖。
 */

/** 树形列缩进（镜像 tree.scss --mu-tree_node-indent: 16px；定义于 .mu-tree
    作用域，组件探针读不到） */
export const TREE_INDENT = 16

/** 单元格内容区 padding 缺省（--cell-padding 镜像；hitTest cellX、绘制内容
    区扣减、行高公式回退共用） */
export const CELL_PADDING_FALLBACK = 8

/** check 方框规格（镜像 column-types/style.scss .mu-table__cell-check：
    16px、圆角 4px、✓ 12px）；表头与单元格同规格 */
export const CHECK_SIZE = 16
export const CHECK_RADIUS = 4
export const CHECK_FONT_SIZE = 12

/** 省略号字面：单行省略 / maxLines 末行收缩 / 数组与 link 条目超限共一字面 */
export const ELLIPSIS = '...'

/** 主题快照缺字段时的字体容错回退（生产路径快照必含，仅为容错） */
export const FONT_SIZE_FALLBACK = 14
export const FONT_FAMILY_FALLBACK = 'sans-serif'

/** 行顶内容内缩 1px：行格线画在下一行矩形顶部（占用本格矩形内 1px）。全部
    垂直锚（文字/树箭头/items/progress/button/格按钮）统一为「格顶 +
    ROW_TOP_INSET + (ROW_HEIGHT − ROW_TOP_INSET) / 2」行线间空白中点式（与
    lineHeight/padding 解耦），与 gridlines 模式无关，对所有行（含 r = 0）
    取同一值 */
export const ROW_TOP_INSET = 1

/** --row-height 镜像缺省（editor.js 不可 import theme.js，模块隔离；镜像
    row-geometry.js 同值容错回退） */
export const ROW_HEIGHT_FALLBACK = 36

/** button pill 高度容错回退：镜像 root.scss --mu-control-height-small: 24px
    （快照未定义/0 时 buttonHeightOf 取本值） */
export const CONTROL_HEIGHT_SMALL_FALLBACK = 24

/** 列定义格按钮（column.cellButton）命中/绘制区规格：24×24 区右缘
    贴格内容区右缘，16px 图标居中其中 */
export const CELL_BUTTON_AREA = 24
export const CELL_BUTTON_ICON_SIZE = 16

// —— 视觉常量（跨 item-painters / canvas-kind-painters / cell-tooltip / link-items 共享）——

// tag pill —— 镜像 components/tag/tag.scss .mu-tag。TAG_HEIGHT / TAG_PADDING_X
// 为 tag 绘制链专用（drawTag、items 命中矩形）；button 不与 tag 同构——pill
// 高度经 buttonHeightOf 取 controlHeightSmall 快照，仅 link 形态命中框沿用
// TAG_HEIGHT（column.link = true 时整列改纯文字链形态，无 pill 内边距）

export const TAG_HEIGHT = 20

export const TAG_PADDING_X = 8

export const TAG_RADIUS = 4

/** button 图标：12px 同 TAG_FONT_SIZE 档；caption 与 icon 互斥、有文本 icon
    忽略（不解析不绘制），icon-only pill 宽 = 高 = controlHeightSmall 快照
    （图标居中），link 形态宽 = 图标本体 */
export const BUTTON_ICON_SIZE = 12
