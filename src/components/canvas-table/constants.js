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
