VERDICT: AMENDED

# 设计审改记录（第 1 次）

核对基线：HEAD 7113e14（mussel-table），工作区仅本任务目录未跟踪。decisions.md 两条约束（自定义流水线、enum 直接移除不做兼容层）均未被设计违背。

## 检查项结论

1. **覆盖**：验收 1-6 均有对应设计与测试计划；#2/#4 的浏览器手段已修正为"横滚至 colIndex 9 再取坐标"（原方案该列不可见），#5 已补列数归一化；新增/修改的自检文件均列入改动清单与 S8。
2. **事实一致**：文件/符号/行号经 Grep 与 Read 核对；修正 3 处事实偏差——`withImageRelay` 现签名已是 `(row, col)`（painter.js:1229）、映射未命中返回原值 `5`（非字符串 `'5'`）、`getLayoutInfo()` 不含 `colLefts`（canvas-table.vue:1185-1195）。
3. **约定一致**：`_mapText`/`_plainText` 下划线内部字段、`mappings.js` 仅依赖 `@/utils/type`、editor/cell-painters 模块隔离（editor.js:33-36、cell-painters.js:36-39）均符合现状；不新增依赖。
4. **影响面**：补 `_mapText` 与 `column.text` 的门控（row-geometry.js:63-68 的 `valueOf` 无 `_text` 分支，原设计会造成"按映射估高、按 text 绘制"分裂）；`estimateColumnSignature`（row-geometry-controller.js:75-80）不含 mappings 已按"列配置静态"记入风险，与既有 text/value 函数同口径；其余调用方（checkColumnState、emitDomItemClick、paintTreeArrowAccent）不受影响。
5. **可实施**：S2 原判据"全仓 onImageLoad 仅剩新契约调用点"在 S6 前必然不成立（painter.js:417 仍是旧闭包），已拆到 S6；S6 判据同步修正。步骤顺序/依赖/文件集合无循环。
6. **风险与回滚**：原有风险均有对策；补"enum→text 后 center→left 对齐"与"运行期改 mappings 不重扫估高"两条说明；回滚方案不变。
7. **范围**：改动限于 canvas-table 源码 + 其 demo；docs/docs-site/skills 未动；`table/` 注册表保留 enum 符合 decisions.md。
8. **并行组**：G2 内 S2 {cell-painters,row-geometry}、S3 {editor}、S4 {layout}、S5 {canvas-table.vue} 两两不相交，仅共同依赖 S1；无共享/生成文件遗漏。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | `02-design.md` §接口 2 `prepareColumn` 代码块 | `col._mapText = isMappableColumnType(...)` → `col._mapText = !column.text && isMappableColumnType(...)`，并补分裂说明 | 设计 §3 规定 `column.text` 优先、不参与映射；但 row-geometry.js:63-68 的 `valueOf` 无 `_text` 分支，若不门控会按映射值估高、按 text 输出绘制 | 是 |
| 2 | §接口 3 `resolveCellContent` 注释 | "映射命中（含 number 列，命中即绕过 Intl）" → "映射器返回非 null（命中/default/原值回退）即终结，number 列不再走 Intl" | §1 `createDisplayMapper` 未命中返回原值，`mapped != null` 对任意非空值成立 | 否 |
| 3 | §接口 1 补空值语义 | 新增："text 列落占位链；number 列回退 Intl（format(null)='0'，沿用现状）" | `_plainText` 仅 text 列；number 列 null 走 number.js:5-15 formatter；原"走占位链"表述对 number 列不成立 | 否 |
| 4 | §接口 4 hooks 说明 | `drawItems/measureItem` → `drawItems/measureItem/drawItem/drawCellImage` | 闭包创建点在 measureItem:840 与 drawCellImage:1296，二者经 drawItems:738/755 → drawItem:865 透传 | 否 |
| 5 | §接口 5 P1a/P1b 注释 | "签名改为 (row, col)" → "已是 (row, col)（painter.js:1229，签名不变）"；P1a 标注置于 `record == null` 早退（painter.js:289-291）之后 | 现状 painter.js:1229 已是两参处理器；recordKeyOf 在 record 为 null 时取 `record[keyField]` 会抛 | 否 |
| 6 | 测试计划 #2 ① | 未命中值 5 → `'5'` → `resolveCellContent` text = `5`（绘制 String 化）；新增 number+mappings 断言 | `createDisplayMapper` 返回原值 number 5；cell-painters.js:536 `String(display)` 才是绘制文本 | 是 |
| 7 | 测试计划 #2 ②③ | "复位 scrollTop/scrollLeft → getCellRect(0,9)" → 先复位 scrollTop=0、按 colWidths 前缀和横滚使 colIndex 9 可见再取坐标；新增点击 `.mu-select` 展开；"点画布空白处" → 点名称列（colIndex 2，非编辑格）；③ 复位 scrollLeft=0 | 默认舞台 960（main-view.vue:874），列宽求解 name=160/status=100/…… → col 9 左缘 964（layout.js:156-185），超出视口；getLayoutInfo 无 colLefts（canvas-table.vue:1185-1195），需前缀和；未横滚时点击/采样落空（knowledge canvas-table-performance-profiling 陷阱） | 是 |
| 8 | 测试计划 #4 ② | 单次采样 (0,3)+(0,9) → scrollLeft=0 采 (0,3)，横滚后采 (0,9)，空值占位（colIndex 13）同样横滚后采 | 同 #7：col 9 与 col 13 初始不可见 | 是 |
| 9 | 测试计划 #5 | 原"默认场景 lastRelayout.elapsed 直接比" → M1 说明 col 9 在视口外不参与绘制；M2 按 `elapsed / (行数 × props.columns.length)` 归一化；补 `scanCount = 100000`；定义 `host` | baseline 13 列、改后默认场景 14 列，直接比 lastRelayout 含 +1 列扫描量（约 7.7%，逼近 1.10 阈值）；scanCount 见 row-geometry-controller.js:303-315，签名命中时为 0（knowledge 明示） | 是 |
| 10 | 改动清单 `self-checks/row-geometry.js` 行 | "映射文本参与估高（窄列长标签 → 多行行高）" → 精算 `ensureRowMeasured` + `maxLines: 2`，并注明估高恒 1 行下界不作断言 | row-geometry.js:99 `if (!precise) return 1`；精算在 :454；按原文写断言会失败 | 是 |
| 11 | 实施步骤 S2 完成判据 | 全仓 `grep onImageLoad` 仅剩新契约 → 仅查 cell-painters.js，并注明 painter.js:417 旧闭包属预期中间态、全仓收敛归 S6 | S2 时 painter.js:417 仍是 `() => state.onImageLoad(row, colIndex)` 旧闭包，判据不可满足 | 是 |
| 12 | 实施步骤 S6 完成判据 | "withImageRelay 回调签名 (row, col)" → "仍是 (row, col)（签名不变）"，并补全仓 grep onImageLoad | painter.js:1229 现状即两参，原判据是空操作 | 是 |
| 13 | 风险表"映射文本参与估高"行 | 补"列配置视为静态（estimateColumnSignature 不含 mappings，与既有 text/value 函数同口径）" | row-geometry-controller.js:75-80 签名不含 mappings；运行期改 mappings 不会重扫估高 | 否 |
| 14 | 风险表"像素断言漂移"行 | 补"enum→text 后 `_align` center→left" | enum.js:4 `align:'center'`；text.js 无 align；cell-painters.js:195-197 缺省 left | 否 |
| 15 | 未解问题 1-4 | 逐条加 amender 裁定（维持 select；不加 warn；维持 7 文件注释范围；知识库不在本设计） | 任务目标 1 契约"完整替代 enum"、decisions.md 无兼容层、验收 6"改动代码注释" | 否 |
| 16 | 改动清单 `self-checks/editor.js` 行 | 补"无 mappings/options 的 select 值变化通道夹具需补显式 `editor.type:'select'` 或 mappings" | self-checks/editor.js:911-923 依赖 select 值变化提交；仅改 `type:'text'` 会退化为 input，value 变更不提交 | 否 |
| 17 | 改动清单 `self-checks/layout.js` 行 | 补"条目数断言与 check 名称 14 → 13" | self-checks/layout.js:181 名称写 14 条目、:185 含 enum 行；删除后实际 13 | 否 |
| 18 | 方案概述第 2 条 | "命中映射即返回 {text}" → "映射求值非空即返回"；补"column.text 优先时不挂 _mapText" | 与 #1/#2 口径对齐 | 否 |
| 19 | §接口 2 说明末 | 补"两字段须在现有 `canvasOnlyKind` 求值之后挂载（`const` TDZ）" | `_plainText` 表达式引用 `canvasOnlyKind`，cell-painters.js:223 才赋值；前置插入会 TDZ ReferenceError | 否 |

## 异议

无。所有发现均可依据源码或验收标准直接修正，不涉及更换方案、修改验收标准或违背 decisions.md。

争议项：0。
