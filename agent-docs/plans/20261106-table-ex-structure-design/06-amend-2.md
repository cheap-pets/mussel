VERDICT: AMENDED

## 上次回应核对（第 2 次）

| 上次项 | 设计者回应 | 核对结论 |
|---|---|---|
| 台账 #5 recordNumber 10 处 / 6 文件（292→392） | 接受并修正 392/419 两行形态 | 已落实。`git grep -n recordsOffset` 核实行号：use-cell-click.js:95,200 / use-cell-tooltip.js:108 / paint-body.js:101,151,207 / row-geometry-controller.js:392（`ctx.getRecordsOffset() || 0`）、:419（使用点）/ cell-selection.js:43 / spans-method.js:120，共 10 处 |
| 台账 #6 O1① 7 行消费方清单 | 接受（补正 drawTreeArrow 出处） | 已落实。cell-painters.js:299–302、table-ex.vue:81、use-cell-click.js:11、use-cell-tooltip.js:18、paint-overlay.js:2、demo cell-painters.js:42–51、demo painter.js:27、demo spans.js:21 全部复核一致；paint-body.js:2 的 drawCell 确为 cell-painters.js:25 自身定义 |
| 台账 #7 O1②③ 消费方 3 文件 | 接受，③ 归批次 2A | 已落实。interactions.js:438、use-column-resize.js:13、use-relayout.js:9、table-ex.vue:82、demo editor.js:34–50（15 符号内 9 个 re-export）、demo interactions.js:20–36 复核一致 |
| 台账 #8 `@ctx-*` → `@host-*` | 接受 | 已落实。仓库当前无 `@ctx-`/`@host-` 既有标签（`git grep` 零命中），新约定不与既有冲突 |
| 台账 #10 O4 消费方 7 文件 + editor.js 保留面 | 接受 | 已落实。editor.js:61/78/94/114、:6–9 常量、:21–31 re-export、7 消费方（paint-overlay:3 / edit-button:7 / use-cell-click:10 / demo editor:34–50 / demo painter:25 / demo spans:29 / table-ex:82）复核一致；4 常量仅 editButtonRectOf 使用 |
| 台账 #11 isSamePoint 仅覆盖 2 函数 | 接受 | 已落实。use-cell-tooltip.js:37–41 与 use-pointer.js:70–74 逐字相同；isSameHoverItem use-pointer.js:158–168 五字段 |
| 台账 #12 withAnchorPreserved 行号 | 接受并修正 | 已落实（另修正描述）。use-tree-rows.js:145–182（捕获 150–155 / 补偿 169–177）、use-table-instances.js:29–56（捕获 35–39 / 补偿 47–51）一致；但两处均为**内联求差**，未调用 `computeAnchorShift`（row-geometry.js:299，仅 controller:248,434 调用），P5-4 已改述 |
| 台账 #13 recordNumberOf 签名 | 接受 | 已落实。调用侧三形态成立（spans-method.js:120 / cell-selection.js:43 / paint-body.js:101） |
| 台账 #14 O6 拆分清单 | 接受 | 已落实。`grep "^export "` interactions.js = 12 函数 + RESIZE_MIN_WIDTH + :438 re-export |
| 台账 #15 O7 drawCell 分组 + 调用点 | 接受 | 已落实。cell-painters.js:25–45 19 字段、:60 centerY 派生；调用点 paint-body.js:317 / demo cell-painters.js:134 |
| 台账 #17 §4.0–4.5 批次细化 | 接受（本轮扩展） | 已落实并被本轮再收敛：避让表 hunk 行区按 `git diff -U0` 复核，use-pointer 判定推翻（见台账 #11），轮 2 = 2A 落定 |
| R1 描边链行号漂移 | 新增事实修正 | **部分成立**。矩形链实为 113–126 / 155–168 / 201–214（各 14 行；112 / 154 是 `const { layout, spans } = state` 解构行），裁剪段代码实为 134–142 / 173–181 / 223–231（各 9 行）；原回应"112–126/154–168/201–214 各 15 行"混淆了解构行与链体。已在 P5-1 / O5 / §4.2B 修正 |
| R2 2A/2B 拆分与 16 文件 | 新增裁剪 | 成立。2A 复核为 2 新建 + 11 修改 + 3 demo = 16 文件；轮 2 容量裁定维持 2A 单批，2B 不并入 |
| R3 避让策略表 | 新增 | **部分成立**。4 文件 hunk 行区基本准确（修正 paint-overlay 为 57–98/130–231、paint-gridlines 为 65–79）；但 use-pointer"未提交新增代码体内部引用 ctx"失实——95–116/122–140/:138 零 `ctx`，唯一重叠 :154 仅为标识符替换，据此推翻"不可 hunk 分离 / 需用户裁决"，改为批次 1 直接实施 |
| R4 §4.2 grep 断言 | 新增修正 | 成立。`editing/editor.js` 字面模式不匹配 `editing/editor-geometry.js`，断言可执行 |
| 不接受 / 不可行 | 0 / 0 | 无 |

## 检查项结论（每项一行）

1. **覆盖**：4 条验收标准均归属批次（§4.5），手段可验证；受影响 demo 文件 5 个逐一列入批次，验收标准 3 的"12 文件"已显式化（5 受影响 / 6 直引 + index.js 不动）。
2. **事实一致**：抽核 paint-overlay / editor / use-pointer / spans / paint-body / row-geometry-controller 与 demo 5 文件的行号与符号；本轮修正 4 处失实（描边链 15 行→14 行、use-pointer 不可 hunk 分离、spans-auto 内部 ctx 漏列、P5-4 computeAnchorShift 误述），其余一致。
3. **约定一致**：新文件落 `editing/`、`shared/`、`interaction/`；`@host-*` 与 O3 改名方向一致；知识库 `table-ex-hover-span-region` 与 `table-ex-overlay-clip-body-area` 均存在且与 O5 引用一致。
4. **影响面**：O1/O3/O4 消费方 grep 全量复核（含 demo self-checks 11 个直引文件）；其余 demo 页仅引 `ex/index.js` 与 `shared/tree.js`，docs / docs-site 零引用，无遗漏调用方。
5. **可实施**：批次 1 22 文件均为机械改引/改名（含 use-pointer 全文件改名，已解除阻塞）；批次 2A 16 文件；批次串行、依赖无环。
6. **风险与回滚**：每批行为判据 + 单 commit revert + 双向门；未提交区均有行级规则（use-pointer 仅 :154 标识符、paint-overlay 57–231 禁触、painter 断言区禁触、paint-gridlines 禁触）。
7. **范围**：改动限于 O1–O8，无新增重构项，未触碰 §5「明确不做」。
8. **切片**：轮 1 = 批次 1、轮 2 = 批次 2A 落定；2B / 批次 3 留待用户追加；各片有可观察判据、验收归属明确、文件集合相交故串行。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | §4.0 use-pointer 行 + 裁决段 | "不可 hunk 分离 / 需用户裁决先行提交 / 裁决 (b) 顺延批次 2A / 未裁决前不开始批次 1" → "可安全实施：整文件机械改名、不阻塞；仅 :154 单行标识符替换" | `git diff -U0 use-pointer.js` hunk = 7、90–122、138、154；新增代码体 colBandRegionsOf 95–116 / hoverRegions 122–140 / :138 零 `ctx` 引用（`grep -n ctx` 仅命中 :154 等既有行）；:154 为前一任务新增 `ctx.spans.value` 实参，`ctx.`→`host.` 不改逻辑 | 是 |
| 2 | §4.0 避让表行区 | paint-overlay `55–100、113–232` → `57–98、130–231`；paint-gridlines `65–77` → `65–79` | `git diff -U0` hunk 头：paint-overlay `@@ -57,3 +57,5` 起、`@@ -189 +218,14` 止；paint-gridlines `@@ -75 +79` | 否 |
| 3 | §4.1 改动清单标题 + #11 | `18+4 但 (b) 顺延为 17+4` → `18+4 全部本批`；#11 说明改机械改名 | 同 #1；use-pointer O3 完成度 10/10 | 是 |
| 4 | §4.2 行为判据 + #9 | "若 §4.0 裁决 (b)，本批一并补 use-pointer O3" → "O3 已在批次 1 完成；本批仅改 isSameHover" | 同 #1 | 是 |
| 5 | §4.2 preamble | 新增"轮 2 容量裁定（终审）：轮 2 = 2A 全部，2B 不并入、2A 不再裁剪"及理由 | 00-task 预算 `(fast 实施 → fast 检验)×2`（n≤2）；2B 完全落在未提交区且需知识库双约束逐字校验，与 2A 机械归一不同风险级；再裁 2A 需第 3 轮 | 是 |
| 6 | P5-1 | `各 15 行矩形链（112–126/154–168/201–214）、逐字相同` → `各 14 行（113–126/155–168/201–214）、结构相同（坐标变量名不同）；裁剪段 134–142/173–181/223–231` | paint-overlay.js 实测：201–214 仅 14 行；112/154 为解构行；134–142/173–181/223–231 为 clipX0+withClip+strokeRect 代码体 | 否 |
| 7 | P5-4 | `offsetToRow→topAt→变更→computeAnchorShift→回写` → `新旧 topAt 差→回写；与 computeAnchorShift 同式，两处均内联求差` | use-tree-rows.js:173、use-table-instances.js:48 均内联 `topAt() - anchor.top`；computeAnchorShift 仅 row-geometry-controller.js:248,434 调用 | 否 |
| 8 | P7 | "直引 ex/ 内部模块（12 文件）" → "目录 12 文件，其中 11 个直引（index.js 仅聚合）" | `grep -rl "components/table/ex/" demo/src/data/table-ex/self-checks/` = 11 | 否 |
| 9 | §3 O1 影响面 | "其余 7 个不动" → "其余 6 个直引文件 + index.js 不动"（列名） | 同 #8；11 − 5 = 6 | 否 |
| 10 | §3 O2 | table-ex.vue `337–357` → `337–355` | 14 getter 在 337–355；357 为 `host.rowGeometry = rowGeometry` | 否 |
| 11 | §3 O3 spans | 只列 spans-auto.js:119 → 补 `:32 collectAutoRowSpanColumns(ctx)` 及调用 `:55、:121` 同改 | spans-auto.js:32–33/55/119–121 均用同一共享对象，只改 119 会残留第二种 ctx 语义 | 否 |
| 12 | §3 O5 cellFrameOf | `112–126/154–168/201–214` → `113–126/155–168/201–214 各 14 行`，注明解构行 112/154/194 | paint-overlay.js 实测 | 否 |
| 13 | §3 O5 背景带 | `80–95/130–145` → `提取体 82–95/132–145；bandEnd 求值留调用处 :80/:130` | paint-body.js：:80 为 `const bandEnd = x0 + bandWidth`，82–95 为纯绘制体；签名已收 bandEnd 实参 | 否 |
| 14 | §4.2 清单行 | 删"对应原批次 2 的 #1–10、14–19"悬挂引用 → "2 新建 + 11 修改 + 3 demo，共 16 文件" | 批次已重编号，旧编号不存在 | 否 |
| 15 | §4.2B #1 | 矩形链/裁剪段行区 → `113–126/155–168/201–214`、`134–142/173–181/223–231` | 同 #6/#12 | 否 |
| 16 | §4.5 验收标准 3 | 批次简写 → 12 文件全量覆盖（5 受影响 / 6 直引 + index.js 不动） | 同 #8；同时满足验收标准 3 的"12 文件"口径 | 否 |
| 17 | §4.1 #19 | "7 符号改引源文件" → 补"drawCell 保留 cell-painters 原引" | demo cell-painters.js 同一 import 块内 drawCell 为自身定义，不属 re-export（cell-painters.js:25） | 否 |

## 未解决异议（累计）

无。
