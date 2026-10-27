# 设计审改（第 1 轮）

VERDICT: OBJECT

对象：`agent-docs/plans/20261027-canvas-table-improve/02-design.md`（已直接修改）
基准：00-task.md「约束」+ A1–A10；decisions.md 各口径不动。

## 上次回应核对（第 2 次起）

本轮为首轮审改，无上次回应需核对。

## 检查项结论（每项一行）

1. 覆盖：A1–A7/A9/A10 均有设计与可执行手段；A8 主句按 decisions 禁排口径无对应设计，且本设计自证成本非过高 → 条件句前提不成立（异议 1）；新增/改写测试文件均已列入改动清单与实施步骤。
2. 事实一致：8 处关键事实与代码不符或漏项（shadow 外扩、paintTreeArrowAccent 自算 centerY、resolveItemClick 无 disabled、update:cell-value 的 column 为内部列、treeRecords 另两处消费点、borderless 夹具不存在、treeOn 后可排序不成立、G2 期间页面 boot 断裂）——已改。
3. 约定一致：分层 / 模块隔离 / 单一事实源 / 镜像常量收拢 / 脏区 region 均符合；painter→editor 新增 `editorButtonRectOf` 导入沿用既有例外。
4. 影响面：补 paintTreeArrowAccent、interactions.resolveItemClick 返回形状、scss textarea 注释、main-view treeRecords 两处 `.value`、recordingCtx 记录面。
5. 可实施：G1→S4→S5→G2→V 有序；G2 并行组「页面运行通过」判据原状不可执行（见第 8 项），已改。
6. 风险与回滚：R1–R6 + 回滚单元成立；补 R7（多行编辑态首行位移）。
7. 范围：改动全在 `src/components/canvas-table/**` 与 `demo/src/data/canvas-table/**`；文档差异已列入未解问题 5。
8. 并行组：G1-a/b/c 与 G2 各文件集合两两不相交、无共享文件；但 G2 六组的完成判据「页面运行通过」耦合于整包构建（EDITOR_GAP 具名导入未收口前页面不可 boot）→ 判据已改为「编辑可并行、页面验证整组落地后一次执行」。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | 问题 2 方案 / 改动清单 scss 行 / A2 测试行 | `top: var(--head-row-height, 36px)` → `top: calc(var(--head-row-height, 36px) + 1px)` | `--mu-shadow-float` 首项 `0 0 0 1px`（src/styles/root.scss:62-66）以 0 高度条为轴外扩 1px；top 取 headHeight 时 hairline 压住 header 底边框（painter.js:682 画在 headHeight−1），与 A2「不覆盖 header」直接冲突、原 A2 像素断言必失败 | 是 |
| 2 | 问题 1 方案 + 涉及 + 改动清单 painter 行 + A1 测试行 | 补 `paintTreeArrowAccent` centerY 同口径修正 | painter.js:714 自算 `viewportRowY + heightAt/2`，与 cell-painters 树箭头（:541）不同源；r≥1 行 hover 主色三角与底色三角错位 0.5px（原方案漏此项） | 是 |
| 3 | 问题 7 方案 + 涉及 + 改动清单 interactions 行 + 接口节 + A7 测试行 + G1-c | 新增 `findHitItem`/`resolveItemClick` 透传 `disabled`，返回形状改 `{ kind, index, row, col, disabled }` | interactions.js:351-361 只回落 kind/index/row/col；不做此扩展 `hoverItem.disabled` 恒 undefined，disabled 链接/按钮仍变色、光标仍 pointer，A7 两条断言假阳 | 是 |
| 4 | 测试计划 A1 | 「bbox 中心 ±0.5px」+「首行 top 差 ≤1px」→ ctx stub 精确断言（无容差）+ 像素 ±2px 辅助 + 浏览器 ≤3px（含旧实现 ≈18px 的判据说明） | 0.5px 修正低于墨迹 bbox 噪声：同口径先例 self-checks/painter.js:945-948 用 ±2px；跨格墨迹 top 还含字形类差异（拉丁 x-height vs 汉字） | 是 |
| 5 | 测试计划 A3 | 删「(cellX−1) 为行带」→ 改内邻 (cellX+1, cellY+1) 为行带；外邻按 blend(hoverBg, borderColorSoft) | 列线画在前一列右缘（painter.js:382-395），x−1 是列线像素且被 paintHoverRow 覆盖为 hoverBg 叠列线色，原断言必失败 | 是 |
| 6 | 测试计划 A5 + A7 + 改动清单 self-checks/painter.js | 自检删「hover 格按钮区出现非背景像素」→ 自检断言拆为（几何 / requestIconImage 缓存与着色 / 未 onload 前该区像素与无 hover 帧一致 / hoverMode none 不执行）+ 像素归浏览器并等首次 onload；注明 recordingCtx 需增记 fillRect | `runChecks` 同步（self-checks/index.js:39-57），`new Image()` onload 异步；既有 img 断言同口径（cell-painters.js:15-19 头注）；recordingCtx 现仅记 fillText/fill（cell-painters.js:106-128），下划线断言不可观测 | 是 |
| 7 | 测试计划 A6 | 「editor.border:false 列如备注 validate 列…用金额列对照」→ switch 恒 bordered=false 作 borderless 载体；`border: false` 列 demo 无夹具，按代码层结论 | demo 全仓无 `border: false` 列配置（grep main-view.vue 仅命中 :396 validate），原描述自相矛盾且无夹具可执行 | 是 |
| 8 | 测试计划 A8 + 问题 8 demo bullet | 「treeOn 关闭后箭头恢复且点击可排序」→ 「箭头恢复 + 点击产生 update:order-by（数据顺序不变）」 | main-view.vue:789-798 `stageRecords` case 'tree' 恒返回 treeRecords，不接 sortedRecords；树关后数据仍不排序 | 是 |
| 9 | 实施步骤 G2 完成判据 | 「各组：新断言在页面运行通过」→ 「编辑可并行，页面级验证整组落地后一次执行」 | G1-a 删 EDITOR_GAP 后 self-checks/editor.js:27、self-checks/painter.js:20 具名导入使整包构建失败，页面不可 boot，逐组跑页面判据不可执行（并行组判据耦合） | 是 |
| 10 | 问题 5 契约 onClick | payload 先例「与 update:cell-value 一致」→「对齐 cell-item-click（`_raw ?? col`）」，并注明 update:cell-value 传内部列 | editor.js:669 `context.column` 为已准备内部列，canvas-table.vue:918 传 wiredColumns 项；`_raw` 归一先例在 emitCellItemClick（canvas-table.vue:849-872） | 否 |
| 11 | 问题 8 demo 夹具段 | 补 `debugFlatRowsLength` 的 buildChildrenIndex/buildFlatRows 两处 `.value` | main-view.vue:811/816 直接引用 treeRecords，改 ref 后传 Ref 对象会抛 TypeError | 否 |
| 12 | 问题 1 风险 + 风险与回滚 R7 | 补多行编辑态首行位移说明 | textarea 首行顶仍 = 格顶+padding（canvas-table.scss:136-148）；改后画布 n≥2 首行锚下移 `lineHeight×(n−1)/2` | 否 |
| 13 | 问题 3 方案 scss bullet + 改动清单 scss 行 | 补「textarea『首行顶对齐』半句随问题 1 失效，删该半句」 | 原注释主张与改后锚定口径矛盾，留着会误导后续维护 | 否 |
| 14 | 实施步骤 G1-a / G1-b | `painter.vue` → `painter.js`；G1-a 补两处 self-checks EDITOR_GAP 导入收口说明；G1-b 判据改「gridInset 缺省时单行锚不变、多行首行锚改为格中心（断言同步改写）」 | 原判据「缺省时行为 = 旧锚点」对多行路径不成立（锚随口径改变，与 gridInset 无关），会误导实施者核对 | 否 |
| 15 | 问题 7 方案 → hoverMode none | 补「hoverMode none 时 hoverItem 置 null」 | 与同节编辑按钮「随 paintHoverOverlay 抑制」及 hoverMode=none 语义对齐，避免 none 下他因重绘仍画条目 hover | 否 |
| 16 | 测试计划 A4 浏览器段 | 补「夹具已摘 link 编辑配置，此处仅冒烟；排除清单判定以自检为准」 | 摘除夹具后浏览器段不再验证排除清单逻辑，避免误读为覆盖 | 否 |
| 17 | 改动清单 self-checks/painter.js 行 | 补「:925 R4a/R4b 用 row 0（无上格线），锚不变，保持通过」 | 该既有断言与 A1 改动同口径，需明示不需改写，防误伤 | 否 |
| 18 | 未解问题 1 | 补 A8 条件结构说明（成本结论非过高 → 条件句前提不成立） | 与异议 1 呼应，供确认门判读 | 否 |
| 19 | 问题 8 方案 demo bullet | 「箭头恢复可点」→「箭头恢复、点击产生 update:order-by（数据顺序不变）」 | 与 #8 同步，保持文档内部一致 | 否 |

## 异议

1. **争议** — `02-design.md` 问题 8「口径」（:118）与 A8（`00-task.md:32`）冲突：decisions.md:10 记录的是「**若放弃**树排序支持」时的禁排范围（字面义），并未判定放弃；而本设计自身成本结论为「单次排序总成本预期 < 30ms（非『过高』）」（02-design.md:127），即 A8 条件句「若成本过高 → 不显示排序箭头」的前提不成立。按当前设计落地，A8 主句（同级子节点内排序生效）与条件句（成本过高才允许禁排）**两句都无法通过**，A8 验收必红。建议修法（需用户裁决，实施前给口径）：A 案——按 A8 主句实现树排序（父级 `stageRecords` 树场景接排序产物，组件侧删 tree 禁排三处，改动面已隔离），成本结论作 A8 附件；B 案——确认门明确作废 A8 首句并把「树状态禁排」写入 decisions。不得由设计/实施自行取舍。
