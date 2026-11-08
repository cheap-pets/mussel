# 探索报告

基线：branch dev @ e6354ee，工作区 clean（00-task 记录；结构图 table-ex-structure-map.md 基准 ee16eb4+批次 B1–B6 已随 e6354ee 入库，本文所有行号均为本次直接读源码实测，非引用结构图）。

## 相关代码

edit-button 全扫结果（fff grep：`edit-button` / `editButton` / `editButton|EditButton`，src 与 demo/src 全量，无遗漏条目；docs-site / docs / skills 出现仅汇总：docs-site 源文件 1 处 = `docs-site/components/table-ex.md`（`.vitepress/dist` 3 处为构建产物不计）、docs 1 处 = `docs/quick-reference_components.md`、skills 1 处 = `skills/mussel-ui/references/components/data.md`，均不展开——00-task 约束本次禁改文档）。

### src 功能实现（核心链）

- src/components/table/ex/interaction/edit-button.js:16-31 — `isEditButtonHit(hit, col, { layout, spans, snapshot })`：命中判定（pointer 光标与 click 派发共用）；门控 = 列配 `editButton.icon` 且 `resolveIconEntry` 查表命中（未注册名两边一致判失败——不绘制、不命中）且指针落在 `editButtonRectOf` 区矩形内（半开区间）。无编辑态判定。
- src/components/table/ex/table-paint/paint-overlay.js:188-210,235 — `paintEditButton(ctx, state, hover)`：hover 覆盖层最上层绘制；仅门控 `resolveIconEntry`（L190-192，未注册 return），经 `drawIconGlyph` 绘制（svg 走 requestIconImage 缓存管线，onLoad → `state.onImageLoad` 转 invalidateCell）。无编辑态判定。
- src/components/table/ex/editing/editor-geometry.js:49-61 — `editButtonRectOf(rect, { padding, rowHeight })`：区矩形单一事实源（painter 绘制与壳命中共用），right-align x = 格右 − padding − 24、24×24。
- src/components/table/ex/composables/use-cell-click.js:24,51-72,190 — import `isEditButtonHit`（L24）；`tryEditButtonClick`（L54-72）命中即 `emit('edit-button-click', { record, recordIndex, column: col._raw ?? col })`（L65）；onClick 分支序：编辑按钮在树槽之前（L190 注释）。
- src/components/table/ex/composables/use-pointer.js:20,218-226 — import `isEditButtonHit`（L20）；`applyItemCursor` 内命中编辑按钮区 → 光标 pointer（L219-226）。
- src/components/table/ex/table-ex.vue:153 — `defineEmits` 声明 `'edit-button-click'`（L140-154 全部事件 kebab-case）。
- src/components/table/column-types/icon.js:16-29 — `resolveIconEntry(name)`：注册名 → `icons` 注册表项原引用的单一查表入口（icon 列 compile / button 图标绘制 / paintEditButton / isEditButtonHit 四处共用，L13-14 注释）；未注册 dev warn 一次（L21-26）、返回 null 由调用方分支处理。
- src/components/table/ex/shared/constants.js:44-45 — `EDIT_BUTTON_AREA = 24`、`EDIT_BUTTON_ICON_SIZE = 16`（命名含 EditButton）。
- src/components/table/ex/cell-paint/icon-image.js:72-101 — `drawIconGlyph`：icon = 注册表项原引用（非注册表形态不入）；svg 形态 requestIconImage loaded 才 drawImage；cls 形态 glyphStatus ready 才 fillText、pending 静默 + whenGlyphReady 重绘登记、failed 不绘。

### demo/src

- demo/src/data/table-ex/main-view.vue:49 — 模板 `@edit-button-click="onEditButtonClick"`。
- demo/src/data/table-ex/main-view.vue:468-476 — 备注列 `editButton: { icon: 'dots' }`（L471）、启用列 `editButton: { icon: 'demoGlyphA' }`（L476，cls 形态）；两列均 `editable: true, editor: true`；属 `createDefaultColumns()`（L415）= 默认场景初始列集（L525）。
- demo/src/data/table-ex/main-view.vue:1193-1197 — `onEditButtonClick` → `logEvent('edit-button-click', payload)`。
- demo/src/data/table-ex/main-view.vue:341-344 — `installIcons({ demoGlyphA: 'mu-demo-glyph-a', demoGlyphB: 'mu-demo-glyph-b' })`（cls 夹具）。
- demo/src/data/table-ex/self-checks/painter.js:27,1134-1189 — 编辑按钮绘制自检：import `editButtonRectOf`（L27）；用例内 `install` 一次性注册名 + 列配 `editButton`（L1140-1148）、`editButtonRectOf` 区断言（L1153-1158）、hoverMode=none 整体抑制断言（L1183-1184）；注释含 paintEditButton（L1161）。
- demo/src/data/table-ex/self-checks/editor.js:20-22,35,677-721 — `editButtonRectOf` 几何 4 例（L677-703）+ `editButton 门控 resolveIconEntry：注册名命中/未注册判失败`用例（L706-721）；import `editButtonRectOf`（L35）。
- demo/src/data/table-ex/self-checks/cell-painters.js:155,2468 — 图标绘制断言注释与 `resolveIconEntry` 注册/未注册返回值断言（editButton 门控同源表述）。

## 现有约定

### 图标机制

- 按钮图标名来源：列配置 `editButton.icon`，协议 = 注册名字符串（edit-button.js:1-2 注释、editor.js self-checks 用例名"editButton.icon 协议 = 注册名"）。渲染在 canvas（paintEditButton → drawIconGlyph），不经 mu-icon 组件（mu-icon 仅 DOM 条目路径，icon.js:95-97）。
- 已安装图标可判定来源：运行时注册表 `icons`（src/icons/index.js:9 模块级对象，:323 `export { icons, install }`）。静态种子 = `install(tablerIcons, 'svg')`（index.js:306；src/icons/tabler-icons.js 44 行、28 个具名 svg 导出：X/check/x/ok/info/alert/question/chevronUp/Down/Left/Right/arrowDownLeft/arrowUpRight/list/grid/dots/search/file/folder/folderOpen/sun/moon/calendar/clock/star/starred/leftExpand/leftCollapse，另有非导出 `loaderSvg` :1）+ :308-321 三个合成项（windowClose/treeNodeExpand/dropdownExpand）= 内置 31 名。`~icons` alias → `node_modules/@tabler/icons/icons`（vite.config.js:70），逐文件显式 import，非构建期 glob——tabler 未被 import 的图标不注册。运行时可经 `installIcons`（src/index.js:6,55,66）扩展（demo/src/common/app.js:12、demo 页面均有注册）。
- 未知图标名处理惯例：`resolveIconEntry` 返回 null + dev warn 一次（icon.js:21-26，不设负缓存——注册表可运行时 install）；调用方分支：绘制侧不绘（paint-overlay.js:192）、命中侧不命中（edit-button.js:17）、icon 列落占位链（icon.js:47,61-68）。即"未安装图标 → 不渲染、不命中、无运行时报错"已是现状行为；唯一遗留可议点是 dev warn 是否保留（行为决策）。
- 同类先例（条目按钮）：`src/components/table/column-types/button.js`（caption/icon 互斥、未注册 icon 忽略走 caption-only，demo main-view.vue:701-710 夹具）；条目按钮图标走 `cell-item-click` 事件，与 editButton（列级 `edit-button-click`）是两个独立特性，勿混淆（canvas-kind-painters.js:243 的 BUTTON_ICON_SIZE 属条目按钮）。

### 编辑态机制

- 状态字段：`editor.state.editing`（editor.js:61 reactive，null | 浮层视图对象）；编辑格行列由壳 `editingCellRef` 承载（table-ex.vue:203-205，get/set :271,:273），syncPaintState 归一为 `paintState.editingCell`（use-paint-state.js:92）。编辑浮层 DOM：table-ex.vue:35-59（`v-if="editor.state.editing"`）。
- 进入：click 可编辑格 → `resolveCellClickOpen` → `openEditorAt`（use-cell-click.js:138-142,274-333）→ `editor.open`（editor.js:161-204）。
- 退出：`commit`（Enter；select/date/switch 值变化即提交保持编辑；blur 兜底 setTimeout 0；容器滚动 onScroll → editor.commit；画布 pointerdown 先同步提交 use-pointer.js:265-269，决策在 hit-test.js:146-151）与 `cancel`（Esc），editor.js:246-264；关闭 veil 清理 watch（use-cell-click.js:371-388）。
- 该按钮当前在编辑态下的表现：paintEditButton 与 isEditButtonHit 均无编辑态判定——编辑中悬停任意格（含被 veil 遮蔽的编辑格本身）仍绘制按钮、仍可点击派发 `edit-button-click`（编辑格 pointerdown 先 commit 再走 click 链，use-pointer.js:269 → use-cell-click.js:190）。
- 现成可复用事实：`paintState.editingCell` 已随每次绘制同步（use-paint-state.js:92）；现成谓词 `isEditingCell(editingCell, hit)`（hit-test.js:159-163，模块内私有）已有消费先例（tooltip 门控 hit-test.js:179）。

### 命名与实现模式

- 事件命名 kebab-case，点击类后缀 `-click`（table-ex.vue:140-154：header-click / cell-click / cell-item-click / tree-expand 等）。
- 局部交互先例：树槽 toggle——不选中行、不发 cell-click、不开编辑（use-cell-click.js:74-94 注释）；编辑按钮同款"局部交互"注释（:51-53）。
- demo 交互验证惯例：`logEvent` + "事件日志"面板（main-view.vue:309）；"自检结果"面板渲染 runChecks 逐条断言（:257，调用 :1532）；`window.__canvasTable` 调试句柄（:355）。

## 约束与风险

- 00-task 约束：不改 docs-site / docs / skills；无测试框架，行为验证靠 demo 页 + 页内 self-checks。
- self-checks 为 demo 页面运行时断言（非独立 CLI）：改名后 demo/src/data/table-ex/self-checks/ 中引用的符号与配置键（painter.js:1148 `editButton` 配置、editor.js:677-721 `editButtonRectOf`/`resolveIconEntry` 用例）须同步，否则断言失败或用例失配。
- 命名外溢事实：常量 `EDIT_BUTTON_AREA` / `EDIT_BUTTON_ICON_SIZE`（shared/constants.js:44-45）与函数名 `editButtonRectOf` / `isEditButtonHit` / `paintEditButton` / `tryEditButtonClick` 均含 EditButton；`editButtonRectOf` 被 demo self-checks 两文件 import（painter.js:27、editor.js:35）。列配置键 `editButton`（edit-button.js:17、paint-overlay.js:190 消费）是否随改名（→ cellButton）属设计决策；若改键，三处用户文档将暂不一致（本次禁改文档）。
- ② 现状已满足"未安装图标不渲染、无运行时报错"（见上"未知图标名处理惯例"）；实施时改动范围以探索事实为准，勿臆造新机制。
- ③ 隐藏的位置有多个候选事实落点（绘制门控 paint-overlay.js:188 / 命中门控 edit-button.js:16 / 两者），行为决策留实施。
- 风险低项：事件更名仅 emit 点（use-cell-click.js:65）+ 声明（table-ex.vue:153）+ demo 绑定/处理器（main-view.vue:49,1195-1197）四个接点，无其他 src 消费方（全扫确认）。

## 验证方式

- `npm run build`（package.json:10）。
- eslint 全局 8.57.0，口径 `src demo/src`（`.eslintrc` 存在；`.eslintignore` 含 `demo/dist`、`/dist`、`/examples/dist`、`node_modules`；package.json 无 lint script，直接 `eslint src demo/src`）。
- 结构审计脚本（3d35d38 添加，均固定范围无参数、退出码 0/1）：`node scripts/table-ex-structure-check.mjs`（S1 禁纯转发 re-export，扫 src/components/table/ex/ 全部 .js）、`node scripts/table-ex-host-audit.mjs`（composables @host-* 注解 vs host.<键> 实际使用）。
- demo 运行时：http://localhost:3000/data/table-ex/（cache-bust 参数）；默认场景悬停「备注」（dots）/「启用」（demoGlyphA）列格右侧 24×24 区 → 点击看"事件日志"面板；编辑态经点击可编辑格进入（备注/启用列自身 editable:true editor:true）。页内"自检结果"面板看 self-checks 断言。

## 未解问题

1. （设计）事件更名目标名：现 `'edit-button-click'`，改 `cell-button` 后事件名为 `cell-button-click` 还是其他？
2. （设计/用户）列配置键 `editButton` 是否同步改 `cellButton`；改则 docs/skills/docs-site 三处文档暂不一致（本次禁改文档），需用户确认接受。
3. （设计）③"进入编辑态后不显示"的范围：仅编辑格自身隐藏，还是编辑会话期间全表隐藏？（A3 文字存在两义）
4. （设计）② 未注册名 dev warn（icon.js:21-26）保留还是调整（现状已满足 A2 主体，warn 为唯一可议点）。
