# table-ex 结构重构设计（02-design.md）

> 设计基准：HEAD `ee16eb4`（2026-11-07），src/ 干净。所有行号快照以此为准。
> 流程：code-reforge 完整通道步骤 3 产物；步骤 4（design-amender 核验修订）后经用户确认门才实施。
> 上游：02-map.md（结构底图）、02-problems.md（P1–P10）。

## 方案概述

6 个优化项 + 6 条不做条目，7 个独立可验证批次（B1–B6 + 复测），全部行为不变：

- **T1 机制批（B1→B2→B3）**：删 painter.js 尾部 cellRectAt 转口并直引（S1）；row-geometry-controller 参数 `ctx`→`deps` 消歧（S6）；@host-* 注解补 2 缺口 + 交付 S1 门禁与 @host 审计两个脚本（S2/S3 完成判据闭合）。
- **复测 R1**：信号清零脚本执行 + 两问验收（全新上下文 agent 仅凭静态手段答"在哪/影响谁"）。
- **T2/T3 批**：interactions.js 按域拆为 hit-test / click-resolve / resize-resolve 三文件（S7 主问题）；paint-overlay 描边链三站点提取单一事实源（S4）；row-geometry-controller 两处同源残留收敛（S4）。
- 不改公共 API（table-ex.vue 的 props/emits/defineExpose 零变化）、不改 scss、不安装依赖、不 commit（decisions.md 约束；批次仍按独立可验证切分）。
- 每批验证组合含：`npm run build` + 全局 eslint（口径限本批文件，批前采集基线增量比对）+ demo 页自检双安全网与 DOM 断言 + 残留扫描；T2/T3 批加探针基线（警告原文序列/构建序逐字比对，按项目冻结口径，探针交付前删除）。

## 遵循约定与复用

- 探针基线口径：知识库《table-ex 重构行为冻结：探针基线逐字比对》（agent-docs/knowledge/project/table-ex-refactor-frozen-probe.md）——警告原文序列 + 构建序逐字比对 + 自检双安全网；探针交付前删除。
- ex/ 文件移动/删除须同步 self-checks import（INDEX-table：canvas-pixel-assert-anchor-drift）；自检断言只读冻结，仅允许改 import 行。
- 改名词汇对齐上轮（host / spanCtx / deps）；@host-* 注解单行前缀约定已存续于 10 个 composables 文件头。
- 复用既有单一事实源：`shared/cell-identity.js`（recordNumberOf）、`row-geometry-controller.js` 内 `syncAnchoredLayout`（O4 只改调用，不新建定义）。
- eslint：全局 v8.57.0（`/d/npm/global/eslint`，实测可用）；stylelint v17.8.0 全局可用（本设计不动 scss，备用）。

## 优化项（O1–O6）

映射总表（每个 P 均有 O 或不做条目，见「不做清单」）：

| P | 信号 | 优化项 | 手段 | 类型 | 批次 |
|---|---|---|---|---|---|
| P2 | S1 | O2 删转口直引 + S1 门禁脚本 | 删转口、消费方直引 | T1 | B1 |
| P9 | S6 | O6 controller ctx→deps | 领域词消歧改名 | T1 | B2 |
| P5 | S2/S3 | O5 注解补全 + @host 审计脚本 | 注解 + 审计脚本 | T1 | B3 |
| P1 | S7 | O1 interactions 按域拆分 | 目录/文件按域拆分 | T2 | B4 |
| P3 | S4 | O3 描边链提取单一事实源 | 重复合并 | T3 | B5 |
| P4 | S4 | O4 controller 同源收敛 | 重复合并（复用既有定义） | T3 | B6 |

### O2（P2，S1）删 painter.js 转口，消费方直引 —— 批 B1（T1）

- 改动：`table-paint/painter.js` 删 L417-418（陈旧注释 + `export { cellRectAt } from './paint-utils.js'`）；3 个转口消费方改从 `paint-utils` 直引。
- 涉及文件（4）：`src/components/table/ex/table-paint/painter.js`、`src/components/table/ex/composables/use-table-api.js:16`、`demo/src/data/table-ex/self-checks/painter.js:25`、`demo/src/data/table-ex/self-checks/spans.js:28`（后两者仅拆 import 行，`drawRegion/createPainter` 仍从 painter 引，**禁触断言**）。
- 消费方清单（复核命令）：`grep -rn "cellRectAt" src demo/src --include="*.js" --include="*.vue" | grep import` → 实施时应恰好命中上述 3 处 import 行 + `painter.js:418` 转口行。
- 附带交付：S1 门禁脚本 `scripts/table-ex-structure-check.mjs`（新文件，node 零依赖）：扫描 `src/components/table/ex/**`（排除 `index.js` 公共入口豁免）中 `export … from` 纯转发形态，命中输出清单并退出码 1；零命中输出报告退出码 0。规格满足 means.md（输入/检查项/输出/退出码）。
- 豁免表达定稿（原未解问题 2）：脚本内置硬编码豁免名单 `const PUBLIC_ENTRIES = new Set(['index.js'])`（相对 ex/ 根，附注释"包对外公共入口，lang-js.md S1 生态豁免"）；不改 index.js 本身——保 API 冻结口径 `git diff src/components/table/ex/index.js` 恒为空。不采用文件头标记方案（需改 index.js，与 API 冻结自相矛盾）。
- 行号快照（ee16eb4）：painter.js:417-418；use-table-api.js:16；self-checks/painter.js:25；self-checks/spans.js:28。
- 风险：低（纯 import 改写）；验证：T1 组合（见批次计划）+ 公共入口 API 冻结（ex/index.js 不动，`git diff src/components/table/ex/index.js` 为空）。

### O6（P9，S6）createRowGeometryController 参数 ctx→deps —— 批 B2（T1）

- 改动：`geometry/row-geometry-controller.js` 文件内 `ctx` 标识符（含 L33 JSDoc `@param {Object} ctx`）全部改 `deps`；调用方 `table-ex.vue:337-355` 传对象字面量按位置/属性注入，**不受参数名影响，无需改动**（复核：`grep -n "ctx:" src/components/table/ex/table-ex.vue` → 0 命中，字面量键为 getter 名）。
- 涉及文件（1）：`src/components/table/ex/geometry/row-geometry-controller.js`（ctx 出现约 30 处，L45 定义起）。
- 消费方清单：`grep -rn "createRowGeometryController" src demo/src` → `table-ex.vue:77,337` + `demo/src/data/table-ex/self-checks/row-geometry-controller.js`（后者传字面量，不受影响，不改）。其文件头注释 `row-geometry-controller.js:4`"以假 ctx 直驱断言"及 self-checks 内 ctx 字样不在 B2 清零范围（自检只读冻结，仅允许改 import 行）；B2 残留扫描命令限 controller.js 本体，两口径不冲突。
- 行号快照：controller.js:45（签名）、:33（JSDoc）、:75-353（ctx. 使用面）。
- 风险：低；验证：T1 组合 + 残留扫描 `grep -n "\bctx\b" src/components/table/ex/geometry/row-geometry-controller.js` → 0。

### O5（P5，S2/S3）注解补全 + @host 审计脚本 —— 批 B3（T1）

- 改动：
  - `composables/use-pointer.js` @host-reads（L7-9）补 `flatRows`（使用点 L234）。
  - `composables/use-table-api.js` @host-reads（L7-8）补 `canvasEl`（使用点 L108）。
  - 附带（P6 缓解，纯注释）：`geometry/row-geometry.js:1-2` 文件头补一句"含行高估高/精算算法（computeRowHeights/ensureRowMeasured）"，消除头述失配。
- 附带交付：`scripts/table-ex-host-audit.mjs`（新文件，node 零依赖）：解析 `src/components/table/ex/composables/*.js` 文件头 @host-reads/writes/calls 声明与 `host.<键>` 实际使用，输出未声明键清单，缺失非零退出。本任务临时脚本 `tmp-audit.cjs` 的解析逻辑（多行续行、全角括号剥离、点键前缀匹配）为脚本蓝本。
- 涉及文件（3 + 1 脚本）：use-pointer.js、use-table-api.js、row-geometry.js、scripts/table-ex-host-audit.mjs。
- 消费方清单：无（注释级改动）。
- 行号快照：use-pointer.js:7-9,234；use-table-api.js:7-8,108；row-geometry.js:1-2。
- 风险：极低；验证：T1 组合 + 审计脚本执行退出码 0。

### O1（P1，S7）interactions.js 按域拆三文件 —— 批 B4（T2）

- 拆分方案（新文件均过浅模块删除测试：各自承载实质判定逻辑非透传）：

| 新文件 | 导出（自 interactions.js 平移） | 私有随迁 | 预计行数 |
|---|---|---|---|
| `interaction/hit-test.js` | hitTest、resolveCursor、resolvePointerdown、resolveTooltipTarget | contentRightEdgeX、isTreeArrowSlot、isSortableHeader、isEditableCell、isBodyCellHit、isEditingCell | ~230 |
| `interaction/click-resolve.js` | resolveOrderByNext、isCheckHeaderColumn、resolveHeaderClick、resolveCellClick、resolveTreeToggle、resolveItemClick、resolveCellClickOpen | isItemClickable、isItemRectHit、findHitItem（isTreeArrowSlot 自 hit-test import） | ~190 |
| `interaction/resize-resolve.js` | resolveResizeWidth、RESIZE_MIN_WIDTH | — | ~25 |

- `interaction/interactions.js` 删除；三个新文件头重写（消除 L2 陈旧"两个工厂"自述，各写单一职责一句话）。
- 涉及文件（9）：新建 3 + 删 1 + 消费方改引 4（`composables/use-pointer.js:16`、`use-cell-click.js:19`、`use-column-resize.js:20`、`use-cell-tooltip.js:25`）+ `demo/src/data/table-ex/self-checks/interactions.js:20-34`（13 符号 import 块拆为 3 条 import，断言不动）。
- 消费方清单（复核命令）：`grep -rln "interaction/interactions" src demo/src --include="*.js" --include="*.vue"` → 实施时应恰好命中上述 5 文件，改后复跑 → 0 命中。
- 行号快照（ee16eb4）：interactions.js 全文件 1-407（删除基准）；消费方 import 行见上。
- 风险：中（整块平移 + import 改写；符号零增删零改名 → `grep` 残留扫描可机械清零）；验证：T2 组合（探针基线 + 行数与浅模块核对 + API 冻结）。

### O3（P3，S4）paint-overlay 描边链提取 —— 批 B5（T3）

- 改动：`table-paint/paint-overlay.js` 文件内新增局部函数 2 个：
  - `cellFrameOf(state, row, col)`：封装 `regionAt → spanRectOf → editorRectOf(editorGridlineFlagsOf({…8 字段}))` 矩形链（现 L106-119 / L146-159 / L190-203 三处逐字重复）。
  - `strokeBodyFrame(ctx, state, col, rect, strokeStyle)`：封装 clipX0 计算 + `withClip` 表体区裁剪 + `strokeRect` 描边块（现 L126-134 / L162-170 / L210-217 三处）。
  - 三个调用点（paintHoverEditorStroke L98 / paintHoverPlainStroke L140 / paintCellSelection L178）改为调用上述函数；**三个函数本体与互补谓词保留原位不改写**（L139 注释约束）。
- 涉及文件（1）：`src/components/table/ex/table-paint/paint-overlay.js`。
- 消费方清单：无新消费方；paintOverlay 调用方 painter.js:20 不变。
- 行号快照：paint-overlay.js:98-135, 140-172, 178-219（三站点）；:4 import 行不变。
- 风险：中（等价性靠校验点 + 基线）；等价性校验点：① L139"矩形链逐字同源"注释约束；② 三处 strokeRect 参数 `rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1` 逐字一致；③ 谓词互补（可编辑蓝描边 / 不可编辑灰描边恒不同时触发）提取后仍由原函数判定。
- 验证：T3 组合（探针基线 + 等价性校验点核对）。

### O4（P4，S4）row-geometry-controller 同源收敛 —— 批 B6（T3）

- 改动（同文件两站点，同一 S4 信号命中主文件，复用既有单一事实源，不新建定义）：
  - L421-434（remeasureVisibleRows 尾部内联锚定块）改调同文件 `syncAnchoredLayout(cur, el, variableGeometry, anchorRow, prevTopAtAnchor)`（L225-240，除 geometry/variableGeometry 别名外逐 token 相等）。
  - L268 `recordNumber: (ctx.getRecordsOffset() || 0) + row + 1`（B2 后为 deps）改 `recordNumberOf(deps.getRecordsOffset(), row)`（import 已存在于 L21）。
- 涉及文件（1）：`src/components/table/ex/geometry/row-geometry-controller.js`。
- 消费方清单：无（函数内改动；controller 消费方见 O6）。
- 行号快照：controller.js:225-240（既有定义）、:268、:421-434。
- 风险：低-中（锚定块替换触及滚动行为路径，由基线覆盖）；等价性校验点：① 内联块与 syncAnchoredLayout 逐 token 相等（别名归一后）；② recordNumberOf 函数体与内联式逐 token 相等（cell-identity.js:14-16 注释约束"原 10 处收敛至此"）。
- 验证：T3 组合。

## 不做清单（与优化清单同权重；均经用户确认门确认）

| # | 条目 | 理由类型 | 理由 | 重评触发条件 |
|---|---|---|---|---|
| N1 | P6：row-geometry.js 拆分（几何工厂 × 行高估算） | 收益成本倒挂 | 估算域符号 src 生产代码唯一消费方是 controller.js:13-20 的 import 块（核验补记：demo self-checks/row-geometry.js:18-24 亦 import computeRowHeights/ensureRowMeasured——拆分将新增 self-checks import 同步点，进一步支持不拆）；头失配已由 B3 一行头注释消除；单会话实施预算（n≤2 轮）优先 P1-P5 | 文件 >500 行；src 出现第二消费方（self-checks 不算）；行高逻辑再成改动热点 |
| N2 | P7：S8 参数收敛专项批次 | 收益成本倒挂 | means.md S8 规则：不开专项批次（未引发实际缺陷），接触调用点时顺带 | 参数错位引发实际缺陷；触碰对应调用点的功能任务顺带执行 |
| N3 | P8：table-ex.vue(474) / row-geometry-controller(465) / painter(418) / item-painters(412) 四文件保留 400-600 行 | 收益为零或负 | 均单职责/高内聚（壳 12 步组装、状态机闭包、绘制管线、条目单域）；强拆产生浅模块或切断 R6 主流程顺读；S7 软线判据（多职责）不满足 | 任一文件 >600 行（硬线无条件入围）；出现互不消费符号组 |
| N4 | P10：editor-geometry.js 移出 editing/ 目录 | 收益成本倒挂 | S5 失真模式（重闭包反向边）已消除，模块仅依赖 constants；搬移属目录美学，T2 成本 + 6 个 import 点扰动（3 src + 3 self-checks） | editor-geometry 出现 editor 状态依赖；新增第 4 个跨层消费方 |
| N5 | host 袋 / paintState 架构重造 | 收益成本倒挂 | S2/S3 已由 @host-* 注解 + 审计脚本显式化（B3 闭合），重造注入机制超出"检索效率"目标（沿袭上轮决策） | host 键 >60；注解审计长期失效 |
| N6 | 锚定补偿跨文件三变体统一（use-tree-rows:141-173 / use-table-instances:36-63 / controller） | 证据不足不提取 | S4 双证据不满足：三变体锚定捕获策略各异（record 锚/row 锚/行号锚），非逐字同源、无注释自认；语义合并属高风险行为等价提取 | 任一变体引发缺陷；出现第 4 处复制 |

## 批次计划与状态

次序按 means.md：T1 先于 T2/T3/T4；T1 内部 S1→S6→S2/S3；全部 T1 完成后复测 R1；S5 批不存在，R1 即 S7 开工前复测；T2/T3 按收益排位（S7 主问题 → S4 热点 → S4 小站点）。

| 批 | 类型 | 内容 | 文件数 | 状态 |
|---|---|---|---|---|
| B1 | T1 | O2 删转口直引 + S1 门禁脚本 | 4+1 | 完成 |
| B2 | T1 | O6 ctx→deps | 1 | 完成 |
| B3 | T1 | O5 注解补全 + 审计脚本（+row-geometry 头注释） | 3+1 | 完成 |
| R1 | 复测 | 信号清零 + 两问验收（见下） | — | 完成（2026-11-07） |
| B4 | T2 | O1 interactions 按域拆分 | 9 | 完成 |
| B5 | T3 | O3 描边链提取 | 1 | 完成 |
| B6 | T3 | O4 controller 同源收敛 | 1 | 完成 |
| 终验 | — | 全量组合 + map.md 现状导航改写（另行派发，见 00-task 收尾项） | — | 待执行 |

### 每批验证组合（追加约束：含探针基线口径 + 可执行命令）

通用命令（每批必跑，批前采集对照、批后同口径复跑）：
1. `npm run build`（dev+prod ×2 通道）
2. eslint（全局 v8.57.0，实测可用）：`eslint src/components/table/ex demo/src/data/table-ex --ext .js,.vue`——批前采集输出基线，批后增量差异须为 0（不引入新违规；存量违规不属本任务修复范围）
3. demo 自检双安全网 + DOM 断言（playwright mcp，DOM 优先）：访问 `http://localhost:3000/data/table-ex/`（404 则 `/data/table-ex/` 前缀口径按 00-task），断言自检结果面板全部通过（runChecks 逐条结果）与关键 DOM（canvas 存在、行渲染、事件日志）
4. 残留扫描（各批专项 grep，见 O 项；含未跟踪新文件，用裸 grep 不用 git grep）

分型组合（verification.md 充分组合）：
- **B1/B2/B3（T1）**：build + 自检双安全网（只读冻结）+ 残留扫描 + diff 等价审计（逐行配对）+ API 冻结（`git diff src/components/table/ex/index.js src/components/table/ex/table-ex.vue` 于 B1–B6 全批恒为空——六个批次均不触及这两文件）+ 本批交付脚本执行退出码 0（B1 门禁、B3 审计）。
- **B4（T2）**：T1 组合 + **探针基线**（改码前采集落盘 `baseline/B4/`：demo 控制台警告/错误原文序列 + `npm run build` 构建序 + 自检断言输出，同口径连采两次剔除时间戳类漂移后 diff 为空；改码后同口径复采逐字比对）+ 行数与浅模块核对（新文件 ≤350 行目标、删除测试）。
- **B5/B6（T3）**：T1 组合 + 探针基线（同 B4 口径，落盘 `baseline/B5/`、`baseline/B6/`）+ 行数与浅模块核对（无新文件：核对提取后单文件行数不超 400 软线、cellFrameOf/strokeBodyFrame 承载实质逻辑非透传）+ 等价性校验点核对（O3 三校验点 / O4 两校验点逐条核对并记录）。与 verification.md T3 = T2 组合 + 等价性校验点核对对齐。
- **R1 复测**：① 信号清零：`node scripts/table-ex-structure-check.mjs`、`node scripts/table-ex-host-audit.mjs` 退出码 0 + `grep -rn "export \*\|export {.*} from" src/components/table/ex --include="*.js"` 仅剩 index.js 豁免项；② 两问验收：取 3-5 功能点（如"表头点击排序判定在哪""调宽下限在哪""hover 描边几何在哪""rec_no 序号计算在哪""tooltip 门控在哪"）+ 3-5 改动点（如"改 resolveResizeWidth 影响谁""改 editorGridlineFlagsOf 影响谁"），由全新上下文 agent 仅凭 02-map.md 登记的静态手段回答并与底图核对；结果记入本文件复测记录节。
- **终验**：全批组合复跑 + API 冻结（props/emits/defineExpose git diff 复核）+ 复测 R1 重跑；通过后按 00-task 收尾项另行派发改写 02-map.md 为现状导航 + 同步知识库。

探针口径引用：agent-docs/knowledge/project/table-ex-refactor-frozen-probe.md（探针交付前删除）；基线连采两次与漂移剔除按 verification.md 基线程序。

## 基线豁免记录（R4）

| 批 | 豁免 | 理由 | diff 配对范围 |
|---|---|---|---|
| B1 | 豁免探针基线（保留自检双安全网） | 纯 T1 import 改写；R4 三触点逐一静态排除：无动态 import()/动态键名（cellRectAt 为静态标识符）、painter.js 无顶层副作用（仅函数定义）、无跨边界字符串契约 | painter.js 删 2 行（注释+转发）；3 个消费方各 1 行 import 改写；新增门禁脚本不参与配对 |
| B2 | 豁免 | 纯 T1 文件内标识符改名；getter 均静态成员表达式；无顶层副作用；无字符串契约 | controller.js 内 `ctx`→`deps` 逐处替换（~30 处），diff 逐行配对 |
| B3 | 豁免 | 纯 T1 注释级改动 + 新增审计脚本；不触任何可执行语义 | 3 文件各注释 1-2 行增改；脚本不参与配对 |
| B4/B5/B6 | 不豁免 | T2/T3 强制 | 见批次计划 |

## 改动清单

| 文件 | 改动 | 批次 | 原因 |
|---|---|---|---|
| src/components/table/ex/table-paint/painter.js | 删 L417-418 转口与陈旧注释 | B1 | O2/P2 |
| src/components/table/ex/composables/use-table-api.js | L16 改引 paint-utils | B1 | O2 |
| demo/src/data/table-ex/self-checks/painter.js | L25 import 拆行 | B1 | O2 |
| demo/src/data/table-ex/self-checks/spans.js | L28 import 拆行 | B1 | O2 |
| scripts/table-ex-structure-check.mjs | 新建（S1 门禁） | B1 | O2 附带交付 |
| src/components/table/ex/geometry/row-geometry-controller.js | ctx→deps（B2）；L268 recordNumberOf、L421-434 syncAnchoredLayout 收敛（B6） | B2,B6 | O6/P9，O4/P4 |
| src/components/table/ex/composables/use-pointer.js | @host-reads 补 flatRows | B3 | O5/P5 |
| src/components/table/ex/composables/use-table-api.js | @host-reads 补 canvasEl | B3 | O5/P5 |
| src/components/table/ex/geometry/row-geometry.js | L1-2 头注释补估高/精算职责 | B3 | P6 缓解（N1 附属） |
| scripts/table-ex-host-audit.mjs | 新建（@host 审计） | B3 | O5 附带交付 |
| src/components/table/ex/interaction/interactions.js | 删除（407 行） | B4 | O1/P1 |
| src/components/table/ex/interaction/hit-test.js | 新建（~230 行，符号平移） | B4 | O1 |
| src/components/table/ex/interaction/click-resolve.js | 新建（~190 行，符号平移） | B4 | O1 |
| src/components/table/ex/interaction/resize-resolve.js | 新建（~25 行，符号平移） | B4 | O1 |
| src/components/table/ex/composables/use-pointer.js | L16 改引 hit-test/click-resolve | B4 | O1 |
| src/components/table/ex/composables/use-cell-click.js | L19 改引 click-resolve | B4 | O1 |
| src/components/table/ex/composables/use-column-resize.js | L20 改引 resize-resolve | B4 | O1 |
| src/components/table/ex/composables/use-cell-tooltip.js | L25 改引 hit-test | B4 | O1 |
| demo/src/data/table-ex/self-checks/interactions.js | L20-34 import 块拆 3 条 | B4 | O1 |
| src/components/table/ex/table-paint/paint-overlay.js | 提取 cellFrameOf/strokeBodyFrame，三站点改调 | B5 | O3/P3 |

测试文件改动：仅 self-checks 两个文件的 import 行（B1）与一个文件的 import 块（B4），断言零修改。

## 接口 / 数据结构

- 公共 API 零变化：`src/components/table/ex/index.js`（default + MuTableEx）、table-ex.vue props/emits/defineExpose 不动。
- 模块导出签名零变化：B4 为符号平移（13 导出原名原参迁入 3 新文件）；B1 后 `painter.js` 导出面 = draw/drawRegion/createPainter（减 cellRectAt 转发）；`paint-utils.js` 导出面不变。
- 新增脚本接口：`node scripts/table-ex-structure-check.mjs` / `node scripts/table-ex-host-audit.mjs`（无参数，固定扫描范围，退出码 0/1）。
- 新增局部函数（B5，文件内私有）：`cellFrameOf(state, row, col) → rect`、`strokeBodyFrame(ctx, state, col, rect, strokeStyle) → void`（签名仅示意，实施时以等价提取为准）。

## 被拒绝的备选

1. interactions 拆分粒度 2 框（决策 vs 命中）或 6 框（每域一文件）：2 框仍混 5 域检索噪声；6 框产生单函数浅文件（resolveTooltipTarget 独立文件不过浅模块删除测试）。3 框与 4 个 src 消费方取用面一一对应（O1）。
2. P2 备选"保留转口 + 修正 L417 注释"：S1 完成判据要求内部聚合零纯转发并固化门禁；转口是 A 类失真源本体，修注释不消失真。
3. P3 备选"三描边函数合并为单参数化函数"：paint-overlay.js:139 注释明示谓词严格互补勿改写；合并将互补不变量改为参数传入属行为面改动，违反行为冻结。仅提取形状重复的几何链与描边块。
4. B2 备选"controller ctx 改名 host"：与 table-ex.vue 的 host 袋同名异指（controller 收的是 getter 视图非 host 本体），引入新同形异义；选 `deps` 对齐上轮词汇。

## 风险与回滚

- 全部批次为**双向门**（行为冻结验证下可按文件级回滚；不改公共 API、不改数据格式/事件契约，无单向门）。回滚方式（无 commit 约束下）：每批实施前 `git status --short` 快照落盘 verify-<批>.md；回滚 = `git checkout -- <本批文件>` + 删除本批新建文件（scripts/、interaction/ 新文件），B4 回滚额外恢复 interactions.js。
- 爆炸半径：最大批 B4 触及 9 文件（4 src + 3 新 + 1 删 + 1 self-check），全部为 import 改写与整块平移，符号零增删；B5/B6 单文件。
- 主要风险点：① B4 self-checks import 拆行误触断言（对策：断言只读冻结 + diff 审查只看 import 区块）；② B5 描边提取改变绘制时序（对策：仅提取纯计算与 stroke 调用，withClip 嵌套层次不变 + 基线像素/警告序列比对）；③ B6 锚定块替换触及滚动路径（对策：token 相等校验点 + 基线含滚动交互点位——demo 页滚动后自检与 DOM 断言）。
- 行为变化即停（R4）：任何一批需改自检断言或基线才可过检 → 立即停批回滚，移入不做清单或交用户裁决。

## 测试计划（验收标准 → 批次 → 手段）

| 验收标准 | 归属 | 手段 | 检查方式 |
|---|---|---|---|
| code-reforge 判据：静态可答"功能在哪/改这里影响谁" | R1 复测 + 终验 | `命令` + 人工核对 | 两问验收：3-5 功能点 + 3-5 改动点，全新上下文 agent 仅凭静态手段作答，与 02-map.md 底图核对全对 |
| 每个 P 有 O 或不做条目 | 设计本体 | 人工 | 映射总表 + 不做清单 N1-N6 逐条覆盖 P1-P10（P8→N3、P6→N1、P7→N2、P10→N4，P5 架构面→N5、P4 跨文件变体→N6） |
| 每批独立可提交、可验证 | B1-B6 | `命令` + `浏览器` | 各批验证组合全过（见批次计划节）；组合内命令逐条留存输出至 verify-<批>.md |
| 最终验证组合全过 | 终验 | `命令` + `浏览器` | 全批组合复跑 + API 冻结 git diff + R1 复测重跑 |
| 每批附审查摘要，用户可按摘要审查 diff | B1-B6 | 人工 | verify-<批>.md 顶部审查摘要（改了什么/为什么/先看哪些文件/已验证项/需人判断的点）；无 commit 下以 `git diff` 工作区比对替代 commit diff 审查 |

## 实施步骤

（有序；每步 = 编号 + 完成判据 + 文件集合 + 依赖。无切片：纵向共享验证基建（基线/自检/脚本），各批即最小独立可验证单元。）

| # | 步骤 | 完成判据（可独立验证） | 文件集合 | 依赖 |
|---|---|---|---|---|
| 1 | B1 批前检查（复核 O2 消费方 grep 恰 3+1 处、git status 快照、eslint/build 批前基线）→ 实施 O2 → 验证 | 门禁脚本退出码 0；`grep -rn "cellRectAt" src demo/src` 无 painter 转口消费；build + 自检双安全网过；diff 等价配对完成 | B1 五文件 | 无 |
| 2 | B2 批前检查 → 实施 O6 → 验证 | `grep -n "\bctx\b" row-geometry-controller.js` → 0；build + 自检过；diff 配对 | controller.js | 1（顺序按 means S1→S6；无代码依赖） |
| 3 | B3 批前检查 → 实施 O5 → 验证 | 审计脚本退出码 0（10 文件零缺失）；build + 自检过 | B3 四文件 | 2 |
| 4 | R1 复测 | 信号清零两脚本退出码 0 + 两问验收全对，结果记入复测记录节 | — | 1,2,3 |
| 5 | B4 批前检查（基线采集落盘 baseline/B4/ + 消费方 grep 复核 5 文件）→ 实施 O1 → 验证 | `grep -rln "interaction/interactions" src demo/src` → 0；基线逐字比对一致；新文件 ≤350 行且过删除测试；build + 自检过 | B4 九文件 | 4 |
| 6 | B5 批前基线 → 实施 O3 → 验证 | 三校验点核对记录在案；基线逐字比对一致；build + 自检过 | paint-overlay.js | 4（与 5 无代码依赖，按收益排位后行） |
| 7 | B6 批前基线 → 实施 O4 → 验证 | 两校验点核对记录；基线逐字比对一致（含滚动点位）；build + 自检过 | controller.js | 4 |
| 8 | 终验 | 全批组合复跑 + API 冻结 + R1 重跑全过；verify-*.md 齐备审查摘要 | — | 5,6,7 |

实施约束（每批任务简报必含）：批 ID、范围文件、改动类型、避让区（本任务 src/ 干净，无需行级避让）、静态手段清单与优先级（ast-grep 不可用，S1/S6 不降级）、基线路径与口径（或 R4 豁免记录指针）、验证命令、退出条件；不执行 git commit（decisions.md）。

## 设计核验记录

> design-amender（步骤 4，全新独立实例）于 2026-11-07 核验；基准 HEAD `ee16eb4`（`git rev-parse --short HEAD` 复核一致），`git status --short src/ demo/src/ scripts/` 为空（源码区干净）。核对命令与结果：

1. **消费方清单逐文件核对（全部命中，无漏列误列）**：
   - O2：`grep -rn "cellRectAt" src demo/src --include="*.js" --include="*.vue"` → 转口行 `painter.js:417-418`；import 消费方恰 3 处：`use-table-api.js:16`、`self-checks/spans.js:28`（单符号行，改路径即可）、`self-checks/painter.js:25`（三符号行，拆 cellRectAt 一行）；其余命中均注释/调用点（`paint-overlay.js:78`、`spans.js:183,197` 等），与设计一致。
   - O6：`grep -rn "createRowGeometryController" src demo/src` → `table-ex.vue:77,337` + `self-checks/row-geometry-controller.js:14,87,133,168`（传字面量，不改）；`grep -c "ctx" controller.js` = 33 行（设计"约 30 处"成立）；`grep -n "ctx:" table-ex.vue` = 0 命中。
   - O1：`grep -rln "interaction/interactions" src demo/src` → 恰 5 文件（use-pointer:16 / use-cell-click:19 / use-column-resize:20 / use-cell-tooltip:25 / self-checks/interactions.js:20-34）；interactions.js 全文精读：13 导出 + 9 私有符号（contentRightEdgeX:18、isTreeArrowSlot:97、isSortableHeader:108、isEditableCell:113、isItemClickable:305、isItemRectHit:312、findHitItem:321、isBodyCellHit:378、isEditingCell:383）与拆分表逐一对上；三框私有依赖自洽（isTreeArrowSlot 唯一跨框依赖，设计已注明；模块级 import layout/tree/constants 全归 hit-test 框）；self-checks import 的 13 符号按 4+7+2 分布三新文件，全覆盖。
   - O3/O4/O5：行号逐项命中（见下条）。
2. **行号漂移核对（无漂移）**：painter.js:417-418；use-table-api.js:16,108（host.canvasEl.value）；use-pointer.js:7,234（host.flatRows.value）；row-geometry.js:1-2；interactions.js:1-407（删除基准）；paint-overlay.js:98-135/140-172/178-219 三站点、L139 互补谓词注释、strokeRect 三处 L132/L169/L216 参数逐字一致、painter.js:20 import paintOverlay；controller.js:33(JSDoc)/45(签名)/225-240(syncAnchoredLayout)/268(recordNumber 内联)/421-434(锚定块，computeAnchorShift L421、setLayout L430)/21(recordNumberOf import 已存在)；cell-identity.js:14-16 recordNumberOf 定义与"原 10 处内联式收敛至此"注释。
3. **O4 同源逐 token 复核成立**：L421-434 内联块与 syncAnchoredLayout L225-240 结构逐段比对，除 `geometry`→`variableGeometry` 别名外语句序列一致（shift 计算 → scrollTop 回写 → setLayout contentHeight/spacerHeight 同式）；调用替换参数序 `syncAnchoredLayout(cur, el, variableGeometry, anchorRow, prevTopAtAnchor)` 与既有调用 L279 同构。
4. **批次容量与次序（R3 合规）**：B1=5 文件、B3=4 文件（T1 ≤30）；B2=1 文件；B4 T2=9 文件、1 改动点（interactions.js 拆分 + 机械跟随 import 改写）；B5/B6 T3 各 1 文件 1 改动点（B6 两站点同文件同信号 = 1 改动点）。次序 B1(S1)→B2(S6)→B3(S2/S3)→R1→B4(S7)→B5/B6(S4) 符合 means.md：T1 先行、T1 内部 S1→S6→S2/S3、全部 T1 后复测、无 S5 批故 R1 即 S7 开工前唯一复测。
5. **验证组合充分性（对照 verification.md）**：T1 组合齐备；B1/B2/B3 豁免论证复核——painter.js L1-16 顶层纯注释 + import、无顶层副作用（02-map §6.3 模块级状态清单不含 painter.js），cellRectAt 静态标识符，豁免成立；B4 组合齐备；B5/B6 原缺"行数与浅模块核对"（T3 = T2 组合 + 校验点核对，T2 组合含该项），已补入批次计划。API 冻结表述原为病句（"仅允许 B3 之外为空"），已修正为全批恒为空。
6. **不做清单核对**：N4 editor-geometry import 点 = 3 src（use-cell-click:21、edit-button:7、paint-overlay:4）+ 3 self-checks（editor.js:35、spans.js:29、painter.js:26），共 6 处与设计一致；N1 论据原表述"唯一消费方"与代码不符——self-checks/row-geometry.js:18-24 亦 import computeRowHeights/ensureRowMeasured，已修正（结论不变，拆分扰动面更大反而强化不拆）；N6 两变体锚定 use-tree-rows.js:141（applyTreeToggle）、use-table-instances.js:36（onThemeChange）存在。
7. **code-reforge 判据复核**：每个 O 完成后两问可静态作答——O1 后"表头点击在哪"→ click-resolve.js、"调宽下限在哪"→ resize-resolve.js；O2 后"cellRectAt 在哪"→ paint-utils.js:35；O6 后 grep deps 单义；O3/O4 后描边几何改动点 = cellFrameOf、锚定补偿改动点 = syncAnchoredLayout 单处；R1 两问验收按此抽点。
8. **修订**：2 项实质（S1 门禁豁免表达定稿入 O2；B5/B6 补行数与浅模块核对）+ 事实修正与措辞修正若干，台账见 06-amend-1.md。

## 复测记录

**R1 复测（2026-11-07，B1–B3 完成后）——通过**

① 信号清零：
- `node scripts/table-ex-structure-check.mjs` → `OK — 扫描 44 个文件，零纯转发 re-export（豁免公共入口：index.js）`，退出码 0
- `node scripts/table-ex-host-audit.mjs` → `OK — 审计 10 个 composables 文件，host 键声明零缺失`，退出码 0
- `grep -rnE "export \*|export \{[^}]*\} from" src/components/table/ex --include="*.js"` → 仅剩 `index.js:1-2`（`export { default } from './table-ex.vue'` / `export { default as MuTableEx } from './table-ex.vue'`，公共入口豁免项）✓

② 两问验收（5 功能点 + 5 改动点，grep 静态定位，与 02-map.md 核对全对）：

| 问 | 定位结果 | 与底图核对 |
|---|---|---|
| 表头点击排序判定在哪 | 决策 `resolveHeaderClick`/`resolveOrderByNext` → `interaction/interactions.js`；编排 → `use-cell-click.js` | §4.2 一致 ✓ |
| 调宽下限在哪 | `RESIZE_MIN_WIDTH` → `interactions.js:14`；消费 `use-column-resize.js:20,83` | 一致 ✓ |
| hover 描边几何在哪 | `paint-overlay.js`（`paintHoverEditorStroke`/`paintHoverPlainStroke`） | §4.1 描边链 3 站点一致 ✓ |
| rec_no 序号计算在哪 | `recordNumberOf` → `shared/cell-identity.js:14` 单一事实源 | §5.1 一致 ✓ |
| tooltip 门控在哪 | `resolveTooltipTarget` → `interactions.js`（决策）+ `use-cell-tooltip.js`（编排） | §4.2 一致 ✓ |
| 改 resolveResizeWidth 影响谁 | src 仅 `use-column-resize.js:20`（layout.js:39 为注释引用，辨伪排除）+ self-checks/interactions.js | 一致 ✓ |
| 改 editorGridlineFlagsOf 影响谁 | `editor.js`、`paint-overlay.js`（定义在 editor-geometry.js）+ self-checks editor/spans | §3 一致 ✓ |
| 改 recordNumberOf 影响谁 | src 6 消费方（use-cell-click/use-cell-tooltip/cell-selection/spans-method/paint-body/row-geometry-controller） | 入度 7（含 self-checks）一致 ✓ |
| 改 syncAnchoredLayout 影响谁 | 仅 `row-geometry-controller.js` 文件内（无外部消费方） | 一致 ✓ |
| 改 hitTest 影响谁 | src 仅 `use-pointer.js:16,40`（constants/spans/edit-button 命中均为注释提及，辨伪排除） | §4.2 一致 ✓ |

执行方式说明：派发硬边界禁止派生子 agent，无法启动全新上下文实例；由实施者以 grep-only 纪律执行（不读实现文件正文，仅看 grep 命中行上下文），宽泛命中逐一辨伪（注释引用≠代码引用）。独立复核留待检验轮 verifier 实例。

## 未解问题

（已全部处置，无遗留待用户裁决项）

1. **demo 服务可用性**——已实测（2026-11-07，只读 HTTP 探测）：`http://localhost:3000/` → 200；`http://localhost:3000/data/table-ex/` → 200（验证组合 URL 口径正确可用）；`http://localhost:3000/table-ex/` → 404（勿用无前缀路径）。实施时若服务中断再按原方案启动 `npm run demo:build`（watch 模式，属运行环境非改码）。
2. **B1 门禁脚本对 index.js 豁免的表达**——已定稿写入 O2（脚本内置硬编码豁免名单 `PUBLIC_ENTRIES = ['index.js']`，不改 index.js 本身；不采用文件头标记方案，避免与 API 冻结口径冲突）。
