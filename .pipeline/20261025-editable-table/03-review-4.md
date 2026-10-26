VERDICT: REVISE

## 上轮问题核对（第 4 轮）

### 03-human-1.md 六条（按 blocker 对待）

| # | 意见 | 结论 | 核对要点 |
|---|------|------|---------|
| 1 | tree（`props.tree` + key/parentKey） | 已解决，方案可行 | A1（:211-214）props/事件/方法齐全；A2.4（:337-373）平铺 records + `treeProps` 可配字段、迭代 DFS + visited 防环 + 孤儿挂根、展开态宽松受控、`defaultExpandLevel`、树箭头/缩进、展开收起后的几何 rebuild/锚定/clamp/commit 均有设计；`tree.js` 纯函数与 self-checks/tree 列入 G1-a；测试 #11（:715）覆盖锚定与环/孤儿。已核 tree.vue:23-40、default-options.js:1-10、tree.scss:3 引用成立。残留问题 10、13（minor） |
| 2 | 编辑 UI（单击/hover/边框与边距） | 已解决，方案可行；但删除 dblclick 的同步不完整 | A4.3/A5.2 单击进编辑与冲突矩阵完整；A5.3 hover cursor+内描边；A5.4 内容区矩形定位与两态边距推导成立（已核 input.scss:12-13 固定高、:181 边框、:249-253 focus 环、内层 input padding 0、canvas-table.scss:105-121 flex 垂直居中；`__editor > .mu-input { padding: 0 }` 后文本左缘 = padding，公式正确）。残留 blocker 1（self-checks/interactions.js 未同步删除 `resolveCellDblclick`）、minor 11（改动清单定位简写漏固定列条件） |
| 3 | 预设列类型默认宽度 | 未解决 | 默认宽常量与 A3.2 语义存在，但接入位置与 `solveWidths` 现状冲突，测试 #13 按现文不可执行（见问题 2） |
| 4 | 链接/进度/多按钮/多标签（颜色可定义） | 部分解决 | progress/button 新类型、link 多条/danger/disabled、tag 17 色绘制、itemHits 命中、`cell-item-click` 机制均有设计，变量体系（root.scss 12+5 色、tag/link class）引用成立。残留问题 3（事件 API 与 DOM table 不一致）、4（记录级颜色无法从列准备收集）、5（禁用色无快照字段），均影响验收 #14 |
| 5 | 多行文本 + 变高行虚拟滚动重设计 | 部分解决 | Fenwick 选型与三方案对比（A2.3）、估高下界+进窗精算+单调+锚定（A2.2）、缓存（wrap/measure）、树联动（A2.4）设计成立；self-checks/row-geometry 的朴素参考对照可验证。残留问题 7（数组值自动多行与 multiline 门控冲突）、8（测量/折行接口与消费方未闭环）、12（link 多条未入行高公式） |
| 7 | 遗留问题处置 | 已解决 | 03-review-3 的 6 条 minor 逐条关闭（见下表）；未解 1（文档三处同步）保持未解且不自行决定，处理正确；未解 2（MuSelect 高亮相等语义）以源码证据关闭：select.js:95-99 的 `provide('select')` 仅 mountOption/unmountOption/toggleOption，option.vue:26 `selectedValues?.value.has(...)` 单选恒 undefined，select.js:72-87 显示路径宽松命中成立 |

### 03-review-3.md minor 6 条 + 未解 2 条

| # | 结论 | 核对 |
|---|------|------|
| minor 1（bgStrong 回退口径） | 已关闭 | 改动清单 :155、A6.1 :590、A6.2 :602、风险表 :696、G2 :729 统一为 `bgStrong || hoverBg`；无残留无回退表述 |
| minor 2（DOM 同页事实错误） | 已关闭（勘误方式） | 第 2 轮回应 #1（:764）保留历史句但明确标注“不成立”，并给出修正理由；当前有效结论不再是错误事实 |
| minor 3（number 或 null 概括） | 已关闭 | :23、:223 均补“非数值输入保留原字符串、交 validate”；A5.5 :573 细则一致 |
| minor 4（editor.js:363 旧口径） | 已关闭 | :174、:730 明确同步范围含 :363（加 :8/:176/:375） |
| minor 5（e2e 像素 dpr 换算） | 已关闭 | 测试 #8（:712）写明 `dpr = canvas.width / getBoundingClientRect().width` 与 `getImageData(x*dpr, y*dpr)` |
| minor 6（git stash -u） | 已关闭 | 风险表回滚行（:697）改为 `cp -r`/robocopy 备份三目录，删除 stash 建议 |
| 未解 1（文档三处同步） | 保持未解，合理 | 依赖用户确认（:737、A8 #15），设计未自决 |
| 未解 2（MuSelect 相等语义） | 已关闭 | 源码证据见上；本轮复核 select.js/option.vue 行号成立 |

第 1、2 轮历史问题已在 review-2/3 逐条关闭；本轮抽查关键证据（painter.js:694-697 外部统计、9 文件 3,696 行、`+1` 上界、theme 计数、activeElement 断言、page.mouse 拖拽）仍成立。

## 检查项结论（每项一行）

1. 覆盖 — REVISE：10 条验收 + 5 条人工意见均有章节与测试行；但 #13 测试按现文不可执行（问题 2），#14 颜色/禁用态无法按 `--mu-*` 机制实现（问题 4/5），新增自检未注册（问题 6），自检回归被删除符号打断（问题 1）。
2. 事实一致 — REVISE：tree.vue/default-options/tree.scss、root.scss、input.scss、select.js/option.vue、tag/link、painter/editor/layout 抽样行号均成立；但 `cell-item-click` 在 DOM table 已存在（问题 3），`TYPE_DEFAULT_WIDTHS` 链与 solveWidths 现状不符（问题 2），theme 快照缺 `muted`/`bgDisabled`（问题 5）。
3. 约定一致 — REVISE：纯 JS、Composition API、BEM、受控 `update:*` 符合；但事件 payload 偏离现有 DOM table（问题 3），禁用色无 `--mu-*` 快照读取路径（问题 5）。
4. 影响面 — REVISE：漏 `self-checks/interactions.js`（问题 1）、`self-checks/index.js`（问题 6）、colors 记录级/列变更刷新（问题 4）、itemHits 双分区与内存（问题 9）、清空视口的 itemHits、tree/treeProps 运行时变更（问题 13）；默认宽链会改变现有未配 width 列行为（问题 2）。
5. 可实施 — REVISE：G1-a 判据依赖未注册的自检（问题 6）；G2 留下坏 import（问题 1）；text-wrap/row-geometry 缺测量源与消费方定义（问题 8）；测试 #13 按文字无法执行（问题 2）。
6. 风险与回滚 — REVISE：回滚已改为目录备份（正确），主要风险有对策；但 itemHits “旧条目无害”结论不成立（问题 9），记录级/禁用色未入风险表（问题 4/5），默认宽回归未识别（问题 2）。
7. 范围 — PASS：五项人工能力均在验收范围内；未改 table/注册/catalog，文档同步仍延后；新增 3 模块 + 既有文件扩展，无超范围重写。
8. 并行组 — PASS：G1-a/G1-b 文件集不相交，G2 依赖两者，G3 依赖 G2，S1 单次 build；修复时把 index.js 归 G1-a、self-checks/interactions.js 归 G2 后仍保持不相交。

## 问题清单

1. [blocker] 02-design.md:156、:508、:729（关联 canvas-table.vue:80、demo/src/data/canvas-table/self-checks/interactions.js:23、:361-395）— 删除 `resolveCellDblclick` 未同步既有自检文件 — 证据：设计在 interactions.js 改动行与 A5.2 定案删除该导出/G2 文件集不含 self-checks/interactions.js；实际该文件 :23 `import { resolveCellDblclick }`、:361-395 有整组 dblclick 断言，canvas-table.vue:80 也 import — 实施后 `/data/canvas-table/` 的 self-checks 模块因缺失命名导出在 ESM 加载即失败（或该组抛错），自检面板与 #3/#4/#5/#6/#8/#11/#13/#14/#15 的浏览器验收均无法执行 — 建议：把 `demo/src/data/canvas-table/self-checks/interactions.js` 列入改动清单与 G2，删除 dblclick 组并改为 `resolveCellClickOpen`/click 语义断言，同步模块头注释；canvas-table.vue 删除 import。

2. [blocker] 02-design.md:153、:445、:717（关联 layout.js:70-79、check.js:3-5、record-number.js:3）— `TYPE_DEFAULT_WIDTHS` 接入位置与弹性语义/测试 #13 互相矛盾 — 证据：solveWidths 把 `widthOverrides ?? col.width ?? resolveColumnType(type).width` 作为定宽分支，只有 px 为 null 的列进入 `flexes`（layout.js:70-79）；设计把 `TYPE_DEFAULT_WIDTHS[type]` 插在同一条 px 链且排在 `resolveColumnType(type).width` 之前，所有有表项的类型都会变定宽、不再均摊，与 :445“作为弹性列初始宽（与 COL_FALLBACK 同位替换）”冲突；若按后者放入 flexes 分支，则 check/rec_no（type.width 50px）也从定宽变为弹性，改变现状，且 test #13“容器足够宽时 colWidths 逐列 = TYPE_DEFAULT_WIDTHS”与均摊互斥，且“窄容器 → 弹性均摊（缺省宽列拉伸）”在当前算法下不可能（remain ≤ 0 时只保持初始宽，不拉伸也不收缩） — 验收 #13 不可执行，且按字面实施会回归现有未配 width 列的填充行为 — 建议：明确仅对“无 col.width 且无 type.width”的列用 `TYPE_DEFAULT_WIDTHS[type] ?? COL_FALLBACK` 作为弹性基线（在 else 分支替换，type.width 仍定宽）；重写 test #13：宽容器断言 `colWidths ≥ 默认宽`（或容器宽 = 默认宽之和断相等），窄容器断言等于默认宽 + 横向滚动；补“未配 width 的 text 列在宽容器被拉伸”的回归断言。

3. [major] 02-design.md:229、:453、:643、:707（关联 src/components/table/table.vue:90、column-types/link.js:60、tag.js:60、docs-site/components/table.md:220）— `cell-item-click` 被标为“本期新增”，但 DOM mu-table 已有同名事件且 payload/触发范围不同 — 证据：table.vue:90 声明该事件，link.js:60 发 `{ record, column, link }`，tag.js:60 发 `{ record, column, tag }`，文档写明 payload `{ record, column, link/tag }` 且 tag 可点击；设计 A1 :229 写“【本期】新增”并改为 `{ record, recordIndex, column, item, kind }`，且 :453/:643 声明 tag 不发事件 — 违反任务约束 1（API 与现有 table 一致）与验收 #3（逐项对照）；既有 `@cell-item-click` 处理器迁移后读不到 `link`/`tag` — 建议：A1 标注“DOM 版已有、canvas 版补齐”，payload 对齐 `link`/`tag`/`button`（可保留 `item` 作为附加键）；明确 tag 点击与 DOM 版一致发事件，或在 A1/A8 显式声明差异并给出迁移说明；测试 #14 同步。

4. [major] 02-design.md:158、:591、:449-450、:717（关联 tag.js:53、canvas-table.vue:798-802、theme.js:161-174）— `colors` 动态 map 的来源与刷新契约不成立 — 证据：设计称 `colorNames` 仅由列准备期收集（缺省 primary/danger）；但 tag 条目颜色在记录级 `tag.color`（tag.js:53），`buttons`、`progressOption` 明确支持 `(record) =>` 配置（:449-450），列准备期看不到这些色名；且 `columns` 变化只清 widthOverrides + relayout（canvas-table.vue:798-802），`createThemeWatcher` 只在挂载/观察器/DPR/手动 refresh 时 `readSnapshot`（theme.js:161-174），不重读色名 — 记录级颜色会回退灰/主色，test #14 的彩色像素断言失败，`getThemeSnapshot` 的 colors 也会过期 — 建议：快照固定读取 17 色（12 基础 + 5 语义，开销可忽略），或实现按需懒解析 + 缓存 + invalidate；`createThemeWatcher/refresh` 接受色名来源或 columns/records 变化触发刷新；自检覆盖记录级 tag/button/progress 色。

5. [major] 02-design.md:450-451、:608、:158、:589-591（关联 src/styles/root.scss:46/:55/:101/:111、theme.js:52-70）— 新禁用态使用的 `--mu-text-color-muted`/`--mu-bg-disabled` 不在 theme 快照 — 证据：canvas 绘制只能经快照/探针读变量（设计 A6.1 自身机制）；快照改动只加 `bgStrong`、`controlHeight`、`colors`（19 固定字段），无 muted/bgDisabled；而 link/button disabled 明确写这两个变量（:450/:451/:608） — test #14“disabled 置灰”无法按 `--mu-*` 约束实现（硬编码违反项目约定） — 建议：快照增 `textColorMuted`、`bgDisabled`（19 → 21），同步 A6.1 表、G1-b 判据、self-checks/theme.js 计数与 detail、测试 #3/#8/#14；或明确改用已有快照字段并说明视觉等效。

6. [major] 02-design.md:145-147、:720、:727（关联 demo/src/data/canvas-table/self-checks/index.js:15-29）— 新增 3 个自检模块未注册到聚合入口 — 证据：index.js 只 import/注册 theme/layout/cell-painters/painter/interactions/editor 6 组；设计改动清单与 G1-a 只列新建文件，不含 index.js — G1-a 完成判据“自检面板三组新断言全绿”和测试 #15“自检面板 text-wrap/row-geometry/tree 新增组全绿”无法执行（runner 根本不会跑这三组） — 建议：把 `demo/src/data/canvas-table/self-checks/index.js` 加入改动清单与 G1-a 文件集，import 并注册三组；判据改为可观察的组名/条数。

7. [major] 02-design.md:155、:271、:461-463、:175（对照 03-human-1.md:15）— 数组值“直接渲染成多行”被 multiline 门控，且与虚拟滚动模式判定冲突 — 证据：用户要求数组值无条件多行、按行数计高；A3.5 把触发限定为 `type text|link && multiline`，但改动清单又写 `_isArrayLines`“缺省按 value 是否数组逐行判定”，A2.2 模式判定只看 `columns.some(col => col._multiline)` — 数组值列未显式 multiline 时：按 A3.5 不换行（不满足意见 5）；按 `_isArrayLines` 换行但仍是 uniform 36px（行高不足，溢出/裁剪）；A3.5 同段“其他类型忽略该字段”与“任何以文本呈现的列均可 multiline”也自相矛盾 — 建议：定案数组值自动多行，并把数组值列纳入 variable 模式判定（数据相关）；或要求显式 multiline 并删除 `_isArrayLines` 缺省判定、在范围边界声明；统一“可 multiline 的列类型”规则；test #15 增加“数组值列未配 multiline”用例。

8. [major] 02-design.md:145-146、:167、:635、:155（关联 painter.js:70-87、theme.js:136-151）— 文本测量与折行的接口/消费链未闭环 — 证据：`wrapLines(text, font, maxWidth)` 与 `computeRowHeights/ensureRowMeasured` 均无 measure/ctx 参数，text-wrap 作为纯模块无法 `measureText`；painter 的 `measureCached` 是模块内私有、未导出，且 A7 声明模块间不互相 import；self-checks 又要求“注入计数 measure”（:167）；同时 A7 的消费例外只列 row-geometry/text-wrap 由 layout/canvas-table.vue/painter 消费，而 cell-painters 的 `drawText` 也需 `wrapLines` 产物 — 核心多行管线按现规格无法闭合 — 建议：text-wrap/row-geometry 显式增加注入的 `measure(text, font)`（或由 theme.js 提供测量工厂）；明确 painter 负责测量并预折行传给 cell-painters（或允许 cell-painters 消费 text-wrap），同步 A7、改动清单、G1-a 接口与自检注入点。

9. [major] 02-design.md:154、:453、:687（关联 painter.js:311、:520-572、:200-241）— itemHits“绘制行时整行替换”在双分区绘制下会覆盖，且从不清理滚出窗口的行 — 证据：全幅绘制先 `paintCellRange(viewColsRange)`（滚动区列）再 `paintFixedArea → paintCellRange({from:0,to:fixedCount})`（painter.js:568-572/:311）；按 :154“绘制行时整行替换”实现，固定列 pass 会替换同一 row 的数组，非固定列 link/button 的命中矩形丢失；风险表称“行滚出窗口后旧条目无害”，但 Map 不以窗口裁剪，10 万行 + item 列时随访问行数无限增长，与 A2 的资源占用结论不符 — 建议：itemHits 以 row+col 为粒度合并（或每次 full/region 绘制开始清空、按 cell append），绘制结束/每帧裁剪窗口外行；增加“固定列 + 非固定列 link/button 点击”e2e 与长滚内存断言。

10. [minor] 02-design.md:147、:353-354、:156、:520（关联 tree.scss:35/:74）— 树绘制/命中数据契约不完整 — 证据：`buildFlatRows` 产出 `{ rows, levels, parentKeys }`，无 hasChildren/leaf 标记；A3.4 要画“父行箭头/叶行空槽”，`resolveTreeToggle` 要“有子级”，`resolveCursor` 扩展只写可编辑格 `text`，未写 A3.4 承诺的箭头槽 `pointer`；设计引 tree.scss:37，实际 pointer-events 隔离在 :35（auto）/:74（none） — 消费方要么另行传递 childrenIndex（未定义），要么 O(n) 反查 — 建议：flatInfo 增加 hasChildren 平行数组（或 parentFlags），传给 painter/hitTest/resolveCursor；补箭头 cursor 规则与自检。

11. [minor] 02-design.md:157 vs :532 — 改动清单的 `computeEditorStyle` 简写漏固定列条件 — 证据：:157 写 `left = colLefts[i] − scroll + (border ? padding − 1 : padding)`；A5.4 :532 为 `colLefts[i] − (i < fixedCount ? 0 : scrollLeft) + ...` — 按改动清单实现会使固定列编辑浮层在横向滚动后错位 — 建议：统一为 A5.4 表达式；self-checks/editor.js 保留并扩展固定列 + 横向滚动用例。

12. [minor] 02-design.md:146、:295-299、:451 — 多行 link 的行数未接入行高公式 — 证据：A3.3 要求 link 多条 `lines = links.length`，但 A2.2 行高公式只有“数组值列 value.length / 字符串列”，links 来自 `links` 配置或 render items，不一定等于 value；computeRowHeights/ensureRowMeasured 无对应分支 — 多行 link 行高会偏小（文字/条目溢出） — 建议：在行高管线增加 link items 分支（评估 links 函数或 render items 并计入缓存）；test #15 增加 multiline link 行高断言。

13. [minor] 02-design.md:211-213、:798-802 — 新增 `tree`/`treeProps` props 的运行时变更未接入刷新/重建 — 证据：A1 新增两 prop；现有 watch 表只覆盖 records/columns/recordsVersion/渲染 props/headerChecked/selected/fixedLeftColumns，`tree`/`treeProps` 变化不会重建 displayRows、rowGeometry、spacer 或锚定；`treeExpandedKeys` 的覆盖规则有描述，但同样未列入 watch 契约 — 建议：watch `tree`/`treeProps`（清展开集或重建）→ 重建平铺 + 几何 rebuild + spacer 同步 + 锚定 + 整幅重绘；补 demo 切换断言。
