VERDICT: ACCEPTED

# 交叉回应（第 1 次）

核对基线与 06-amend-1.md 相同：HEAD 7113e14（mussel-table）。改动台账 19 条中实质改动 8 条（#1、#6-#12）逐条复审并经源码验证，全部**接受**；非实质改动 11 条按规则无需回应。异议 0 条、争议项 0，无需回应。

## 实质改动回应

| # | 台账摘要 | 结论 | 复核证据 |
|---|---|---|---|
| 1 | `_mapText` 补 `!column.text` 门控 | 接受 | row-geometry.js:63-68 `valueOf` 仅 `_value(record) ?? record[field]`，无 `_text` 分支；不门控则 `column.text` 列按映射值估高、按 `text` 输出绘制，行高与文本分裂。与 §接口 3 首行 `_text` 优先口径一致 |
| 6 | 未命中值断言改 `resolveCellContent` text = `5`（非 `'5'`） | 接受 | `createDisplayMapper` 未命中返回 `map.default ?? 原值`，即 number `5`；字符串化发生在绘制层 cell-painters.js:536 `const text = String(display)`。断言口径正确 |
| 7 | #2②③ 先横滚使 colIndex 9 可见再交互；点名称列（colIndex 2）提交；③ 复位 scrollLeft | 接受 | main-view.vue:874 `stageWidth = ref(960)`；默认 13 列宽 = check 48 / # 56 / 名称无 width → layout.js:101-105 `resolveFlexWidth` 取 text 类型默认宽 160 / 状态 100 / 数量 100 / 金额 120 / 日期 120 / 备注 180 / 启用 80，"等级"插在启用（colIndex 8）后为 colIndex 9，左缘 48+56+160+100+100+120+120+180+80 = 964 > 960，初始不可见；canvas-table.vue:1185-1195 `getLayoutInfo` 仅 `colWidths` 无 `colLefts`，前缀和为唯一换算途径 |
| 8 | #4② 像素采样 (0,3) 与 (0,9)、空值占位（colIndex 13）均按横滚口径分采 | 接受 | 同 #7 依据；空值占位原 colIndex 12，插入等级列（改后 14 列）后为 13，索引与场景一致 |
| 9 | #5 M1 补视口说明、M2 按 `elapsed / (行数 × 列数)` 归一化、补 `scanCount = 100000` 与 `host` 定义 | 接受 | 基线默认场景 13 列、改后 14 列，+1/13 ≈ 7.7% 扫描量，不归一化直接比逼近 1.10 阈值；row-geometry-controller.js:303-315 扫描时 `scanCount = rows.length`、签名命中跳过时为 0，核对 = 100000 可防跳过；`host` 定义使采样脚本可独立复现 |
| 10 | self-checks/row-geometry.js 改精算断言（`ensureRowMeasured` + `maxLines: 2`，估高不作断言） | 接受 | row-geometry.js:97-100：`maxLines > 1` 且 `!precise` 恒返回 1（估高下界），按估高写"多行行高"断言必失败；精算入口 `ensureRowMeasured`（:454）经 `columnLineCount` → `measuredLineCountOf` → `wrapLines`，载体正确 |
| 11 | S2 判据收敛到 cell-painters.js，全仓收敛归 S6 | 接受 | painter.js:417 现为 `onImageLoad: state.onImageLoad ? () => state.onImageLoad(row, colIndex) : undefined` 旧闭包；S2 只改 cell-painters.js 时该闭包仍在，原全仓 grep 判据在 S6 前不可满足。拆分后 S2/S6 各有可独立验证判据 |
| 12 | S6 判据改"withImageRelay 签名不变 + 全仓 grep onImageLoad" | 接受 | painter.js:1227-1233 `withImageRelay` 现签名即 `(row, col)` 两参处理器，原"改为 (row, col)"为空操作判据；修正后 S6 有实质完成判据 |

## 一致性核查（接受改动对关联章节的影响）

- 方案概述第 2 条（台账 #18）"映射求值非空即返回；`column.text` 优先时不挂 `_mapText`"与 §接口 2、§接口 7 一致：`valueOf` 的 `if (col._mapText)` 因 `_mapText` 在 `column.text` 时为 null 天然门控，无需补 `_text` 分支。
- 测试计划 #2①/#4②/#5 与 §接口 1/§接口 5、改动清单（self-checks/row-geometry.js、editor.js、layout.js 行）交叉引用一致；#4② 的 `getCellRect(0,3)` 为状态列显示映射文本"启用"（STATUS_MAPPINGS 派生，见 #2③ 选项 启用/待处理/已归档），与"启用"列（colIndex 8）无混淆。
- 实施步骤 S2/S6 判据与改动清单 painter.js、cell-painters.js 行口径一致；S8 的 colWidths 断言同步要求覆盖插入等级列（14 列）。
- 风险表新增两条（#13 列配置静态 / #14 `_align` center→left）与"遵循约定"节像素断言防漂移条目互洽。

未发现接受改动引入的新不一致。

## 设计文档改动

无。8 条实质改动全部接受，无回退；02-design.md 维持审改后版本，未做编辑。
