VERDICT: REVISE

## 检查项结论（每项一行）

1. **覆盖**：AC1–AC5 均有设计与测试计划映射；但 4b（02-design.md:163）与问题 7（:186）的验证手段不可执行、4a（:174）判据错误（见 M2/M3/M4），新增测试文件 self-checks/painter.js 已列入改动清单与步骤。
2. **事实一致**：逐条抽查通过——问题 1 的 `_fixed`/`fixed-col`/`last-fixed-col` 全仓消费点确为 `table.vue:187,281`、`table.scss:64,134`、`table.vue:312`；问题 2 的坐标口径与 `offsetToWrap`/`offsetParent` 成立；问题 3 的 `regionsForRows`→`fillRowRegions`→`spanKeepRows`→`trimItemHits` 推断链成立（锚行恒 `< end`，豁免分支确为死代码）；问题 6 双通道等价成立；问题 4/5/7 的行号与行为核实成立；1 处支撑表述过宽（见 m3）。
3. **约定一致**：符合（layout 纯函数、`createWarner` key 去重、自检 append-only、纯 JS/BEM、无新增样式）；decisions.md 为空，无额外已确认约束。
4. **影响面**：问题 1 的消费端收敛论证成立，改后 `last-fixed-col`/`fixedColumnsWidth`/onResize/指示公式自洽；问题 3 遗漏 itemHits 契约注释两处（m1）；`fixedColumnsWidth` 取值时点的既有风险未记录（m4）。
5. **可实施**：步骤有序、依赖无环、每步有判据；问题 7 的验证无执行路径（M4）。
6. **风险与回滚**：双向门、爆炸半径已列；问题 3 的“帧局部保留集”未按“修复不完整”处理（M1）。
7. **范围**：改动清单 8 文件与 AC5 一一对应，demo 载体已声明理由；工作区既有任务外未提交项多于 00-task 列举，范围核对缺基线快照（m5）。
8. **切片**：片 1/2/3 文件集两两不相交、片内依赖单向、AC 均有片或“终验”归属；若采纳 M4 建议在 painter.js 追加断言，需计入片 2 文件集。

## 问题清单

[major] 02-design.md:40-45（修复安全性第 4 点）— `keepRows` 是“本帧 region pass 实际绘制过的锚行集合”，任何未绘制该区域的脏区帧都会把 `row < start` 的锚行条目重新删除，修复只在该帧画过该区域时成立，任务要求消除的点击/悬停丢失仍可在这些路径复现 — 证据：`beginSpanFrame` 每帧 `new Set()`（src/components/table/ex/table-paint/paint-body.js:22-24）；`endSpanFrame` 无论本帧画了什么都用该集合裁剪（:27-31）；`trimItemHits` 删除窗口外全部行（:48-53）；header 帧（painter.js:44-52、207-211）不调用 `paintCellRange` ⇒ `keepRows` 恒空，而 `headerChecked` 变化正是 header 帧入口（use-relayout.js:228）；其他行/格的 hover 与选中帧只把自身脏区内的区域加入集合（use-pointer.js:126-152、use-cell-select.js:61-62、use-cell-click.js:331-332）；设计第 44 行已承认该行为但按“非回归 + 下次相交帧恢复”处理，而点击/触摸可发生在恢复帧之前 — 建议：把豁免集改为“与当前窗口相交的区域锚行”——`endSpanFrame` 增传 `spans`，用 `regionsForRows(spans, viewRows.start, viewRows.end)` 取 `region.row`（或与 `spanKeepRows` 取并集），与帧内容无关、同样有界（≤ 相交区域数），约 3 行改动即可消除帧序依赖。

[major] 02-design.md:180（步骤 2.3）、:163（测试计划 4b）— demo spans 场景不存在“多行合并区域内的 link/tag/button 条目”，2.3 的点击判据在修复前后都无法出现，4b 无有效验证入口 — 证据：spans 场景的合并来源只有 `autoRowSpan` 的文本列（分类/子类/名称，demo/src/data/table-ex/main-view.vue:944-947）与单行 `colspan: 'rest'` 小计区（:958-960；`resolveDeclaredColspan` 见 spans-method.js:215-232），链接列（:954）不参与任何纵向合并；小计行记录无 `links` 字段（:926-934），且 'rest' 区域主格是小计文本，被覆盖的图片/链接格不绘制内容（paint-body.js:116-157）——区域锚行（小计行）`rowspan = 1`，滚出窗口即整行不可见 — 建议：删除 2.3，改由 2.1 自检断言（浏览器面板可判红/绿）+ 4c 面板全绿承担 4b；若坚持端到端，须扩展 demo 夹具（新增覆盖链接列的多行区域），并在改动清单与范围核对中列明。

[major] 02-design.md:174（步骤 1.3 判据）— 判据坐标口径错误且给定滚动位置不产生遮挡，按字面执行会在正确代码上失败、或在未修复代码上通过（无判别力） — 证据：`--hover-col-left` 写入的是内容坐标 `pos.left + offset`（src/components/table/base/table.vue:285），`pos.left` 为相对 `offsetParent = wrap` 的 `cell.offsetLeft`（table.vue:229-238；wrap 由 v-mu-scrollbar 设 `position: relative`，src/components/scrollbar/scrollbar.js:28-35），正确期望是“第 2 列右缘视口 x + scrollLeft”，判据却写“left = 第 2 列右缘 x”（视口值）；demo 固定列表示例列总宽 1280（demo/src/data/table-advanced/main-view.vue:144-151），容器约 998（demo/src/common/style.css:104-113、209-229 + src/styles/root.scss:167-169 全局 border-box），最大 scrollLeft ≈ 282；“滚至中部”（≈141）时第 4 列视口左缘 = 440−141 = 299 > 固定区 220，无任何列被遮挡，旧代码同样输出 offset = 0；须滚至最右（≈282，第 4 列被遮挡约 62px）；另表头 `th` 无 hover 绑定（table.vue:15-30；仅 td 的 mouseenter，table-row.vue:9,91），“hover 表头”不可执行；`setHoverIndicator` 为 30ms 无前沿节流（table.vue:297-305），断言前需等待 — 建议：判据改为“scrollLeft 取最大；hover 第 4 列表体可见条带（视口 x 220..276）；`--hover-col-left` = 第 2 列右缘视口 x + scrollLeft（内容坐标），`--hover-col-width` = 列右缘视口 x − 固定区右缘；等待 ≥50ms”。

[major] 02-design.md:186（步骤 3.3）— “临时在自检或控制台调用 buildSpans”无可行入口，item 7 的修复无浏览器验证手段 — 证据：demo 为打包产物（package.json `demo:build` = `vite build --watch`），页面无模块图 URL，控制台无法 import `buildSpans`；self-checks/spans.js 已被任务外未提交改动占用，而设计限定 self-checks 下仅改 painter.js — 建议：把数组形态警告断言并入 painter.js 末尾新增 check（该文件已 `import { buildSpans }`，demo/src/data/table-ex/self-checks/painter.js:33；`buildSpans({ ..., warn })` 注入捕获，spans.js:29-40 已支持 warn 参数），仍保持 8 文件清单；步骤 3.3 判据改为“自检面板新断言绿”。

[minor] 02-design.md:80-88（改动清单）— 问题 3 改变了 itemHits 契约（锚行 `< start` 保留），两处描述该契约的注释未列入同步范围 — 证据：src/components/table/ex/table-paint/painter.js:10-11「批次结束按可视行裁剪」、src/components/table/ex/interaction/click-resolve.js:185-186「窗口外行不在集合内 → null」，修复后对 spans 表格不再成立 — 建议：随同片 2 各改一句注释并补入改动清单/范围核对，或明确记录“不改”的理由。

[minor] 02-design.md:186（新警告文案）— 文案「该行忽略」与 key 去重口径矛盾：`spanMethod:array` 经 `createWarner` 去重（spans.js:29-40、spans-method.js:260-262）只发一条，而所有返回数组的行都被忽略 — 建议：去掉“该行”，如「spanMethod 返回值须为 { 列键: 跨度 } 对象，收到数组，返回值忽略（同类不再重复提示）」。

[minor] 02-design.md:59（问题 6 证据第 3 条）— 「估高链不消费 `_render`」不成立，仅“bool 列不进入该路径”成立 — 证据：src/components/table/ex/geometry/row-geometry.js:59-73 `linkItemCountOf` 消费 `col._render`（含 `_render.count` 与产物 items 计数），仅在 `isLinkColumn` 门控下调用（:133、:370-373，`desc.isEntry` 见 :82-87） — 建议：表述限定为“bool 列不进入 linkItemCountOf 分支”，避免后续把 `return null` 统一误判为零行为变化。

[minor] 02-design.md:31 与 :276/:321（`fixedColumnsWidth`）— 设计以“sticky 格 offsetLeft 已含滚动位移”为前提，但 `onResize` 直接用 `th.offsetLeft` 求和；若 `sizechange` 在横向已滚动时触发（table.vue:8-9 监听 sizechange），`fixedWidth` 会含 scrollLeft，问题 2 的新公式随之偏大 — 属既有缺陷、非本批引入，但影响“遮挡量正确”的成立条件 — 建议：记录为已知限制（不改代码），验证脚本避免滚动后再触发 sizechange；如选择在 `onResize` 内减 scrollLeft 则须列入范围。

[minor] 02-design.md:166（AC5 核对手段）— 工作区已有大量任务外未提交项（实际 `git status --short` 含 docs/、docs-site/、skills/、agent-docs/ 等 20+ 项，超出 00-task 列举），“git status 仅含改动清单 8 文件”无法直接判定 — 建议：片 1 开始前保存 `git status --short` 快照，终验对比前后差异集合（新增项应恰为 8 文件）。
