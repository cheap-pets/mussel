# 验证报告（第 1 轮）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

首轮，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS (exit 0) | dev：`✓ 297 modules transformed`，`dist/mussel.js 615.79 kB`，`✓ built in 546ms`；prod：`dist/mussel.min.js 294.51 kB`，`✓ built in 542ms` |
| `grep -rn "enum" src/components/table-ex/` | PASS (exit 1=无命中) | 0 命中（源码与注释均净，按测试计划大小写敏感口径） |
| `grep -rn "enum" demo/src/data/table-ex/` | PASS (exit 1=无命中) | 0 命中（S8 判据） |
| `grep -rn "enum"`（-i 变体，补充核对） | 信息 | 仅子串假阳性：`editor.js` 的 `toFiniteNumber`/`normalizeNumericCommit`（finit**eNum**ber/Num**eric**，非 enum 逻辑）；demo 夹具变量名 `numericEnumColumn`（self-checks/editor.js:856，见测试质量） |
| `grep -rn "onImageLoad" src/ demo/src/data/table-ex/self-checks/` | PASS（S2/S6 判据） | 闭包仅建于 `cell-painters.js:721`（measureItem img 分支）与 `:1147`（drawCellImage），均为 `() => onImageLoad(row, colIndex)`；`painter.js:358` 直传 `onImageLoad: state.onImageLoad`；`painter.js:799`（hover 图标单次调用）与 `:1124`（withImageRelay 接管，签名不变）；self-checks 为零参回调（天然兼容）+ 新契约断言（cell-painters.js:575-609，断言 `[[3, 5]]`） |
| `grep -n "recordKeyOf" painter.js` | PASS（P1a） | `painter.js:251` `const recordKey = state.flatInfo ? recordKeyOf(state, record, r) : null`（paintBodyRow 行级一次）；drawCellClipped 不再逐格调 recordKeyOf |
| 注释扫描（node 内联脚本，7 个源文件，`//` 连续块与 `/* */` 块按物理行 >3 输出） | PASS | `ALL CLEAN`（0 输出） |
| `node --check` 10 个 self-checks .js | PASS | 全部 OK |
| demo 服务 + HTTP（本次启动：`node node_modules/vite/bin/vite.js build --config vite.demo.config.js --watch`，PID 1287，日志 `evidence/demo-watch.log`，验证后已 `kill -9 1287`，POST_KILL=000） | PASS（HTTP 部分） | `/data/table-ex/` → 200，`<title>TableEx 画布表格 - Mussel Demo</title>`；`/data/table-ex/main.js` → 200（323404 bytes，含 56 处 `mappings`）；`style.css` → 200（3041 bytes）。首次启动（PID 22）因服务先于构建完成监听、旧 index.html 污染判定，已终止并以 main.js 200 为就绪判据重测 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. table-ex 源码无 enum 处理逻辑 | 命令 | `grep -rn "enum" src/components/table-ex/` 0 命中；`COLUMN_TYPE_EDITORS`（editor.js:97-104）无 enum 条目；layout.js `TYPE_DEFAULT_WIDTHS` 断言表已删 enum 行（13 条目）；`table/column-types/` 未动（设计既定，DOM 版 mu-table 保留） | PASS |
| 2. text/number 列 mappings 显示映射生效且优先；options 编辑下拉；仅 options 显示按转换映射 | 浏览器 + demo 自检 | 无 playwright mcp（00-task.md 环境豁免裁定）。代码级补充证据（不替代手段）：`mappings.js:48-59` createDisplayMapper 固化 mappings 优先；`cell-painters.js:176-180` `_mapText`/`_plainText` 挂载；`resolveCellContent:189-211` 短路与映射分支；`editor.js:136-153` resolveEditorType 三来源 → select；`editor.js:231-241` resolveSelectOptions 三级优先；`row-geometry.js:58-69` valueOf 应用映射；demo 载体 `main-view.vue:427` 等级列（number+options，记录取值 `main-view.vue:364` `level: (i % 3) + 1` 全覆盖）、`:390` 状态列 text+mappings；自检断言就位（cell-painters.js:351/370/407/575、editor.js:369/418/451、row-geometry.js:443、layout.js:177），断言精确值非仅不抛错 | UNVERIFIED（环境豁免 → 需人工） |
| 3. `npm run build` 通过 | 命令 | exit 0，dev + prod 两次 `✓ built` | PASS |
| 4. demo 页渲染正常：映射列显示映射值、编辑下拉编辑态正常 | 浏览器 | 无 playwright mcp（环境豁免）。HTTP 补充：页面与构建产物可服务（index/main.js/style.css 均 200，bundle 含映射逻辑）；渲染与像素采样（暗像素 >30/<10 口径）、自检面板 0 failed 无法执行 | UNVERIFIED（环境豁免 → 需人工） |
| 5. 性能度量无回退（M1/M2） | 浏览器（playwright evaluate 采样） | 无 playwright mcp（环境豁免）；且 S0 改前基线未采集（decisions.md 已裁定转需人工，收尾汇报如实说明）。判据与口径在 02-design.md 测试计划 #5 已列明（M1 `lastPaint.elapsed`、M2 归一化 `lastRelayout.elapsed`，中位数 ≤ 基线 ×1.10，`scanCount=100000` 核对） | UNVERIFIED（环境豁免 → 需人工） |
| 6. 改动代码注释每段 ≤3 行；复杂度重构点有说明 | 命令 + 人工 | 命令部分：7 个源文件（含新增 mappings.js）注释块扫描 ALL CLEAN。设计部分：R1-R5 于 02-design.md「方案概述」第 4 条逐条说明（R1 抽取 mappings.js、R2 短路化、R3 分支表驱动、R4 参数瘦身、R5 注释压缩）。人工抽样核对见"需人工检查" | PASS（人工抽样另列需人工） |

## 范围核对

- 基线：mussel-table @ 7113e14，工作区 clean（本轮 `git log` 确认 HEAD 仍为 7113e14，未提交）。无"基线已有脏文件"、"无法区分"项。
- 改动（12 修改 + 1 新增）与 02-design.md 改动清单逐一对应，无多无少：
  - src 7：`mappings.js`（新增）、`cell-painters.js`、`editor.js`、`layout.js`、`painter.js`、`row-geometry.js`、`table-ex.vue`
  - demo 6：`main-view.vue`、`self-checks/{cell-painters,editor,layout,painter,row-geometry}.js`
  - `git diff --stat` 合计 757 insertions / 1239 deletions
- 未改动清单核对：`theme.js`/`text-wrap.js`/`tree.js`/`interactions.js`/`row-geometry-controller.js`/`use-tree-rows.js`/`use-column-resize.js`/`constants.js`/`index.js`/`table/`/`self-checks/index.js` 等 0 改动（git status 确认）。
- 验证产物：`dist/`、`demo/dist/`（.gitignore:15 `dist/` 已忽略）；demo watch 重建曾清空 demo/dist 后重写（knowledge `demo-watch-wipes-dist`，属预期）。
- 任务产物：`agent-docs/plans/20261028-table-ex-optimize/`（未跟踪，流水线输出目录，排除）。
- 设计外改动：无。并行实施：无（串行）。

## 测试质量问题

- 新增断言均断言精确值而非"不抛错"：mappings 优先 `'甲'`、仅 options `'低'`/`'x'`/未命中原值 `5`、number 未命中 `1234.5`（不走 Intl）vs 无映射 `'1,234.50'`、三级 options 来源逐级、`resolveEditorType` 各来源 `'select'`、显式 options 提交值保持 number、onImageLoad 以 `(row, colIndex)` 调用（`[[3, 5]]`）、映射文本精算行高 `52/36`。覆盖验收 #2 全部子项，质量合格。
- 小问题（不判 FAIL）：`self-checks/editor.js:856` 夹具变量名 `numericEnumColumn` 残留 enum 字样（实为 number+mappings 列，语义已非 enum）。仅命名残留，不影响断言正确性；大小写敏感 grep 口径下不违 S8 判据。
- row-geometry 估高路径仅确认不抛错、不作行高断言——与设计既定语义一致（恒 1 行下界），非质量问题。

## 需人工检查

1. **验收 #2②（等级列交互）**：`http://localhost:3000/data/table-ex/` 复位 scrollTop=0 → 按 `getLayoutInfo().colWidths` 前缀和求等级列（colIndex 9）左缘 → 设 `.mu-table-ex__scroll` scrollLeft 使其可见（等 ≥80ms，`getCellRect(0,9).x ∈ [0, canvas.clientWidth)`）→ 格中心派发带 clientX 的 pointerdown/pointerup/click → 等 ≥80ms → `.mu-table-ex__editor` 内 `.mu-select` 存在 → 展开后 `.mu-dropdown-panel .mu-option` = 低/中/高 → 点"中" → 事件日志 `.ct-event-log__item` 首条含 `"value":2` → 点名称列提交关闭。
2. **验收 #2③（状态列 mappings 派生下拉）**：复位 scrollLeft=0 → 状态列（colIndex 3）同法开下拉 → 选项 = 启用/待处理/已归档（无 default）。
3. **验收 #4（渲染与像素采样）**：自检面板 0 failed；`getCellRect(0,3)`（'启用'）格内暗像素（lum<100）> 30；横滚至 colIndex 9 可见后 `getCellRect(0,9)`（'低'）> 30；colIndex 13（空值占位列）对照格 < 10。
4. **验收 #5（性能复测）**：按 02-design.md 测试计划 #5 口径执行 M1/M2 采样；因 S0 基线缺失（decisions.md 裁定），需先定补采方式（如 git worktree 检出 7113e14 起临时服务采基线）或按"无基线单侧复测"豁免——此为调度者决策项。
5. **验收 #6 人工抽样**：核对压缩后注释未丢失关键算法锚点（Fenwick 倍增下降、估高 1 行下界与精算同源 wrapLines、滚动锚定补偿、槽位锚公式与 +0.01 浮点容差、bandToX/blankTail 派生式、blur 兜底三判据）。实施记录 04-impl.md 已自述抽样通过，须人工复核确认。

## 环境阻塞

1. **无 playwright mcp 等浏览器自动化工具**（00-task.md 已裁定环境豁免）：影响验收 #2②③、#4、#5 及测试计划中全部浏览器手段项 → UNVERIFIED + 需人工，不判 FAIL。
2. **S0 性能改前基线未采集**（impl 期同因阻塞，decisions.md 已裁定转需人工）：影响验收 #5"无回退"判定的基线侧。
3. **demo 服务时序陷阱（已规避，记录备查）**：watch 模式下静态服务在构建完成前即监听 :3000，残留旧 index.html 会使"index 200"误判就绪——本次以 `main.js` 200 为就绪判据重测。人工复测时注意先确认构建完成。

## 失败项（FAIL 时，不含环境阻塞）

无。
