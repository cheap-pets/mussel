# 实施记录 — 注释精简 批4（cell-paint 白名单 4 文件）

## 改动文件（仅注释行，零代码 token 变更；git diff 过滤注释后无非注释行）

| 文件 | wc -l 前→后 | 编辑 |
|---|---|---|
| src/components/table/ex/cell-paint/cell-content.js | 154 → 150 | 3 处：①头部取值链块注释 9→7 行（删"纯文本列短路免 render"重复表述、"不走 class 解析"同义语、"prepareColumn 在 resolveColumnType 之前分发"与 _render 构建注释重复，改"见 createColumnRender"指路）②_render 构建注释 3→2 行 ③删 resolveCellContent 内 ensureFn 通用语义复述注释 1 行 |
| src/components/table/ex/cell-paint/cell-tooltip.js | 235 → 234 | 1 处：头部惰性求值块注释 5→4 行合并（"缓存条目"→"缓存"、句尾句号清理，语义未删） |
| src/components/table/ex/cell-paint/icon-image.js | 101 → 101 | 1 处：过时引用更新 drawIconGlyph JSDoc "painter.paintEditButton"→"paintEditButton"（paintEditButton 现定义于 ex/table-paint/paint-overlay.js:188，painter.js 无此符号；全仓唯一无需前缀） |
| src/components/table/ex/cell-paint/link-items.js | 107 → 107 | 0 处：全部为契约/JSDoc 注释，无冗余，未触碰 |

合计 597 → 592（-5 行），精简注释 5 条。

## 偏离
无。

## 保留的契约注释（逐字未动）
- cell-content.js：模块隔离不变式（不 import theme.js/layout.js，theme 快照传入）、取值链与 DOM 版同款、_mapText enum 独有仅供 row-geometry 估高、resolveMaxLines 不在列准备期求值（行高/绘制分裂）、isPlainTextColumn 短路条件（color/link 需 compile）、title 列协议、_autoRowSpan 协议（spans.buildSpans 消费）、数组值门控、数组门控置于 _plainText 短路之前、capMaxLinesOf 合并主格区域钳制
- cell-tooltip.js：惰性求值不引入第二套测量式、img 判定期不调用 requestImage、tooltipItemWidthOf 只读口径、buttonsOverflowOf caption/icon 形态互斥、resolveTooltipText contentWidth≤0 按溢出、falsy title 不生效（不得 String(false)）、全部 JSDoc @param/@returns 结构
- icon-image.js：crossOrigin=anonymous、onload 一次 flush 全部监听 + rAF 合帧语义、loading 累积登记不去重、loaded/failed 不回调、drawIconGlyph svg/cls/pending/failed 状态协议 JSDoc
- link-items.js：alignedEntryX 与 textAnchorX 同口径、drawLinkEntry hovered 下划线、dots 条目 link 门控基线（空集缺省 true）、onItemRect 回报协议

## 死代码存疑清单
无（4 文件均无注释掉的死代码块）。

## 自检
- `git diff` 过滤验证：本批 4 文件改动全为 `//` / `/**` 注释行，零代码 token / 字符串 / 结构变更（canvas-kind-painters.js、cell-painters.js 的 diff 属并行批3，未触碰）。
- `/d/npm/global/eslint` 4 文件：0 errors；1 既有 warning（cell-tooltip.js:72 buttonsOverflowOf complexity 13，该函数体未在本次触碰，diff 证实仅注释变更，非新错）。
- 引用核验：base/table.vue、base/table-row.vue、row-geometry、spans.buildSpans、drawCanvasKindContent、resolveTooltipTarget、TOOLTIP_SHOW_DELAY、shared/theme.js 均存在，无其他过时引用；本批文件无 @host-* 注解。

## 遗留
无。未跑 build（按派发由终验统一做）；未 commit。
