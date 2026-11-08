# 终验报告（05-verify-1.md）

VERDICT: PASS

验证人：pipeline-verifier（终验，全新独立实例，未读取 04-impl.md）；基准 HEAD `ee16eb4`，工作区（2026-11-07）。
证据目录：`evidence/`（本目录内）；基线只读冻结未动（`git status` 复核 baseline/ 无改动）。

## 审查摘要（用户按此审查 diff）

**改了什么 / 为什么**（六批，行为不变的结构重构，详见 02-design.md）：

| 批 | 改动 | 文件 |
|---|---|---|
| B1 (T1) | 删 painter.js 尾部 cellRectAt 纯转发转口（L416-418），3 消费方改从 paint-utils 直引；新增 S1 门禁脚本 | painter.js、use-table-api.js、self-checks painter/spans（仅 import 行）、scripts/table-ex-structure-check.mjs（新） |
| B2 (T1) | row-geometry-controller 文件内 `ctx`→`deps` 标识符消歧（含 JSDoc） | row-geometry-controller.js |
| B3 (T1) | @host-reads 补 2 缺口（flatRows/canvasEl）+ row-geometry.js 头注释补职责；新增 @host 审计脚本 | use-pointer.js、use-table-api.js、row-geometry.js、scripts/table-ex-host-audit.mjs（新） |
| B4 (T2) | interactions.js（407 行）按域拆为 hit-test(184)/click-resolve(218)/resize-resolve(18)，符号零增删零改名；4 消费方 + 1 self-check import 改写 | 9 文件 |
| B5 (T3) | paint-overlay 描边链三站点提取 cellFrameOf/strokeBodyFrame 单一事实源，谓词保留原函数 | paint-overlay.js |
| B6 (T3) | controller 锚定内联块收敛至既有 syncAnchoredLayout；recordNumber 内联式收敛至既有 recordNumberOf | row-geometry-controller.js |

**先看哪些文件**：
1. `git diff src/components/table/ex/table-paint/paint-overlay.js`（B5 唯一语义级重排，三站点→两函数）
2. `git diff src/components/table/ex/geometry/row-geometry-controller.js`（B2 改名 + B6 两处收敛）
3. `src/components/table/ex/interaction/`（B4 三新文件，符号平移）
4. 其余均为 import 行 / 注释级。

**已验证项**：各批门禁与残留清零、build/eslint、探针基线逐字比对（B4/B5/B6 全部）、自检双安全网 241/241、滚动点位逐值一致、API 冻结、R4、范围核对、R1 两问重跑——全部 PASS（下详）。

**需人判断的点**：见「需人工检查」（视觉走查可选；各批审查摘要的落盘形态）。

## 命令结果

| 命令 | 状态 | 关键输出 |
|---|---|---|
| `npm run build` | exit 0 | dev+prod 双通道构建成功；与 B4/B5/B6 六份基线 build 序比对：chunk 名/顺序全部一致，仅 2 行体积数字漂移（mussel.ex.js 726.18 vs 726.48 kB 等）与 B4 的模块数 332→334（拆分 1→3 文件，净 +2，设计预期内非语义漂移） |
| `node scripts/table-ex-structure-check.mjs` | exit 0 | `OK — 扫描 46 个文件，零纯转发 re-export（豁免公共入口：index.js）` |
| `node scripts/table-ex-host-audit.mjs` | exit 0 | `OK — 审计 10 个 composables 文件，host 键声明零缺失` |
| `eslint src/components/table/ex demo/src/data/table-ex --ext .js,.vue` | exit 1（存量） | 17 problems（4 error + 13 warning）全部为存量：逐文件 HEAD vs 现在对比，12 个改动文件问题数完全一致（8 个 0 problem）；4 error 中 main-view.vue（本任务未改）import/first ×2、self-checks/painter.js:1259,1269 spaced-comment（任务仅改其 import 块，L1259/1269 未触）。3 个新文件 + 2 个脚本 0 problem，未引入新违规 |
| `grep` 残留扫描（B1/B2/B4/R1） | 全部 0 命中 | cellRectAt 转口消费 0；controller `\bctx\b` 0；`interaction/interactions` 0；re-export 扫描仅 index.js 豁免项 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| code-reforge 判据：静态可答两问 | 命令（grep-only 重跑 R1） | 两问 10 项全对，与 02-map 底图核对一致（见「各批结果-R1」） | PASS |
| 每个 P 有 O 或不做条目 | 设计本体核对 | 映射总表 P2→O2、P9→O6、P5→O5、P1→O1、P3→O3、P4→O4；P6→N1、P7→N2、P8→N3、P10→N4、P5 架构面→N5、P4 跨文件→N6，P1-P10 无遗漏 | PASS |
| 每批独立可验证 | 命令 + 浏览器 | 各批验证组合复跑全过（见「各批结果」） | PASS |
| 最终验证组合全过 | 命令 + 浏览器 | 全批组合复跑 + API 冻结（`git diff src/components/table/ex/index.js` 为空；table-ex.vue 无改动，props/emits/defineExpose 零变化；scss 零改动）+ R1 重跑 | PASS |
| 每批附审查摘要 | 人工 | verify-<批>.md 未落盘（各批过程记录在 04-impl.md）；本报告顶部审查摘要覆盖全部六批 diff，用户可按其逐文件 `git diff` 审查 | 需人工（形态缺口，见「需人工检查」） |

## 各批结果

**B1（T1，O2 删转口）— PASS**
- 门禁 `node scripts/table-ex-structure-check.mjs` exit 0（46 文件零纯转发，index.js 豁免）。
- 残留扫描：`grep -rn "cellRectAt" src demo/src | grep import` → 仅 paint-utils 直引 4 处（use-table-api.js:16、self-checks spans.js:28、painter.js:26 + 定义 paint-utils.js:35），painter 转口消费 0。
- diff 等价审计：painter.js 仅删 3 行（空行 + 陈旧注释 + `export { cellRectAt } from './paint-utils.js'`）；3 消费方各 1-2 行 import 改写；self-checks 断言零触。
- API 冻结：`git diff src/components/table/ex/index.js` 为空。

**B2（T1，O6 ctx→deps）— PASS**
- 残留扫描：`grep -nE "\bctx\b" src/components/table/ex/geometry/row-geometry-controller.js` → 0 命中。
- diff 逐处配对：全部 `ctx.` → `deps.`、JSDoc `@param {Object} ctx`→`deps`、头注释同步；调用方 table-ex.vue 未改（传对象字面量按属性注入，不受参数名影响），`grep "ctx:" table-ex.vue` 0 命中。

**B3（T1，O5 注解 + 审计脚本）— PASS**
- `node scripts/table-ex-host-audit.mjs` exit 0，10 文件 host 键声明零缺失。
- 注解 diff：use-pointer.js @host-reads 增 `flatRows`；use-table-api.js 增 `canvasEl`；row-geometry.js 头注释补「含行高估高/精算算法（computeRowHeights/ensureRowMeasured）」。纯注释级，无可执行语义变化。

**B4（T2，O1 interactions 拆分）— PASS**
- 残留扫描：`grep -rn "interaction/interactions" src demo/src` → 0 命中；interactions.js 已删除（目录现存 cell-selection/click-resolve/edit-button/hit-test/resize-resolve/schedulers）。
- 符号面：13 导出原平移（hit-test 4：hitTest/resolveCursor/resolvePointerdown/resolveTooltipTarget；click-resolve 7：resolveOrderByNext/isCheckHeaderColumn/resolveHeaderClick/resolveCellClick/resolveTreeToggle/resolveItemClick/resolveCellClickOpen；resize-resolve 2：RESIZE_MIN_WIDTH/resolveResizeWidth），与 self-checks import 的 4+7+2 分布一致。
- 行数核对：184/218/18，均 ≤350。浅模块删除测试：三文件均承载实质判定逻辑（hitTest 命中检测链、click 分支决策、clamp 计算），非透传；文件头各写单一职责一句话（L2 陈旧自述消除）。
- 消费方改引：use-pointer.js:16-17（hit-test + click-resolve）、use-cell-click.js:19、use-column-resize.js:20、use-cell-tooltip.js:25、self-checks/interactions.js import 块拆 3 条（断言零改动，见 R4）。
- 探针基线（详见下节）：console 序列与 6 份基线逐字一致、自检 241/241。

**B5（T3，O3 描边链提取）— PASS（三校验点逐条）**
1. 「矩形链逐字同源」约束：三站点（paintHoverEditorStroke:147 / paintHoverPlainStroke:160 / paintCellSelection:180）统一调 `cellFrameOf(state, row, col)`（:99，regionAt→spanRectOf→editorRectOf(editorGridlineFlagsOf 8 字段)，与原三处内联逐 token 一致）；原 L139 注释约束语义由新单一事实源注释继承。
2. strokeRect 参数：现在全文件仅 strokeBodyFrame:134 一处，逐字 `ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1)`；withClip 裁剪矩形 `[clipX0, headHeight, stickyWidth-clipX0, stickyHeight-headHeight]` 与 clipX0 公式逐 token 与原三处一致。
3. 谓词互补保留原函数：paintHoverEditorStroke 早退 `!state.editable || !state.isCellEditableFn` + 列级可编辑判定（:140-146）；paintHoverPlainStroke `if (state.editable && state.isCellEditableFn && column && state.isCellEditableFn(column)) return`（:156-158）——均原位未改写。
- 行数核对：paint-overlay.js 提取后 290→约 258 行（<400 软线）；cellFrameOf/strokeBodyFrame 承载实质几何链非透传。

**B6（T3，O4 controller 同源收敛）— PASS（两校验点逐条）**
1. 内联锚定块 vs `syncAnchoredLayout`（:225-240）：删除块（computeAnchorShift 调用 → `if (shift) el.scrollTop += shift` → totalHeight → setLayout contentHeight/spacerHeight 同式）与函数体经 `geometry`→`variableGeometry` 别名归一后逐 token 相等；替换调用 `syncAnchoredLayout(cur, el, variableGeometry, anchorRow, prevTopAtAnchor)`（:421）与既有调用 ：279 同构，参数序一致。
2. `recordNumberOf(deps.getRecordsOffset(), row)`（:268）vs 原内联 `(ctx.getRecordsOffset() || 0) + row + 1`：cell-identity.js:14-16 函数体 `(recordsOffset || 0) + row + 1` 逐 token 相等（求值时机同为先取 offset 再入参）；import 已存在（:21）。
- 滚动路径由 B6 基线含滚动点位覆盖（见下），锚定补偿行为实测不变。

**探针基线复采比对（B4/B5/B6 同口径，基线只读未动）— PASS**

| 口径 | 复采结果 | 基线 |
|---|---|---|
| console 警告/错误原文序列（归一：<TS>/<L>） | 两次全新加载 IDENTICAL，与 B4/B5/B6 全部 6 份 console-*.norm 逐字一致（45 messages：1 error + 43 warning） | 6/6 一致 |
| 自检断言输出 | 两次全新加载均 `自检结果（241/241 通过）`，241 条断言主体文本全同；差异仅 3 行（capture-1 vs B4）/5 行（vs B5/B6 归一文件），全部落在基线 README 列明的字体度量时序漂移模式（L15 LRU measure 计数、L138 CJK 锚 font/y 恒、L165 iconfont 墨迹、L83/L190 <PX> 类） | 判定口径满足 |
| 滚动点位（B6） | scrollTop 0→300 后 400ms=300、600ms=300（锚定补偿未回写）；scrollHeight=3600206；canvas 956×416；clientHeight 416；滚动后 canvas dataURL 长度=62458（与基线参考值精确相等）；滚动后自检 241/241；scrollconsole 与 B6 两份基线逐字一致且滚动零新增消息 | 全部逐值一致 |
| build 构建序 | 与 6 份基线 chunk 名/顺序全同，仅体积数字 + B4 模块数 332→334（拆分净 +2，预期） | 非语义漂移 |

**自检重跑（「重跑自检」按钮）补充记录**：同页会话内重跑得 240/241，失败项 `[cell-painters] icon 列…非 string dev warn 一次`。根因静态证据：`src/utils/warn.js:4-15` `warned = new Set()` + `once = true` 默认去重，同进程二次运行不再触发 `实际类型 number` 警告（column-types/icon.js:53、self-checks/cell-painters.js:2283-2302 均未修改）——属知识库已记载的重跑工件类（INDEX-table：table-ex-counter-assert-warm-cache），非本次重构引入，不在冻结口径（全新加载双采）内。断言与源码均未改写即通过首采比对，不触发「行为变化即停」。

**R1 复测重跑 — PASS**
- 信号清零：两脚本 exit 0（输出同上）；re-export 扫描仅 index.js:1-2 公共入口豁免项。
- 两问验收（本实例全新上下文，grep-only，未读实现正文）：

| 问 | 定位 | 与底图核对 |
|---|---|---|
| 表头点击排序判定在哪 | 决策 `resolveOrderByNext`/`resolveHeaderClick` → `interaction/click-resolve.js:17,56`；编排 `use-cell-click.js:19,43` | 一致（B4 后位置，设计核验记录 §7 预期命中） |
| 调宽下限在哪 | `RESIZE_MIN_WIDTH` → `resize-resolve.js:7`；消费 `use-column-resize.js:20,83` | 一致 |
| hover 描边几何在哪 | `paint-overlay.js` cellFrameOf:99 / strokeBodyFrame:123 + 三描边函数 | 一致（§4.1 描边链，B5 后单一事实源） |
| rec_no 序号计算在哪 | `recordNumberOf` → `shared/cell-identity.js:14` 单一事实源；src 消费 6 文件 | 一致（§5.1） |
| tooltip 门控在哪 | 决策 `resolveTooltipTarget` → `hit-test.js:178`；编排 `use-cell-tooltip.js:25,59` | 一致（§4.2） |
| 改 resolveResizeWidth 影响谁 | src 唯一代码消费 `use-column-resize.js`（layout.js:39 为注释，辨伪排除）+ self-checks/interactions.js | 一致 |
| 改 editorGridlineFlagsOf 影响谁 | src：editor.js、paint-overlay.js（定义 editor-geometry.js）+ self-checks editor/spans | 一致（§3） |
| 改 recordNumberOf 影响谁 | src 6 消费方（use-cell-click/use-cell-tooltip/cell-selection/spans-method/paint-body/row-geometry-controller） | 一致 |
| 改 syncAnchoredLayout 影响谁 | 仅 controller.js 文件内（定义 ：225、调用 ：279/:421），无外部消费方 | 一致（B6 后调用点 1→2 仍文件内） |
| 改 hitTest 影响谁 | src 仅 `use-pointer.js:16,41` 代码引用；click-resolve/edit-button/hit-test 命中均为 JSDoc 注释（辨伪排除） | 一致（§4.2） |

**R4 核对 — PASS**：self-checks 三个改动文件的 diff 逐行审查——painter.js（1 行 import 拆 2 行）、spans.js（import 路径改写 1 行）、interactions.js（import 块 13 符号拆 3 条 import），断言本体零改动；baseline/ 目录无改动（冻结）。全程未修改任何自检断言与基线文件。

**demo DOM 断言（playwright mcp，DOM 优先）— PASS**
- canvas 存在（956×416）；行渲染证据：scrollHeight=3600206 + canvas dataURL 与基线精确一致 + 单元格命中有效。
- 事件链：合成 pointer/click（项目约定口径）→ 事件日志新增 `cell-click {"record":"#1","recordIndex":0,"column":"name"}`、`update:selected-record`、`header-click {"column":"name"}`、`update:order-by "name:asc"`——点击/选中/排序链路 intact。
- 交互后自检仍 241/241。

## 失败项

无。

## 环境阻塞

无。demo 服务已在运行（http://localhost:3000/ 与 /data/table-ex/ 均 200，非本验证启动，未做启停管理）；eslint v8.57.0、node v24 可用；playwright mcp 可用。

## UNVERIFIED

无。

## 需人工检查

1. **视觉等价走查（可选）**：hover 描边/选中描边 1px 观感。已有强等价证据（滚动后 canvas dataURL 长度 62458 与基线精确相等 + console/自检全同）；如需最终确认：访问 http://localhost:3000/data/table-ex/，hover 可编辑格（蓝）/不可编辑格（灰）/选中格，观察描边位置与粗细。
2. **各批审查摘要落盘形态**：设计测试计划要求各批 `verify-<批>.md` 附审查摘要，任务目录中未落盘该组文件（各批过程记录在 04-impl.md，本角色按派发未读取）。用户审查以本报告顶部审查摘要 + `git diff` 工作区比对替代；如需按批留档，可从 04-impl.md 补导出或要求补充派发。

## 范围核对

git 实际改动（`git status --short` + `git diff --stat`）⊆ 02-design.md「改动清单」，无设计外改动：
- M/D 源码 13 文件 + 新增 3 interaction 文件：全部在改动清单内，批次归属一致。
- scripts/ 目录恰含 2 文件（structure-check / host-audit），均在清单内。
- 基线脏文件排除（00-task 基线快照已有，非本任务产生）：`todo/misc.md`、`agent-docs/knowledge/project/table-ex-performance-profiling.md`。
- 基线未跟踪文档排除：agent-docs/plans/*（含本任务目录）、`table-ex-structure-refactor-summary.md`。
- 无法区分：无（todo/misc.md 仅基线脏、不在改动清单，按基线排除规则不计）。
- API 冻结：`git diff src/components/table/ex/index.js` 为空；table-ex.vue、全部 .scss 无改动。

## 验证产物清单（evidence/）

- `build-verify-1.txt` — npm run build 完整输出（exit 0）
- `console-verify-1.txt` / `console-verify-2.txt` — 两次全新加载控制台 warning+error 序列
- `selfcheck-verify-1.json` / `selfcheck-verify-2.json` — 两次全新加载 241 条断言文本 + summary
- `scrollconsole-verify-1.txt` — 滚动后控制台序列
- 滚动点位数值见本报告「探针基线复采比对」节（playwright evaluate 返回值）

## 验收入口

1. 信号清零（code-reforge 判据 / S1/S2/S3）：`node scripts/table-ex-structure-check.mjs && node scripts/table-ex-host-audit.mjs` → 两行 OK，退出码 0。
2. API 冻结：`git diff src/components/table/ex/index.js src/components/table/ex/table-ex.vue` → 输出为空。
3. 构建：`npm run build` → 退出码 0。
4. 行为不变（自检双安全网）：demo watch 服务运行时访问 `http://localhost:3000/data/table-ex/` → 页面显示「自检结果（241/241 通过）」；滚动表格后再看仍 241/241；点击单元格/表头，事件日志出现 cell-click / header-click / update:order-by。
5. B4 拆分清零：`grep -rn "interaction/interactions" src demo/src` → 无输出。
