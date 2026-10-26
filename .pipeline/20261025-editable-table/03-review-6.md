VERDICT: REVISE

## 上轮问题核对（第 6 轮）

### 03-review-5.md 15 条

| # | 级别 | 结论 | 依据 / 残留 |
|---|------|------|-------------|
| 1 | blocker | 主体解决 | `TYPE_DEFAULT_WIDTHS` 已升级为 `{ width, minWidth }` 双值，弹性分支同位替换初始宽与 80px 隐式下限，`typeNameOf` 覆盖无 type/空 type 回退 text（02-design.md:17/:154/:446-452）；test #13、self-checks/layout 同步。残留：minWidth 字符串解析见 P5，拖拽下限接线见 P2 |
| 2 | blocker | 主体解决 | 多行入口改为 `maxLines`，`multiline+lineClamp` 经 `_maxLines` 映射并由 `drawCell` 识别单 `line-clamp` item 改道 `drawText`（02-design.md:156/:495）；test #15 补兼容列。残留：`lineClamp` 函数形态见 P6 |
| 3 | major | 已解决 | `computeViewRows`/`rowAt`/`relayout` 的 `rowGeometry` 改可选，未传经 `resolveRowGeometry` 回退 uniform；G2 判据恢复“壳不传参也可用”（02-design.md:154/:762/:807/:889） |
| 4 | major | 部分解决 | dots `'…'` 已改为命中并回报 itemHits，disabled 差异入 A8 #12（02-design.md:18/:232/:481/:890）；但 payload 字符口径自相矛盾且与 DOM 不符，见 P4 |
| 5 | major | 已解决 | link 已从“文本呈现列”排除，统一为条目列；行高 = `min(render 条目数, _maxItems)`，A2.2/A3.5/测试 #15 同口径（02-design.md:147/:304-312/:491-498/:891） |
| 6 | major | 已解决 | `CANVAS_ONLY_TYPES` 先于 `resolveColumnType` 分发，`canvasKind` 走 drawProgress/drawButton；items 口径修正为文本 + items 四类 + canvas 专属两类（02-design.md:156/:476/:892） |
| 7 | major | 已解决 | `computeRowHeights`/`ensureRowMeasured` 增 `treeIndents(row)`；树形列 contentWidth 扣 `16×level+16`；test #11/self-checks/row-geometry 补断言（02-design.md:147/:382/:763/:893）。回调按列返回的契约仍含糊，见 P8 |
| 8 | major | 已解决 | `defaultExpandLevel` 统一为 0-based `level <= defaultExpandLevel`，-1 = 全收起，A1/A2.4/tree.js/self-checks/test #11 同口径（02-design.md:15/:148/:217/:363/:894）。`resolveInitialExpandedKeys` 输入与 levels 来源不一致，见 P7 |
| 9 | major | 已解决 | `cellRectAt` / `paintCellRange` 单元格 rect / `paintCellRegion` 裁剪高统一改 `heightAt`（02-design.md:155/:895）；self-checks/painter 与 test #15 补断言 |
| 10 | minor | 已解决 | colors 改为 12 彩色 + 5 语义 = 17，gray 不入 map；引证 tag.scss:28-45、root.scss:1-6/:33-40/:92-95；theme 自检与测试 #8/#14 同步（02-design.md:136/:158/:648/:896）。核实 tag.scss 实际为 5 语义 + 12 彩色，修正成立 |
| 11 | minor | 已解决 | `lastPaint` 明确为“最近一次绘制调用”，外部断言限定“最近一次整幅绘制”，test #4 先触发整幅（02-design.md:155/:389/:786/:897） |
| 12 | minor | 部分解决 | `hitTest` 返回增 `x, y`，`resolveItemClick` 可用 hit.x/y 反查（02-design.md:157/:898）；树槽判定仍缺列左/scrollLeft 上下文，见 P3 |
| 13 | minor | 已解决 | paintState 明列 `displayRows`/`flatInfo`/`expandedKeys`/`tree`/`isCellEditableFn`/`editable`/`measure`/`wrapCache`（02-design.md:272/:899）；canvas-table.vue 组装行同步 |
| 14 | minor | 已解决 | switch `editorH = controlHeight`、`bordered = false`；textarea 高度 clamp 公式单列（02-design.md:158/:567-571/:900） |
| 15 | minor | 已解决 | 契约⑤扩主题/字号/行高变量，wrap 缓存按 font 失效 + 全量快速重估 + rebuild + 锚定；test #8 补跟随断言（02-design.md:159/:324/:901）。theme.js 与壳的职责表述见 P9 |

### 03-human-2.md 4 条

| 意见 | 结论 | 依据 / 残留 |
|------|------|-------------|
| 1 默认类型列宽 + 最小列宽 | 部分满足 | 默认宽/最小宽双值与无 type 回退已设计（02-design.md:17/:446-472）；但拖拽下限未接入真实 clamp 位置（P2），`col.minWidth` 字符串未解析（P5） |
| 2 text/link 数据形态 + maxLines/maxItems + textarea | 部分满足 | 文本/数字/数组、maxLines/maxItems 钳制、textarea 原生元素 + memo 约定、数组 join/split 均有设计（02-design.md:19/:137/:495-501/:908）；link 对象数组取对象属性的路径不成立（P1），`lineClamp` 函数形态不成立（P6） |
| 3 各处颜色支持内置色板 | 部分满足 | 17 色 = 12 彩 + 5 语义，progress/button/tag 颜色链路成立（02-design.md:18/:136/:477-480/:909）；link 的 `color`/`linkOption.color` 无法进入 LinkColumn 的 item（P1） |
| 4 其余按建议或自行查证 | 满足（有残留） | 03-review-5 15 条均在本轮回应表逐条处置（02-design.md:883-910）；残留 blocker/major 见问题清单 |

### 03-human-1.md 六条未被回退

| # | 结论 | 核对 |
|---|------|------|
| 1 tree | 未回退 | A1 props/events/方法、A2.4 平铺/DFS/防环/锚定、A3.4 箭头、tree.js/self-checks/test #11 均在；`defaultExpandLevel` 语义调整为对齐 tree 组件，属新增 prop 的定义修正，不是能力回退；残留 P3/P7 |
| 2 编辑 UI | 未回退 | 单击进编辑、hover cursor+描边、`editor.border` 两态边距、dblclick 删除、test #12 均在（02-design.md:16/:157/:539-582/:794）；textarea 为新增形态 |
| 3 默认列宽 | 未回退且强化 | 默认宽 + 最小宽 + `col.minWidth` 覆盖 + 无 type 回退（02-design.md:17/:446-472）；残留 P2/P5 |
| 4 新列型/颜色 | 未回退 | progress/button 新类型、tag 17 色、link 多条/danger/disabled、`cell-item-click` 均在；link 对象数组颜色属 human 2 新增要求，缺口见 P1，不是 human 1 回退 |
| 5 多行 + 变高 | 未回退 | maxLines/maxItems、Fenwick、估高+精算、锚定、树+多行、textarea 均在；残留 P6/P8 |
| 7 遗留问题 | 未回退 | review-3 minor 6 条已处置；未解 #1 文档同步仍待用户确认；未解 #2 MuSelect 相等语义维持关闭（02-design.md:27/:815-816/:921） |

## 检查项结论（每项一行）

1. **覆盖** — REVISE：验收 #11 树槽/条目点击、#13 拖拽最小宽、#14 link 对象数组颜色、#15 DOM 风格 lineClamp 的测试手段分别受 P3/P2/P1/P6 影响；新增/修改测试文件本身已全部列入改动清单与步骤（3 个新自检 + index 注册 + 5 个自检修改 + 2 个 demo 页）。
2. **事实一致** — REVISE：抽样核实 layout.js:53-108/:290-321、painter.js:110-127/:584-613、theme.js:52-72/:136-151、root.scss:1-9/:33-40/:46/:55/:92-95/:101/:111/:141、tag.scss:28-45、text.js:5-33、link.js:9-15/:46-60、tag.js:45-60、tree.vue:3/:81-95、tree-node.vue:100-106、input-types.js:3、form-field.vue:12/:61-80、input.vue:6 均成立；但 link 对象数组/颜色、dots 字符、minWidth 字符串、form 导出数量、input.scss 行号不成立（P1/P4/P5/P10/P11）。
3. **约定一致** — REVISE：纯 JS/Composition API/BEM/`--mu-*`/受控数据流/17 色口径符合；link `color`/`linkOption.color` 未落入共享 LinkColumn 的既有接口，树箭头 cursor 需要未定义的列左上下文，拖拽下限实际在 `resolveResizeWidth` 而非 `findResizeColumn`。
4. **影响面** — REVISE：漏 `src/components/table/column-types/link.js`（P1）、`interactions.resolveResizeWidth` 与 `canvas-table.vue` 传参（P2）、`resolveTreeToggle`/`resolveCursor` 的布局上下文（P3）、`resolveInitialExpandedKeys` 的 levels 输入（P7）；其余调用方/配置基本覆盖。
5. **可实施** — REVISE：P1 按设计无法实现 link 对象数组颜色；P3/P6/P7 的签名与数据来源不足；P2/P5 会导致 test #6/#13 或合法字符串 minWidth 失败。
6. **风险与回滚** — REVISE：回滚已改为三目录 `cp -r`/robocopy 备份，正确；风险表未覆盖 link 对象数组/颜色（P1）、拖拽下限（P2）、dots payload 字符（P4）、minWidth 字符串与 lineClamp 函数（P5/P6）。
7. **范围** — PASS：无超出验收标准的改动；若修 P1 需扩到 `link.js`，应在设计内显式列入范围/影响面并说明对 DOM table 的影响。
8. **并行组** — PASS：G1-a（3 新模块 + 3 新自检 + index）与 G1-b（theme + theme 自检）文件集不相交且互不依赖；G2 依赖 G1-a/G1-b，G3 依赖 G2，S1 集成；`npm run build` 仅 S1；G2 的 `rowGeometry` 可选回退可保证中间态组件壳可用。

## 问题清单

1. **[blocker]** 02-design.md:427-431/:479/:796（关联 src/components/table/column-types/link.js:9-15/:50-57、改动清单 02-design.md:150-162、回滚行 :775） — link 对象数组与 `color`/`linkOption.color` 无法按设计进入绘制：设计称 `value`/`links` 支持对象数组且对象元素原样透传 `{ caption, color, danger, disabled }`，但 LinkColumn 的 `valueToLinks` 对每个数组元素统一包成 `{ caption: el }`（对象会变成 `caption` 为对象），且 item 构造只读取 `caption/disabled/danger`，从不读取 `color`；`linkOption` 也只解构 `max/danger/disabled`。改动清单只改 canvas-table 的 9 个文件，回滚行明确“不触碰 table/ 与 form/”，因此 test #14 的“对象数组 color/danger/disabled 三态取色”与 human 2 意见 2 的“对象数组用于设置链接颜色”必然失败。 — **建议**：明确二选一并入设计：①修改 `link.js`（对象元素原样保留、读取 `color`/`linkOption.color` 并落到 item 的 class/attrs），同时把 link.js 列入改动清单、影响面与风险表，并说明对 DOM table 的行为变化；或②canvas-table 侧对 link 列做专属 render/适配，直接读取原始 `column.links`/`value` 对象并构造 item——后者需写清与 DOM LinkColumn 的语义差异及覆盖方式。

2. **[major]** 02-design.md:17/:446-452/:472/:507/:788（关联 src/components/canvas-table/interactions.js:15/:221-226、src/components/canvas-table/canvas-table.vue:624-630、layout.js:290-321） — 拖拽调宽下限没有接到真实 clamp 位置：设计称拖拽 min 缺省改为 `col.minWidth ?? base.minWidth ?? 40`，但 `findResizeColumn` 只做命中检测，真正 clamp 在 `resolveResizeWidth`（`minWidth ?? RESIZE_MIN_WIDTH`，`RESIZE_MIN_WIDTH=40`），壳传入的只有 `getPixelNumber(col.minWidth)`；改动清单 layout.js 行把该改动归到 `findResizeColumn`，interactions.js/canvas-table.vue 行也未列该传参修改。按设计实施后 text 未配 minWidth 仍可拖到 40、bool 也可拖到 40，test #6/#13 的“text 最小 80、bool 40、col.minWidth 覆盖”不通过。 — **建议**：在 G2 或 G3 明确修改 `resolveResizeWidth` 的 min 来源（或壳传入 `col.minWidth ?? TYPE_DEFAULT_WIDTHS[typeNameOf(col)]?.minWidth ?? 40`），把 interactions.js 与 canvas-table.vue 的该行列入改动清单，并补 self-checks/interactions 的 clamp 用例。

3. **[major]** 02-design.md:157/:485/:556（关联 src/components/canvas-table/interactions.js:38-60/:70-75、layout.js:250-272） — 树箭头槽的命中/cursor 判定缺少列左与滚动上下文：`resolveTreeToggle({ hit, columns, flatInfo })` 的判定式是 `hit.x − 列左 < 缩进 + 16`，`resolveCursor` 还要在“树箭头槽”返回 `pointer`；但 `hitTest` 只返回 `x/y/colIndex/rowIndex/resizeCol`（设计仅新增 x/y），没有列内容左缘、`colLefts` 或 `scrollLeft`，`resolveCursor` 的签名也未带 flatInfo/layout。实现者无法按该签名计算槽位；若退化为整列判定，则父行任意位置点按都会 toggle、cursor 也失真，test #11/#12 的“点击箭头”和槽位语义不可精确验证。 — **建议**：给 `hit` 增 `cellX`（相对单元格内容区）或把 `colLefts/scrollLeft/fixedCount` 传入 `resolveTreeToggle`/`resolveCursor`；在 A1/A4.3/A5.3 写明签名，并补 self-checks/interactions 的槽内/槽外与父/叶行断言。

4. **[major]** 02-design.md:232 与 :481/:524/:796/:765（关联 src/components/table/column-types/link.js:46-47/59-60、tag.js:45-46/59-60） — dots 条目的 payload 字符口径自相矛盾且与 DOM 版不一致：A1 写超限条目 payload 值为 `'...'`（三点 ASCII），A3.3/A4.3/test #14/风险表写 `'…'`（U+2026）；DOM 版 LinkColumn/TagColumn 的 dots 条目实际赋值为 `'...'`（`item.text = link = '...'` / `item.text = tag = '...'`），`events.click` 回传该值。故 `linkOption.max`/`tagOption.max` 路径的 `cell-item-click` 收到的仍是 `'...'`，而 test #14 断言 `'…'`；canvas 自己的 maxItems 路径若另造 dots 又与 A1 冲突。测试与实现无法同时满足。 — **建议**：统一为 DOM 的 `'...'`（并同步 A1/A3.3/A4.3/test #14/风险表），或明确区分“DOM option.max 截断沿用 `'...'`、canvas maxItems 截断使用 `'…'`”并为两条路径分别写断言；同时给 self-checks/painter 的 dots 收集断言固定字符。

5. **[major]** 02-design.md:154/:450（关联 src/components/canvas-table/layout.js:62-63/:77、docs-site/components/table.md:252） — A3.2 伪代码把原始 `col.minWidth` 直接传给 `clamp`：`clamp(base.width, col.minWidth ?? base.minWidth, max)`。但列 API 的 `width/minWidth/maxWidth` 支持 String（docs-site/components/table.md:252），现有 solveWidths 先用 `getPixelNumber(col.minWidth)` 解析（layout.js:62）；若 `minWidth: '80px'`，`Math.max(value, '80px')` 得到 NaN，列宽变为 NaN，属对既有合法配置的回归。 — **建议**：改为 `clamp(base.width, getPixelNumber(col.minWidth) ?? base.minWidth, max)`（或复用已解析的 `min` 并在 `col.minWidth == null` 时替换下限），在 self-checks/layout 加字符串 minWidth 用例。

6. **[major]** 02-design.md:156/:495（关联 src/components/table/column-types/text.js:13-33） — `_maxLines` 在 prepareColumn 阶段求值 `col.lineClamp` 不成立：设计写 `legacyFallback = col.multiline ? (ensureFn 求值 col.lineClamp ?? 10) : 1`，而 A3.5 同一处明确支持 `lineClamp: n | (record)=>n`；TextColumn 在 render 时按 record 取值（text.js:13-17）。prepareColumn 没有 record，函数形态只能得到 undefined 后回退 10，导致行高与 `drawText` 使用 10 行，而 TextColumn 实际 item 的 `--line-clamp` 可能是 3 行；行高/绘制/DOM 兼容语义分离。 — **建议**：兼容路径不要在列准备期求值函数列：保留 `col.lineClamp`，在 `drawCell` 识别 line-clamp item 时读取 `item.attrs.style['--line-clamp']`（或按 record 求值）作为该格 maxLines，并让 `computeRowHeights` 走同一求值函数；补函数形态用例（或明确不支持函数并修正 A3.5 表述）。

7. **[minor]** 02-design.md:147-148/:170/:363（关联 tree.js 新模块签名） — `resolveInitialExpandedKeys({ treeExpandedKeys, defaultExpandLevel, childrenIndex })` 的输入没有 `levels`，但同处写“level 来源 = levels 数组”。`childrenIndex` 也不含 root 集合（孤儿挂根需要 parentKeyOf/records），实现者无法按签名得到节点层级；self-checks/tree 的 0/1/-1 断言可能因 BFS 起点缺失而失败。 — **建议**：把 `levels`（或 `records/keyOf/parentKeyOf`）列入函数输入，或明确用 childrenIndex 从 root 键 BFS 计算层级；同步 tree.js 行、A2.4 与 self-checks/tree。

8. **[minor]** 02-design.md:147/:382（关联 row-geometry 新模块） — `treeIndents(row)` 只描述为“树形列内容宽减 16×level+16”，但 `computeRowHeights` 同时遍历所有多行列，回调不返回列号时无法知道 inset 只应作用于树形列；若对所有列统一扣减，会低估非树形多行列的行高。 — **建议**：明确回调返回 `{ colIndex, inset }`（或 `computeRowHeights` 接收 `treeColumnIndex`），并在 self-checks/row-geometry 加“树形列 + 非树形多行同表”用例。

9. **[minor]** 02-design.md:159/:160（关联 src/components/canvas-table/theme.js:158-175/:209-214、canvas-table.vue:843-845、A7:699） — 改动清单 theme.js 行把“全量快速重估 + rebuild + 锚定”写在 `createThemeWatcher` 的 onChange/refresh 链，但 theme.js 无 records/rowGeometry，且 A7 的模块隔离规定几何由壳消费；canvas-table.vue 行又写同一职责。实现者可能把几何逻辑塞进 theme.js 或漏在壳侧。 — **建议**：theme.js 只负责快照/font 失效信号；重估/rebuild/锚定明确归 canvas-table.vue 的 onChange 回调（relayout 前），删除 theme.js 行的重估职责表述。

10. **[minor]** 02-design.md:137（关联 src/components/form/index.js:1-21） — 设计称“form/index.js 导出名全集 17 项无 textarea”，实际文件导出 20 项（17 个输入组件 + MuForm/MuFormRow/MuFormField）；“无 textarea”结论仍成立，但计数与证据不精确。 — **建议**：改为“17 个输入组件导出（另 3 个 form 容器组件）无 textarea”，或直接引用 `INPUT_TYPES` 无 textarea 键。

11. **[minor]** 02-design.md:580/:661（关联 src/components/form/input.scss:181/:248/:253） — A5.4 引证 `input.scss:178`（实际 `border: 1px` 在 :181）与 `input.scss:249-253`（实际 `:focus-within` 在 :248，box-shadow 在 :253）；边距推导结论成立，但行号偏移。 — **建议**：按实际行号更新引证，避免实施者按错误位置核对样式。
