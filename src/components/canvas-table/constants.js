/**
 * canvas-table 跨模块镜像常量（单一事实源，复核 2026-10-26 C2）。
 *
 * 取值均镜像 DOM 规格 / 探针不可达变量，非新增设计值；原分散在
 * row-geometry / interactions / cell-painters / painter / text-wrap 的
 * 同值副本统一自此 import（C2 镜像常量收拢）。本模块零依赖。
 */

/** 树形列缩进（镜像 tree.scss --mu-tree_node-indent: 16px；该变量定义于
    .mu-tree 作用域，组件探针读不到，canvas 侧取常量） */
export const TREE_INDENT = 16

/** 单元格内容区 padding 缺省（--cell-padding 镜像值；hitTest cellX 口径、
    绘制内容区扣减、行高公式的 padding 回退共用） */
export const CELL_PADDING_FALLBACK = 8

/** check 方框规格 —— src/components/table/column-types/style.scss
    .mu-table__cell-check（16px、圆角 4px、✓ 12px）；表头（painter.drawHeaderCheck）
    与单元格（cell-painters.drawCheck）同规格 */
export const CHECK_SIZE = 16
export const CHECK_RADIUS = 4
export const CHECK_FONT_SIZE = 12

/** 省略号字面（00-task.md 实施约束 4）：单行省略 / maxLines 末行收缩 /
    数组与 link 条目超限 dots 条目共一字面 */
export const ELLIPSIS = '...'

/** 主题快照缺字段时的字体容错回退（生产路径 readSnapshot 必含，缺省值仅为容错） */
export const FONT_SIZE_FALLBACK = 14
export const FONT_FAMILY_FALLBACK = 'sans-serif'

/** 行顶内容内缩 1px：行格线画在下一行矩形顶部（占用本格矩形内 1px，r ≥ 1），
    全部垂直锚（cell-painters 文字/树箭头/items/progress/button、painter
    paintTreeArrowAccent、editor editorButtonRectOf）统一为「格顶 + ROW_TOP_INSET
    + padding + lineHeight/2」首行行框槽位式；常量、与 gridlines 模式无关、
    对所有行（含 r = 0）取同一值（20261027 问题 1 Q2 统一槽位锚） */
export const ROW_TOP_INSET = 1

/** 列定义自定义编辑按钮（column.editorButton，20261027 问题 5）命中/绘制区
    规格：24×24 区右缘贴格内容区右缘，16px 图标居中其中 */
export const EDITOR_BUTTON_AREA = 24
export const EDITOR_BUTTON_ICON_SIZE = 16

/** --cell-line-height 镜像缺省（editor.js 不可 import theme.js，模块隔离）；
    editor.editorButtonRectOf 与 painter 槽位锚（S4）共用 */
export const CELL_LINE_HEIGHT_FALLBACK = 18
