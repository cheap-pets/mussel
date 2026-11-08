# 实施记录 — 注释精简 批2（table-paint/）

## 改动文件（wc -l 前→后）
- paint-body.js 343→343（1 处压缩：drawCellClipped 头注删「完全可见格跳过 clip」——重复 clipIfPartial JSDoc）
- paint-header.js 295→294（删 L279「末列右缘视口 x（contentRightXOf 共享式）」——复述调用代码，共享式口径已在 contentRightXOf JSDoc 与 L282/291 保留）
- paint-overlay.js 254→253（删 L246「选中格描边独立于 hover 反馈，自带表体区裁剪」——重复 paintCellSelection/strokeBodyFrame JSDoc）
- paint-utils.js 126→126（1 处过时引用更新：cellRectAt JSDoc「interactions / editor / 自检共用」→「use-table-api getCellRect 坐标辅助 / 自检基准式共用」；出处为 B1 已删的 painter.js re-export 注释，现状验证：interaction/hit-test.js 自算不引 cellRectAt、editing/ 无引用，消费方 use-table-api.js:16 + demo 自检 spans.js:28）
- paint-gridlines.js 158→158、painter.js 415→415（无改动）

合计 1591→1589（-2）；精简注释 4 条（删 2、更新 1、压缩 1）。

## 偏离
无。

## 保留的契约注释（逐字未动）
- paint-overlay：cellFrameOf/strokeBodyFrame/paintCellSelection「矩形链逐字同源」、paintHoverPlainStroke「谓词互补（勿改写）」、paintHoverRow/paintHoverCol/paintHoverHighlight cap 至 contentRightXOf 口径与 spanRectOf 联动、paintHoverOverlay 覆盖层裁剪到表体区、paintTreeArrowAccent 首行槽位锚口径
- paint-header：L81 字形墨迹锚、L143 centeredTextAnchor 光学居中口径、L282/L291 末线 cap 口径
- paint-body/paint-gridlines/paint-utils/painter：bandToX 扩展语义、spanKeepRows 时序、两遍式顺序、veil/rightInsetOf/blankTail 口径、contentRightXOf/contentBottomYOf 共享式、colLineSkipIntervals 上界 cols.to+1、painter 模块头 state 契约与 region 形状、prepareSpansRegion 归一扩展顺序
- 全部 JSDoc @param/@returns 结构与文件头一句话职责行；@host-* 注解：本批文件均不含（grep 验证）

## 死代码存疑清单
无——6 文件中未发现注释掉的代码块。

## 自检
- git diff --unified=0 核对：本批 hunk 仅注释行（paint-overlay/painter diff 中其余 hunk 为工作区未提交的 B1-B4 重构改动，非本批产生）
- /d/npm/global/eslint paint-body.js paint-header.js paint-overlay.js paint-utils.js → 0 error 0 warning
- 交叉引用现状验证：drawTreeAffordance、requestIconImage、parentKeys、buildSpans/spanMethod/autoRowSpan、base/table.vue selectedRecKey/headerCheckbox、.mu-table--x-scrolled .last-fixed-col（base/table.scss:133）均存在，无过时残留
- 未跑 build（按派发留待终验统一验证）；未改 scripts/、未 commit

## 遗留
painter.js/paint-gridlines.js 注释在重构批次已充分收敛，本批无可精简项，未做符号性改动。
