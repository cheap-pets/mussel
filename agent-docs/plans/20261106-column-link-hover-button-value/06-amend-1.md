VERDICT: OBJECT

## 检查项结论

1. **覆盖**：三条需求验收均映射到设计 + 测试行（需1-1..4 / 需2-1..6 / 需3-a..c + 编译检查）；但需2-6「空值/null 落占位」在 canvas 通道原设计无实现手段（`drawCell` 在 `canvasKind: 'button'` 分发处直接返回，`cell-painters.js:86-91`，`drawButton` 空组早退 `canvas-kind-painters.js:131`），已补空组门控上提（实质改动 S1-S5）。
2. **事实一致**：抽样核对路径/符号/行号通过（`text.js:57-62`、`button.js:70-79/49/92`、`tag.js:4/23/30`、`item-painters.js:53/67/266/159`、`link-items.js:23/62/66`、`paint-body.js:233/240-246/321`、`row-geometry.js:183/238`、`layout.js:321`、`use-pointer.js:158/175`、`use-cell-click.js:237-239`、`table/main-view.vue:330-332`、`icons/tabler-icons.js:38`）；修正 `cell-content.js:81→80`、cursor 断言目标（canvas 无 cursor，绑 `__sticky` `table-ex.vue:16-17,415-417`）、自检 `canvasKind === 'button'` 断言表述（`self-checks/cell-painters.js:972`）。
3. **约定一致**：`caption`（button/tag）与 `label`（link/list）以工作区现状为准，设计口径正确、不回退基线；BEM/`mu-` 前缀、色值一律 `theme.colors` 谱系、compile 双通道形态均符合（`button.js:92` 与 `base/table-row.vue:33` 为占位链现状）。
4. **影响面**：补两处遗漏——`/table-ex/` 列宽 section 仅 field 按钮列（`demo/src/data/table-ex/main-view.vue:852`）将开始渲染字段值；空组（含配置返回空/非数组）由「不绘制」改为「落占位」。旧注释 `text.js:43`、`demo table-ex main-view.vue:784` 与实现冲突，已列入改动清单。自检断言核实不被破坏（`self-checks/painter.js` 窄列夹具行数足够、`contentRightX` cap 不影响断言取样点）。
5. **可实施**：三片串行、依赖与完成判据清晰，步骤有序可独立验证，无循环依赖；片2 步骤已补门控上提位置（`!dom`/`dom` 分支之前）。
6. **风险与回滚**：风险已列对策，回滚明确禁用 `git checkout`（保基线）；修正需求 2 风险表述（空组落占位、`/table-ex/` 可见变化、全无效条目组仍空）。
7. **范围**：无超验收改动；空组占位属需2-6，注释同步属实现一致性；表头底边框处理未擅改，列为异议（见下）。
8. **切片**：设计明确不标并行组（三片共享 demo 文件），跳过；各片有可观察判据、验收已归属片/终验。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是/否） |
|---|---|---|---|---|
| 1 | `02-design.md` 方案概述 §2 | 「…`getButtons` 调用透传 `(record, value)`。canvas / DOM 双通道经共享 compile 自动同口径，绘制层零改动。」 → 追加「空组门控上提至双通道共用（`!Array.isArray(buttons) \|\| !buttons.length → return`），canvas 空组产物改为无内容 → 落占位链（否则需2-6 的『落占位』在 canvas 无实现手段）」 | `cell-painters.js:86-91` canvasKind 分发直接返回，`drawDisplayText` 占位链 `cell-painters.js:209` 永不执行 | 是 |
| 2 | 改动清单 button.js 行 | 「compile 增加 `valueToButtons`…`getButtons(record, value)` 透传」 → 追加「空组门控上提至双通道分支之前（canvas 空组不再产 `canvasKind: 'button'`）；文件头与 `button.js:81-82` 注释同步」 | 门控现状仅在 dom=true 分支（`button.js:92`），canvas 空组无占位链 | 是 |
| 3 | 接口 4 ButtonColumn.compile | 原伪代码只列包装与透传 → 加 `const buttons = getButtons(record, value) ?? []` + `if (!Array.isArray(buttons) \|\| !buttons.length) return`；补空组产物变化（原 `{canvasKind:'button',buttons:[]}` → `{}`）、落占位链证据、与 DOM 同口径（`base/table-row.vue:33`）、全无效条目组（非空数组）双通道仍空 | `resolveCellContent` 返回 `{}`（`cell-content.js:154-157`）；`drawButton` 门控 `canvas-kind-painters.js:131`；DOM 占位模板 `base/table-row.vue:8-9,33` | 是 |
| 4 | 风险与回滚 需求 2 | 「仅 `column.buttons` 缺省时行为变化；显式配置路径逐字不变」 → 「缺省新增渲染；显式非空产物逐字不变；空组（缺省/配置返回空或非数组）由『不绘制』改为『落占位文字』（无 placeholder 仍为空）；`/table-ex/` :852 仅 field 按钮列开始渲染字段值；全无效条目组双通道仍空」 | `demo/src/data/table-ex/main-view.vue:852` 现为空渲染；`canvas-kind-painters.js:200-226` 空哨兵；`base/table-row.vue:8-9` items 分支 | 是 |
| 5 | 实施步骤 片2 | step1 只列包装/透传；完成判据无空值项 → step1 加门控上提（`!dom`/`dom` 之前）与注释同步；判据加「`actions: null` 行 canvas 落列级占位 `--`」 | 同 #3 | 是 |
| 6 | 测试计划 需3-b | 「末列右缘以右、行线 y 处取样为背景色」 → 追加「表头底边框按现方案整宽，不在本判据，见未解问题 3」 | `paint-header.js:279-280` 整宽；避免验证者按字面在表头线取样误判 | 否 |
| 7 | 接口 2 drawTextValue | 加「下划线 x 与文本起点同口径」：left=`textAnchorX`，center/x−w/2，right/x−w；缺换算时 center/right 列自锚点向右溢出 | `textAnchorX` 对 center/right 返回锚点而非左缘（`cell-text.js:85-91,125,148`）；对照 `link-items.js:23,84`（先按 align 求左缘再画） | 否 |
| 8 | 测试计划 环境行 | 补像素探针 DPR 换算 | 画布物理尺寸 = CSS×dpr（`use-relayout.js:34-38`）、`setTransform(dpr…)`（`painter.js:249-251`）；直接按 CSS 坐标 `getImageData` 会读错像素 | 否 |
| 9 | 测试计划 需1-1 | 「断言 canvas `style.cursor`」 → 「断言 `.mu-table-ex__sticky` 的 `style.cursor`（光标绑 sticky 壳）」 | `table-ex.vue:16-17,415-417`；canvas 无 cursor 样式 | 否 |
| 10 | 测试计划 需2-4 | 「渲染与改动前一致」 → 明确期望「行1 `编辑`(缺省)+`删除`(red)、行2 `详情`(indigo)」 | `demo/src/data/table-ex-basic/main-view.vue:140,158` 数据值；免验证依赖不可得的「改动前」快照 | 否 |
| 11 | 接口 1 | `cell-content.js:81` → `:80` | 实际行号：`column.link !== true` 在 `cell-content.js:80` | 否 |
| 12 | 改动清单 text.js 行 | 只列 compile 产物 → 追加注释同步 `text.js:41-43`、`demo/src/data/table-ex/main-view.vue:784` | 两处注释明写「canvas 仅链色文本/无 hover 下划线」，与本轮实现冲突 | 否 |
| 13 | 风险与回滚 需求 1 | 「自检无 canvasKind 'button' 断言（已 grep 核实）」 → 「无 text link 产物形状断言；存在 `canvasKind === 'button'` 断言但夹具均非空」 | `demo/src/data/table-ex/self-checks/cell-painters.js:972` 确有该断言 | 否 |
| 14 | 方案概述 §3 | 「DOM 通道格线为 td 边框、天然随内容截断」 → 「DOM 列宽铺满容器（`table-layout: fixed` + `min-width: 100%`），不存在列少空白区」并给出出处 | `base/table.scss:22-28`；避免实现者误以为 DOM 已处理 sparse 场景 | 否 |
| 15 | 接口 5 | 追加表头底边框/表头列线的范围说明（整宽、不截断、与首行顶线同线） | `paint-header.js:186-230,279-280`；`paint-gridlines.js:91-92` | 否 |
| 16 | 未解问题 1 | 只记「维持现状，待裁定」 → 给明确裁定建议（本轮维持现状、理由、如按字面口径的一行改法与结果），标注不阻塞 | 00-task 验收无空表判据；0 行时公式自动等于 `headHeight`（`layout.js:321`、`row-geometry.js:238`） | 否 |
| 17 | 未解问题 3（新增） | — → 记「表头底边框是否计入需求 3-b 水平格线」及两种裁定的实现差异 | `paint-header.js:279-280`、`paint-gridlines.js:91-92` | 否 |
| 18 | 实施步骤 片2 完成判据 | 「canvas 与 DOM 同落占位」 → 「canvas 落占位；DOM 同口径见模板，本 demo 无 DOM 夹具」 | `demo/src/data/table-ex-basic/main-view.vue` 仅挂 canvas 组件；`base/table-row.vue:33` | 否 |

## 未解决异议（累计）

1. [新增] 位置：`02-design.md` 接口 5 / `src/components/table/ex/table-paint/paint-header.js:279-280`
   — 问题：表头底边框（`fillRect(0, headHeight-1, stickyWidth, 1)`）在列宽和 < 容器宽时仍整宽，需求 3-b「水平格线不超过最后一列右侧」是否含此线未定义；若含，当前方案不满足，若不含，设计与验收须写明，否则验证者按字面取样会判需3-b 失败。
   — 证据：`paint-gridlines.js:91-92` 明示「首行顶线 r=0 由表头底边框承担」，即该线属行线序列；`paint-header.js:279-280` 用 `stickyWidth` 整宽绘制；设计测试仅取体行线 y（需3-b），不覆盖此线；DOM 侧无 sparse 场景可作参照（`base/table.scss:22-28` 列宽铺满）。
   — 设计者上次回应（无，r=1）。
   — 建议修法（用户裁定）：(a) 计入 —— `paintHeader` 末线右界 cap 至 `contentRightX`（与 `paint-gridlines.js` 同式，表头背景仍整宽，改动 1 行）；(b) 不计入 —— 在设计与 00-task 验收口径注明「表头底边框属表头边框，不截断」。倾向前者（与「首行顶线」语义一致）。
   影响：不阻塞其余三片实施；实施到片3 前需定稿。
