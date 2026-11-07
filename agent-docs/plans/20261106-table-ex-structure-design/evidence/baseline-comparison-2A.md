# 基线逐字比对明细（批次 2A 后复采 vs probe-baseline-2A.md）

复采方式（与基线同操作）：`npm run demo:build`（后台，验证员自启，监听 PID 3520，已关闭）→ playwright mcp 依次访问三页，页面加载无交互；console 经 browser_console_messages 落盘，面板计数经 browser_evaluate 采集。

## 1. 构建序

| 项 | 基线 | 本轮 | 判定 |
|---|---|---|---|
| modules | ✓ 485 modules transformed | ✓ 487 modules transformed | 一致（量级判据；+2 = 批次 2A 新建 editor-geometry.js / cell-identity.js，可解释） |
| 耗时 | built in 645ms | built in 638ms | 漂移允许 |
| table-ex/style.css | 3.04 kB | 3.04 kB | 一致 |
| table-ex-basic/style.css | 0.27 kB | 0.27 kB | 一致 |
| table-ex-scene/style.css | 0.15 kB | 0.15 kB | 一致 |
| table-ex/main.js | 454.30 kB │ gzip 112.51 | 454.30 kB │ gzip 112.51 | 一致 |
| table-ex-basic/main.js | 12.86 kB │ gzip 3.99 | 12.86 kB │ gzip 3.99 | 一致 |
| table-ex-scene/main.js | 8.41 kB │ gzip 2.96 | 8.41 kB │ gzip 2.96 | 一致 |

## 2. 自检面板（/data/table-ex/）

| 项 | 基线 | 本轮 | 判定 |
|---|---|---|---|
| 面板标题 | 调试面板 | 调试面板（snapshot yml 原文） | 一致 |
| 计数行 | 自检结果（232/232 通过） | 自检结果（232/232 通过）（snapshot yml 原文） | 一致 |
| .ct-check-item | 232 | 232 | 一致 |
| .ct-check-item--fail | 0 | 0 | 一致 |
| 含 ✗ 项 | 0 | 0 | 一致 |
| text-wrap / layout | 14 / 21 | 14 / 21 | 一致 |
| row-geometry / cell-painters | 16 / 57 | 16 / 57 | 一致 |
| row-geometry-controller / painter | 8 / 32 | 8 / 32 | 一致 |
| tree / interactions | 14 / 19 | 14 / 19 | 一致 |
| spans / editor | 13 / 18 | 13 / 18 | 一致 |
| theme / data | 16 / 4 | 16 / 4 | 一致 |

## 3. Console 逐字序列（/data/table-ex/，46 行）

归一化 diff（去 `[ NNNms]` 时间戳与 `@ http://…` 源行号后逐行 diff 基线存档 `console-2026-11-06T16-48-37-009Z.log` vs 本轮 `evidence/console-verify-table-ex.log`）：**仅 4 行差异，全部为 icon 夹具名内嵌的 `Date.now()` 时间戳后缀**（`cell-painters.js:2332` `const unregName = \`noRegEntry${Date.now()}\`` 等，运行时生成，逐次加载必变；基线值 1793983717291≈基线采集时刻 16:48:37，本轮值 1793984830473≈本轮采集时刻 17:07:10）：

| 行号 | 基线 | 本轮 | 定性 |
|---|---|---|---|
| 10 | Invalid icon "noRegEntry1793983717291" | Invalid icon "noRegEntry1793984830473" | 夹具时间戳后缀（预期漂移） |
| 44 | Icon "editGateProbe1793983717458" may have the same content… | Icon "editGateProbe1793984830655" … | 同上 |
| 45 | Invalid icon "noRegEdit1793983717458" | Invalid icon "noRegEdit1793984830656" | 同上 |

序列结构逐段一致：INFO(Vue dev) → demoGlyphA → demoGlyphB → Canvas2D×5 → noRegEntry → Canvas2D×33 → editGateProbe → noRegEdit → ERROR(ERR_INVALID_URL)。计数：WARNING 43（Canvas2D 38 + icon 5）、ERROR 1、INFO 1——与基线全同；无新增 error/warning 类型；无 `v-on` / `ReferenceError` / `is not defined` / `Cannot find`。

Canvas2D 警告产物行号分布（漂移允许，仅记录）：基线 4543×2 / 4544×2 / 4598×1 / 7306×1 / 7319×14 / 7331×18 → 本轮 4543×2 / 4544×2 / 4598×1 / 7306×1 / 7319×13 / 7331×19（7319↔7331 相邻行互移 1 条，总数 38 不变）。

### 页 /data/table-ex-basic/ 与 /data/table-ex-scene/

| 页 | 基线 | 本轮 | 判定 |
|---|---|---|---|
| basic | 0 error 0 warning，1 INFO（Vue dev） | 同（console-verify-table-ex-basic.log 2 行） | 一致 |
| scene | 0 error 0 warning，1 INFO（Vue dev） | 同（console-verify-table-ex-scene.log 2 行） | 一致 |

## 4. 结论（页面加载口径）

探针基线逐字比对 PASS：三页 error/warning 条数、文本、顺序与基线一致；差异仅为口径允许的三类漂移（时间戳、产物行号、夹具名内嵌 Date.now() 后缀）。

**注意**：该口径不触发 tooltip 展示路径。本轮追加的 hover 交互探针发现 6 条 `ReferenceError: isSameCell is not defined`（evidence/console-hover-probe.log L47–L52），属行为冻结破坏，见验证报告失败项——批次 2A 前该路径有局部 isSameCell 定义，不抛错。
