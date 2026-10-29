# 实施记录：G2-1（demo main-view.vue）

模式：并发（波 2a / 步骤 G2-1）。白名单：`demo/src/data/table-ex/main-view.vue`（仅此文件）。
依赖：G1-a/b/c、S4、S5 已全部合入，编辑按钮回调契约以 04-impl-S5.md 实际形态为准：`col.editorButton.onClick?.({ record, recordIndex: hit.rowIndex, column: col._raw ?? col })`（命中不选中行、不发 cell-click、不开编辑）。

## 改动摘要

净变更 +82/−16，全部在 demo/src/data/table-ex/main-view.vue，对应设计问题 4/5/8：

- **问题 4（link 摘除编辑配置）**：items 场景 `itemColumns` 链接列删除 `editable: true, editor: true`，改为单行列定义 `{ caption: '链接（三态）', field: 'links', type: 'link', width: 170 }`，附 decisions [S1] 注记。fixedColumns/widthColumns 的 link 列本就未配 editor，未动。
- **问题 5（editorButton 夹具）**：新增 `import pencilIcon from '~icons/outline/pencil.svg'`（demo 构建通路先例 demo/src/common/app.js，pencil.svg 已确认存在）；默认场景「备注」列挂 `editorButton: { icon: pencilIcon, onClick: payload => logEvent('editorButton 点击', payload) }`。事件日志 summarizePayload 既有规则自动把 payload 压缩为 `{"record":"#<id>","recordIndex":n,"column":"memo"}`。
- **问题 8（A 案接线 + 成本夹具）**：
  - 排序比较器抽取 `function applyOrder (list, order = orderBy.value)`：order 为空原样返回同一引用，否则拷贝排序；比较逻辑与原 sortedRecords 逐字相同（string → localeCompare，否则三态序比较；desc 取反）。`sortedRecords = computed(() => applyOrder(records.value))` 改用之（行为不变）；显式 `order` 参数供成本夹具在 orderBy 复位后单独计时。
  - 新增 `sortedTreeRecords = computed(() => applyOrder(treeRecords))`；`stageRecords` `case 'tree'` 改 `return sortedTreeRecords.value`。`treeRecords` 保持 const 数组（applyOrder 返回拷贝，非破坏性）；`debugFlatRowsLength` 中 `buildChildrenIndex`/`buildFlatRows` 引用**未改**（按设计：行数统计与排序无关，仍按未排序原数组计算，值保持一致）。
  - 「树排序成本测量」按钮（模板置于夹具控制区 expandAll/collapseAll 同组）+ `async function onMeasureTreeSort`，严格按设计五步：① `orderBy.value = ''` → `await nextTick()`（防 orderBy 已是 name:asc 时 computed 不重算读到旧 lastRelayout）；② `performance.now()` 包裹 `applyOrder(treeRecords, 'name:asc')` 得 `sortMs`（显式传 order）；③ `orderBy.value = 'name:asc'` → 两次 `await nextTick()`（覆盖 computed → 父重渲染 → 子 props → watch 跨 tick）；④ 有效性判据先于读数字——经 `window.__ctStage().records` 全量相邻扫描断言 name 升序（`localeCompare` 非递减，与 applyOrder 字符串口径一致），未生效 `logEvent('树排序成本', { sortMs, stale: true })` 并中止（不记管线耗时）；⑤ 回读 `getLayoutInfo().lastRelayout.elapsed` / `.lastPaint.elapsed` → `logEvent('树排序成本', { sortMs, relayoutMs, paintMs })`。注释写明「不可用 lastRelayout 对象引用判新」。
- **`window.__ctStage` 调试夹具**：置于既有 `window.__tableEx` 占位块之后并列。**契约（A8 页面断言与成本夹具数据源）**：`window.__ctStage()` 返回 `{ records: stageRecords.value, treeProps: treePropsBind.value }`——records 为当前舞台数组（含场景与排序产物），treeProps 为当前绑定字段名；展开态由既有 `window.__tableEx.getTreeExpandedKeys()` 承担，两者不重复。闭包引用的 `stageRecords`/`treePropsBind` 为后置 const 声明，getter 仅在挂载后调用，无 TDZ 问题。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/table-ex/main-view.vue | G2-1（问题 4/5/8） | 链接列摘除 editor 配置；备注列 editorButton 夹具（pencil.svg + logEvent「editorButton 点击」）；applyOrder 抽取 + sortedTreeRecords + stageRecords case 'tree' 接线 + 树排序成本测量按钮 + `window.__ctStage` |

## 偏离

无。三点边界内说明（非方案偏离）：

1. **`window.__ctStage` 按终稿 getter 形态实现**：派发追加约束所述「终稿如未定义其行为，则按切换场景实现」的前提不成立——02-design.md 问题 8 节「调试夹具」、「接口 / 数据结构」节、A8 测试行三处均明确定义为 `() => ({ records: stageRecords.value, treeProps: treePropsBind.value })` 数据快照，按终稿逐字落地，契约已写入上文改动摘要。
2. **成本夹具有效性判据为全量相邻扫描**：设计写「抽样相邻项 localeCompare 非递减」，实现为全量 every 扫描（抽样的严格超集，n=10003 时 O(n) 成本可忽略，判定更强），比较口径与 applyOrder 字符串分支一致（`localeCompare` 非递减）。
3. **onMeasureTreeSort 未加场景守卫**：设计五步流程无该分支，按字面落地（函数注释与遗留节均注明运行场景 = 树场景，即 A8 断言上下文）。

## 自检

完成判据（设计「实施步骤」G2 组 / 派发追加约束）：eslint 单文件通过 + 模板/脚本自洽走查；本组不做页面级验证（self-checks 各组未齐，整包不可 boot）。

| 判据 | 方式 | 结果 |
|---|---|---|
| eslint 单文件 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/table-ex/main-view.vue` | **0 error / 0 warning**，exit 0 |
| 模板/脚本自洽 | `vue/compiler-sfc` 单文件 parse + compileScript + compileTemplate（bindingMetadata 内联，不解析 import，不触 self-checks 断裂模块） | PARSE/SCRIPT/TEMPLATE 均 0 错误 |
| 新绑定齐备 | 同上编译产物核对：`applyOrder`/`sortedTreeRecords`/`onMeasureTreeSort` 声明存在，`pencilIcon`/`nextTick` import 存在，模板 `@click="onMeasureTreeSort"` 可解析，`window.__ctStage =` 挂载存在 | PASS |
| 行为等价走查 | applyOrder 与原 sortedRecords 比较逻辑逐字同式（仅 list/order 参数化）；order 空返回同引用、非空返回拷贝；displayRecords→sortedRecords 链路行为不变；stageRecords 仅 tree 分支替换为排序产物 | PASS |
| 不变量走查 | `treeRecords` 保持 const；`debugFlatRowsLength` 未改（仍引用未排序原数组，按设计无需变更）；组件源码（src/）零触碰 | PASS |
| 事实核对 | `getLayoutInfo()` 返回 `lastRelayout: { elapsed, ... }` / `lastPaint: { elapsed, ... }`（table-ex.vue:481/:1190、painter.js:1141，均 `{...}` 展开新对象）；`~icons/outline/pencil.svg` 存在；demo `~icons/*.svg` 默认导出先例（app.js）确认 | PASS |
| 白名单 | `git status`：本轮改动仅 main-view.vue（树中 badge.*、props.js、background.scss 及 table-ex 其余文件为 G1/S 前序组在途状态，本组未触碰）；未启停服务、未 git commit | PASS |

## 遗留

- 页面级验证（A5 编辑按钮绘制/命中/光标、A8 排序断言与成本实测回填）不在本组判据，待 G2 其余各组 self-checks 落地后由 V 集成验证执行；A8 成本数字由 verifier 经「树排序成本测量」按钮回填设计问题 8 节。
- 成本夹具应在树场景运行（树开）；在其他场景点击会按同流程测量该场景管线（无场景守卫，按设计字面落地）。
- requestIconImage 的 SVG data URL 浏览器 onload 行为（R5 唯一未验点）归浏览器验证阶段。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（沿用 G1/S4/S5 环境备注；本地 node_modules 缺 eslint-config-standard）。
