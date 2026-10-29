# 探索报告

任务：table-ex 三项问题（00-task.md「目标」）。基线 `mussel-table` @ `1c8f326`，工作区干净（仅本任务目录未跟踪）。`decisions.md` 为空文件（1 行，无内容）。

环境异常：**demo 站点 `:3000` 未监听**（`netstat` 无条目、playwright `ERR_CONNECTION_REFUSED`）。00-task.md「验证环境」称已运行，探索时已停。问题 2 的运行时复现受阻，见「未解问题 1」。

---

## 相关代码

### 问题 1：tag/button/progress 等图形组件文本垂直偏上

**触发问题的代码与疑似根因：**

- `src/components/table/ex/cell-painters.js:259` — 全文唯一垂直锚公式：`centerY = Math.round(box.y + ((regionHeight ?? rowHeight) - ROW_TOP_INSET) / 2 + 0.01)`；`box.y = rect.y + ROW_TOP_INSET`（:254，行顶格线占 1px）。对 36px 行 centerY ≈ rect.y + 19（.5 恒向上取整）。
- `cell-painters.js:266` — `drawCell` 入口统一设 `ctx.textBaseline = 'middle'`；全部文本绘制路径均以 `centerY` 为 fillText 纵锚：
  - tag pill：`drawTag` :873-904（pill 矩形 `y = centerY - TAG_HEIGHT/2`，:887；文本 :901 `fillText(text, x + TAG_PADDING_X, centerY)`）
  - button pill：`drawButtonPill` :1106-1142（:1139 同式）
  - progress：`drawProgress` :993-1045（百分比 label :1021 同式；轨道 :1028 同以 centerY 居中）
  - link/check/普通文本：:812、:862、:495 同式
- **疑似根因（推测，需像素验证）**：canvas `textBaseline='middle'` 按 em square 中点定位字形；DOM 版 `.mu-tag`（`src/components/tag/tag.scss:1-25`）为 `inline-flex; align-items: center; line-height: 1`，浏览器按字体 ascent/descent 行框做光学居中。两者口径不同，CJK 字形在 canvas 'middle' 下常见光学偏上。偏移方向与像素量需运行时 canvas 像素测量确认。
- 规格镜像关系：`cell-painters.js:38-43` 注释声明 TAG_HEIGHT 20 / TAG_PADDING_X 8 / TAG_FONT_SIZE 12 / TAG_RADIUS 4 镜像 `tag.scss .mu-tag`。pill 矩形与 DOM 一致，疑点集中在字形基线而非 pill 几何。

**范围事实：**

- table-ex canvas 无 badge 列型/条目类别：`resolveItemKind`（`cell-painters.js:578-588`）仅 check/img/link/tag/text 四类 + canvas 专属 progress/button（:59、:324-346）。demo `itemColumns`（`demo/src/data/table-ex/main-view.vue:640-653`）也无 badge 列。验收标准「tag/badge」中的 badge 落点需澄清。
- 表头文本同为 middle（`painter.js:744`），用户未提表头，仅记录。

### 问题 2：夹具「默认→多行文本」格线未重绘

**触发问题的代码与疑似根因：**

- **根因（代码确证）：`relayoutAndRedraw`（`src/components/table/ex/table-ex.vue:466-509`）结尾只做 `syncCanvasSize` + `redraw()`（:503-504），不调用 `rowGeometry.remeasureVisibleRows()`。** relayout 后行高停留在**估高**值；而估高对多行文本列恒取 1 行下界：`row-geometry.js:100-103`（`if (!precise) return 1`）+ :134-136 `rowHeightOf`（单行 = `max(rowHeight, padding*2 + lineHeight)` ≈ 36px）。
- 格线绘制是布局的纯函数：行线 `paintRowGridlines`（`painter.js:580-594`）取 `viewportRowY = headHeight + rowGeometry.topAt(r) - scrollTop`（:142-144）；列线 :598-618 取 colWidths 前缀。行高不变 → 格线不动。

**「什么情况下格线会重新绘制」完整触发链路（代码事实）：**

行高更新只有两个来源：

A. **估高**（`computeRowHeights`，`row-geometry.js:370-432`，`precise:false`，无文本测量；字符串恒 1 行 :100-103，数组值/链接条目数取真值 :106-132）——经 `resolveForRelayout`（`row-geometry-controller.js:310-342`）执行，其脏判定 `isScanDirty`（:157-162）＝行集合引用 / 度量签名（rowHeight|cellPadding|cellLineHeight）/ 列语义签名 / spans 身份任一变化。调用入口全部汇聚于 `relayoutAndRedraw()`（table-ex.vue:466）：
  - watch `props.records` 引用（table-ex.vue:1289-1294，先 `scrollTo(0,0)` 再 relayout）
  - watch `props.columns` 引用（:1299-1303，先 `resetOverrides` + `invalidateMeasureCache`）
  - watch `props.recordsVersion`（:1307）
  - watch `[spanMethod, orderBy]`（:1312）
  - watch `fixedLeftColumns`（:1354）
  - 树 watch × 3（`use-tree-rows.js:191-216`：tree 开关、treeProps、treeExpandedKeys）
  - `onResize`（`@sizechange` throttle 100ms，table-ex.vue:563-565）
  - `applyTreeToggle` / `expandAll` / `collapseAll`（use-tree-rows.js:147/171/178）
  - 单行重估触发模式升级时 `remeasureUniformRow → ctx.relayout()`（row-geometry-controller.js:236）
  - onMounted 首帧 `nextTick(relayoutAndRedraw)`（table-ex.vue:1377）

B. **精算**（真值，`ensureRowMeasured` → `wrapLines` 折行，`row-geometry.js:438-486`）——仅三个触发点：
  1. `remeasureVisibleRows()`：仅被 `scrollFrame` 调用（`onScroll → rAF 合帧`，table-ex.vue:541-545、:547-561）和 `onThemeChange`（:1204）
  2. `remeasureRow(row)`：仅编辑提交 `onCommit` 的 nextTick（:575-578）
  3. `remeasureVisibleRows` 在 variable 模式外零成本早退（row-geometry-controller.js:353）

**夹具切换实际链路：** demo `main-view.vue:65-76` 夹具场景 radio `v-model="scene"` → `stageRecords`（:922-932，multiline 分支返回 `multilineRecords` 常量数组，引用必变）与 `stageColumns`（:909-920）→ `mu-table-ex` 绑定（:16-17）→ records + columns 两个 watch 同批触发 → relayout ×2（第二次 scan 因 spans 身份变化仍会重扫，仍为估高）→ 估高 rebuild → redraw。**全程无滚动则无 scroll 事件**；records watch 的 `scrollTo(0,0)` 在已在顶部时不产生 scroll 事件 → 精算永不触发 → 行高停在估高下界。

**对比先例：** `onThemeChange`（table-ex.vue:1180-1207）在 `relayoutAndRedraw()` 之后显式 `remeasureVisibleRows() + recomputeViewWindows() + redraw()`——主题链路有 relayout 后精算，数据链路没有。

**诊断签名（供修复验证）：** 切到多行文本后滚动 1px，行格线应立即跳到精算位置（scrollFrame 链路）。

**推测（需运行确认）：** 按代码推演，多行文本夹具切后的估高并非全 36px——数组列取真值（strings 5 项 min(5,3)=3 行；nums 12 项 min(12,10)=10 行），三行估高约为 [196, 52, 70]px，精算真值约为 [196, 70, 196]px。与用户「格线位置未变化」的表述存在出入（可能是指数组列之外的纯文本多行列未撑开、或整体视觉未达预期），需复现对齐症状。

### 问题 3：树节点 isLeaf 分级加载

**table-ex 现状（无 isLeaf 概念，grep 全模块无 isLeaf）：**

- 「有子级」唯一判定源：`buildChildrenIndex`（`src/components/table/ex/tree.js:37-61`）——某 key ∈ `hasChildren` 当且仅当有其他行的 parentKey 指向它。无子级行永无三角。
- 三角绘制条件：`drawTreeAffordance`（`cell-painters.js:550-567`）`if (hasChildren) drawTreeArrow(...)`；叶行仍占 16px 空槽（:566 恒返回 `level*16+16` inset）。三角形状单一事实源 `drawTreeArrow`（:528-546）。
- 命中/光标同条件：`isTreeArrowSlot`（`interactions.js:99-107`，`flatInfo.hasChildren[rowIndex]` + cellX < level*16+16）；`resolveTreeToggle` :319-323；`resolveCursor` 树槽 pointer 共用该谓词。
- toggle 链：`onClick → tryToggleTreeRow`（table-ex.vue:846-859，局部交互：不选中行、不发 cell-click）→ `applyTreeToggle`（`use-tree-rows.js:130-162`）：commit → `toggleKey` 翻转 Set → `emit('update:tree-expanded-keys', [...全量])` → relayout → 锚定补偿 → 重绘。**现有事件在展开与收起时都发、payload 是全量 key 数组（无「本次展开的是哪个 key」的直接语义）。**
- 无子节点 key 被 toggle：展开集正常翻转、事件照发，但 `buildFlatRows`（tree.js:102-131）`pushChildren` 无子可压，行集合不变——即当前对「无子但要懒加载」的节点已有一半链路，缺三角显示与 hasChildren 语义扩展。

**Tree 组件 isLeaf 参照（用户指定参照）：**

- 字段映射：`props` prop 合并 `DEFAULT_DATA_PROPS`，`isLeaf: undefined`（`src/components/tree/default-options.js:8`）——**未映射该字段时 isLeaf 属性不生效**（向后兼容的关键设计）。
- 判定（`tree-node.vue:81-87`）：`isLeaf = !childNodes?.length && (!nodeProps.isLeaf || data.isLeaf)`——即「非叶」= 有 childNodes **或**（映射了 isLeaf 字段且 `data.isLeaf === false`）。`isLeaf: false` + 无子 → 非叶 → 显示展开图标（`expandIcon` computed :109-124；叶节点用 `expandIcons.leaf`，缺省 undefined 即无图标）。
- 事件：`setNodeExpanded → onNodeExpandedChange → emit(value ? 'nodeExpand' : 'nodeCollapse', node)`（`tree.vue:79-81`；emits 声明 :42-48）。点击展开图标（:15 `@click.stop="toggleExpand"`）与双击行（:9）都走 `toggleExpand`，仅 `!isLeaf` 时切换（:148-152）。
- 懒加载现成范式：`demo/src/data/tree-advanced/main-view.vue:97-105`——`:props="{ childNodes: 'children', isLeaf: 'isLeaf' }"` + `@node-expand="loadChildren"`；`loadChildren`（:221-231）判 `node.children?.length || node.isLeaf` 后异步填充 children。demo note 原文：「子节点数据缺失时展开触发 node-expand，按需填充 children 或标记 isLeaf」。

---

## 现有约定

- 纯 JavaScript、Composition API `<script setup>`；table-ex 为 canvas 渲染，分层：`painter.js`（背景/格线/表头/hover 底色）→ `cell-painters.js`（单元格内容），交互判定在 `interactions.js`，壳只执行 emit 与状态更新。
- 跨模块镜像常量收拢于 `src/components/table/ex/constants.js`（零依赖；`ROW_TOP_INSET = 1` :39，全部垂直锚统一「格顶 + 1 + (行高 − 1)/2」式）；canvas 规格（tag/button/check）注释声明镜像对应 DOM 组件 scss，规格变更须两处同步（constants.js:17-19、cell-painters.js:34-46）。
- painter state 契约（G2-a）：壳对 `paintState` 原地变更后必须 `syncPaintState()` + invalidate/draw 同步应用（table-ex.vue:427-434）；脏区重绘一律 `immediate: true`。
- 知识库命中即采用的条目（`agent-docs/knowledge/INDEX.md`）：demo 页 URL 前缀 `/data/`（:29）；`@sizechange` 统一监听元素尺寸变化、禁直接 new ResizeObserver（:13）；tag 列 `mu-tag--{color}` 色名协议兼管 DOM 与画布（:32）；table/mappings.js 为 mu-table 与 table-ex 单一事实源、base 不得反向 import ex/（:33）。
- 组件 API/公共样式变更须同步三处文档（AGENTS.md）：`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`。问题 3 若新增事件/属性属 API 变更。

## 约束与风险

- **估高/精算双签名机制不能绕过**：`row-geometry-controller` 的 scanSignature（行集合引用/度量/列语义/spans 身份）与 measureSignature（列宽+字体主题）是性能设计核心。问题 2 若在 relayout 尾部补精算，`remeasureVisibleRows` 对 uniform 模式已零成本早退（:353），variable 模式会带来 O(可视行 × cols) 精算成本——onThemeChange 链路是既有先例（table-ex.vue:1204），成本已被接受过一次。
- **records watch 滚动复位**（table-ex.vue:1292）：懒加载若以「替换 records 引用」回填子节点会闪回顶部；就地 push + `recordsVersion++`（:1307 只 relayout 不复位）可避免。回填通道需设计定。
- `applyTreeToggle` 的锚定补偿只对有行变化的场景有意义；isLeaf 节点首扩时无行变化、二次扩（子已加载）有——toggle 链路本身幂等，风险低。
- 问题 1 若调整 `centerY` 公式或 baseline，影响面为**全部**单元格内容（文本/树箭头/check/progress/button/pill 命中区 `reportHitRect` :705-725 与 editor `editorButtonRectOf` 同锚）——改锚须全链路同步，constants.js:32-38 注释明确「全部垂直锚统一」的约定。
- 知识库坑位提示：Playwright 后台页 rAF/RO 停发（INDEX.md:43）、canvas 像素断言随锚点口径漂移（:28）、demo watch 重建清空 dist（:23）——实施后验证时相关。

## 验证方式

- `npm run build` = `build:base` + `build:ex`，各含 development + production 两次 vite build（共 4 次；package.json:10-13）。
- **无 lint script**（package.json 无 stylelint 命令行）；`.stylelintrc.json` 存在 → 用 `npx stylelint "src/**/*.scss"`；样式报错先 `stylelint --fix`（AGENTS.md）。
- 无测试框架。table-ex 有**自检套件**：`demo/src/data/table-ex/self-checks/`（cell-painters/editor/interactions/layout/painter/row-geometry/spans/text-wrap/theme/tree 十个模块），经 demo 调试面板「重跑自检」按钮触发（main-view.vue:250、:323）。行几何/绘制类改动优先补自检断言。
- 行为验证：`npm run demo:build`（watch 模式）+ `http://localhost:3000/data/table-ex/`（当前未运行，需先启动）。
- 问题 3 可参照 `demo/src/data/tree-advanced/` 既有懒加载 demo 形态做 table-ex 侧对应夹具。

## 未解问题

1. 【运行验证｜问题 2】`:3000` 未监听无法复现。需启动 `npm run demo:build` 后复现：切「多行文本」→ 记录格线位置 → 滚动 1px → 对比（应立即重排为精算高度）。同时与需求方对齐症状表述：代码推演切后数组列行高会变（估高 [196,52,70] → 精算 [196,70,196]，推测值），「格线位置未变化」具体指哪些列/哪些行未变。
2. 【用户澄清｜问题 1】验收标准中「badge」：table-ex canvas 无 badge 列型（条目类别仅 check/img/link/tag/text + progress/button）。badge 指何处的文本（DOM 参照表 `mu-badge`？还是误列）。
3. 【运行验证｜问题 1】`textBaseline='middle'` 对 CJK 的实际偏移方向/像素量：需 canvas 像素测量（demo 像素断言模式或与 DOM 参照表截图比对），决定修复是调 centerY 公式、加 baseline 偏移还是逐绘制路径微调。
4. 【设计决策｜问题 3】事件形态：task 说「事件名以设计为准」。参照 tree 组件为 `nodeExpand`/`nodeCollapse`（带 node 载荷）；table-ex 现有 `update:tree-expanded-keys` 已在 toggle 时发全量数组。新增专用事件（携带展开 key，如 tree 组件语义）还是复用现有事件，需设计定。
5. 【设计决策｜问题 3】懒加载子节点回填通道：替换 records 引用（会滚动复位）vs 就地 push + recordsVersion++（不复位），外部契约需设计定；isLeaf 字段读取是否也要走 treeProps 式字段名映射（对齐 tree 组件 `props.isLeaf` 未映射不生效的兼容语义）需设计定。
