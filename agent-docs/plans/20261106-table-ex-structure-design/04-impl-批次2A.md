# 实施记录（批次 2A：O4 + O5 三项机械提取）

依据：`02-design.md` §3 O4/O5 + §4.0 避让表 + §4.2 改动清单（16 文件）；约束见 `decisions.md`（轮 2 = 批次 2A 全部；实施前先采集探针基线）。两阶段执行：阶段 A 基线采集（probe-baseline-2A.md 落盘）→ 阶段 B 源码 Edit。

## 基线采集方式（阶段 A）

- 按知识库 `table-ex-refactor-frozen-probe` 流程 + decisions「当前状态即 2A 前状态」执行：`npm run demo:build`（watch + :3000，后台）→ playwright mcp 采集 `/data/table-ex/`（自检面板）、`/data/table-ex-basic/`、`/data/table-ex-scene/` 三页。
- 基线内容（逐字存档）：console 原文 46 行（INFO 1 + WARNING 43 = Canvas2D×38 + icon 夹具×5 + ERROR 1 夹具）、自检面板 `232/232 通过`（fail 0、✗ 0、12 模块分布计数）、构建序摘要（485 modules / 645ms）。原文落盘 `.playwright-mcp/console-2026-11-06T16-48-37-009Z.log`。
- 基线文件：`probe-baseline-2A.md`（含比对口径：时间戳与 main.js 行号允许漂移）。**落盘后才开始任何源码 Edit**。采集后服务保留至实施收尾关闭，验证员自行再启。
- 知识库"demo 自检加临时探针"路径未走源码注入：派发定义的基线内容（console 序列 + 面板计数 + 构建序）可直接从页面采集，且 demo painter.js 断言区禁触（§4.0），无注入必要。

## 改动文件

路径均相对项目根；步骤号为 `02-design.md` §4.2 清单 # 编号（设计行号系批次 1 前基准，现工作区行号已注明）。

| # | 文件 | 步骤号 | 改动摘要 |
|---|---|---|---|
| 1 | src/components/table/ex/editing/editor-geometry.js | §4.2-1 | 新建：editorRectOf / editorGridlineFlagsOf / editButtonRectOf / computeEditorStyle 4 纯函数连同 JSDoc 逐字迁自 editor.js；import 4 常量（CELL_PADDING_FALLBACK / ROW_TOP_INSET / ROW_HEIGHT_FALLBACK / EDIT_BUTTON_AREA）；零 vue/form 依赖 |
| 2 | src/components/table/ex/shared/cell-identity.js | §4.2-2 | 新建：isSamePoint（2 字段 + null 归一，归一自 isSameHover/isSameCell）+ recordNumberOf(recordsOffset, row)；零内部依赖 |
| 3 | src/components/table/ex/editing/editor.js | §4.2-3 | 删 4 函数 + 9 符号 re-export（含专属头注释行）+ constants import 块；editor-resolve import 保持自用 6 符号（EDITOR_COMPONENTS / isCellEditable / normalizeCommitValue / normalizeEditorOpenValue / resolveEditorProps / resolveEditorType）；文件头注释改写为状态机单职责 + 指涉拆分去向 |
| 4 | src/components/table/ex/table-ex.vue | §4.2-4 | import 拆分：createEditorController 留 editor；isCellEditable 改引 `./editing/editor-resolve` |
| 5 | src/components/table/ex/composables/use-cell-click.js | §4.2-5 | computeEditorStyle → editor-geometry、resolveEditorType → editor-resolve（原同行 import 拆两行）；recordNumber 2 处（:110 checkColumnState、:215 emitCellItemClick）→ recordNumberOf(props.recordsOffset, …)；+ import recordNumberOf |
| 6 | src/components/table/ex/table-paint/paint-overlay.js | §4.2-6 | 仅 import 行 4：3 几何符号改引 `../editing/editor-geometry.js`；未提交区 57–231 禁触遵守（本批 diff 仅此 1 行） |
| 7 | src/components/table/ex/interaction/edit-button.js | §4.2-7 | editButtonRectOf 改引 `../editing/editor-geometry` |
| 8 | src/components/table/ex/table-paint/paint-body.js | §4.2-8 | 提取局部函数 paintRowBandBackground(ctx, state, r, x0, bandEnd, rowHeight)（选中行 cap + 延伸区补底单一事实源）；paintBodyRow / paintBodyRowSpans 两段逐字重复体（原 82–95 / 132–145）替换为 helper 调用，`bandEnd = x0 + bandWidth` 求值留调用处；recordNumber 3 处（:101 / :151 同式、:207 内联实参）→ recordNumberOf(state.recordsOffset, …)；+ import recordNumberOf |
| 9 | src/components/table/ex/composables/use-pointer.js | §4.2-9 | 删局部 isSameHover（原 :81–85），调用点（updateHover 内）改 isSamePoint；+ import（O3/@host-* 批次 1 已完成，本批未触） |
| 10 | src/components/table/ex/composables/use-cell-tooltip.js | §4.2-10 | 删局部 isSameCell（原 :46–50），调用点改 isSamePoint；recordNumber 1 处（:120）→ recordNumberOf；+ import isSamePoint, recordNumberOf |
| 11 | src/components/table/ex/geometry/row-geometry-controller.js | §4.2-11 | recordNumber 使用点（现 :425，`recordsOffset + row + 1`）→ recordNumberOf(recordsOffset, row)；归一行 `const recordsOffset = ctx.getRecordsOffset() || 0`（现 :398）按设计保留；+ import recordNumberOf |
| 12 | src/components/table/ex/interaction/cell-selection.js | §4.2-12 | recordNumber（:44，`recordsOffset + row + 1`）→ recordNumberOf(recordsOffset, row)；+ import recordNumberOf |
| 13 | src/components/table/ex/spans/spans-method.js | §4.2-13 | buildSpanInfo recordNumber（:121）→ recordNumberOf(recordsOffset, row)；文件头 + import（原文件无 import 区） |
| 14 | demo/src/data/table-ex/self-checks/editor.js | §4.2-14 | import 三分拆：editor.js 3 符号（createEditorController / isInDropdownPanel / resolveBlurFallback）+ editor-geometry.js 3 符号（editorRectOf / editButtonRectOf / computeEditorStyle，均代码实际使用）+ editor-resolve.js 9 符号 |
| 15 | demo/src/data/table-ex/self-checks/painter.js | §4.2-15 | 仅 import 行 25：editButtonRectOf 改引 editor-geometry.js；断言区 89–101 / 1416–1676 禁触遵守 |
| 16 | demo/src/data/table-ex/self-checks/spans.js | §4.2-16 | 仅 import 行 29：editorGridlineFlagsOf 改引 editor-geometry.js |

O4 消费面核验：设计 7 消费方全部落地（6 改引 editor-geometry + table-ex.vue isCellEditable 归 editor-resolve）；全仓 grep 无遗漏消费方。

## 偏离

1. **row-geometry-controller.js recordNumber 站点计数缺口（设计事实修正，未扩改动）**：O5 表与 06-amend-2 台账 #5 记 2 处（归一行 + 使用点），实测存在第 3 处同式内联站点 `recordNumber: (ctx.getRecordsOffset() || 0) + row + 1`（现 :298，remeasureVariableRow 内；HEAD 既有，非本流水线引入，终审 `git grep` 漏计）。本批按清单仅改使用点（§4.2-11"2 处"口径），:298 未动——留待调度者决定（与 2B 同文件可顺带，或另批归一）。证据：grep `|| 0) + .* + 1` 残留仅 cell-identity.js 自身与 :298。
2. **computeEditorStyle JSDoc 一词适配**：原注释"（editor.js 不 import spans.js，保持模块隔离）"迁移后指涉失准，改"（本模块不 import spans.js，保持模块隔离）"。其余 4 函数 JSDoc 逐字未动。
3. **editor.js 文件头注释重写**：原头注释枚举"只读判定、编辑器组件/props 解析、编辑盒定位、提交矩阵与值规整层"——随 O4/O1③ 拆分全部失准（4 几何函数已移出、re-export 已删），改写为状态机单职责描述 + 指涉 editor-geometry / editor-resolve（同 §4.1-1/2 连删失准注释先例）。零逻辑改动。
4. **行号漂移**（非实质偏离）：设计行号为批次 1 前基准，批次 1 插入 @host-*/@getters 块后整体下移（isSameHover 70–74→81–85、isSameCell 37–41→46–50、use-cell-tooltip recordNumber 108→120、row-geometry-controller 392/419→398/425、paint-overlay editor import 3→4）。符号与形态逐一核对与设计一致。
5. **table-ex.vue 注释文案 1 行（清单外）**：`单一 ctx 载体` → `单一 host 载体`（:223）。批次 1 实施记录"遗留"节明示建议"批次 2A 触及该文件时顺手改"，按其执行；零行为改动。

## 自检

- `npm run build`：exit 0；4 段 vite build 全 `✓ built`（base 285 modules ×2 + ex 332 modules ×2；dist/mussel.ex.min.js 332.49 kB）。
- 设计判据 grep：`grep -rn "editing/editor\.js" src/components/table/ex/table-paint src/components/table/ex/interaction` = 0 命中（editor-geometry.js 不误命中，R4 口径）；editor.js 剩余消费方仅 2 处且均为自身导出符号（table-ex.vue:82 createEditorController、demo editor.js:34 三符号）；全仓 `editing/editor'`（无后缀）消费方同上 2 处。
- cell-identity 消费方 = 7 src 文件（use-cell-click / use-pointer / use-cell-tooltip / row-geometry-controller / cell-selection / spans-method / paint-body），与清单一致。
- recordNumber 归一式残留扫描：仅 cell-identity.js 自身（实现 + 注释）+ 偏离 1 所述 :298；painter.js:156 为无关表达式误命中（colWidths）。
- API 冻结：`git diff -- src/components/table/ex/table-ex.vue` 仅 import 区 + 2 注释行；diff 中 defineProps / defineEmits / defineExpose 零命中。
- 避让核验（§4.0）：paint-overlay.js 本批 diff 仅 import 1 行（未提交区 57–231 未触）；use-pointer.js 仅 isSameHover 删除区（未提交 hunk 区外）+ import 行；demo painter.js 仅 import 行（断言区未触）；paint-gridlines.js 零触。
- demo watch（:3000）在改动后自动重建成功（built in 248ms；catalog.js 1174.31→1176.25 kB）；页面加载预检：`/data/table-ex/` console = 1 error + 43 warnings，与基线逐字同构（均为既有夹具），自检面板 `自检结果（232/232 通过）`——import 改引全部生效、零运行时错误。此为轻量预检，**探针基线逐字比对未做复采**（按派发属验证员职责，比对口径见 probe-baseline-2A.md §4）。
- 项目无 lint/typecheck 脚本，以 build 代替（批次 1 同口径）。

## 遗留

- row-geometry-controller.js:298 内联 recordNumber 站点（偏离 1）待调度者决定归属批次。
- 批次 2B 范围零触碰：cellFrameOf / strokeCellFrame（paint-overlay 描边链）、withAnchorPreserved（use-tree-rows / use-table-instances / row-geometry）均未动；O5 表 cellFrameOf 行的 2B 提取项未实施。
- demo watch 服务已关闭（验证员自行再启）；`.playwright-mcp/.gitignore` 已存在，无需新增。
- 编辑器自检 demo editor.js 头注释（:16）仍提及 editorGridlineFlagsOf——该符号断言实际在 demo spans.js，注释指涉略宽，未动（原状如此，非本批引入）。
