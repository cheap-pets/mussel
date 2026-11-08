# 实施记录 — 注释精简 批5（composables 簇）

## 改动文件（仅注释，零代码 token 变更，diff 已核）

| 文件 | wc 前→后 | 处理 |
|---|---|---|
| src/components/table/ex/composables/use-cell-click.js | 395→393 | 删 2 条复述：L134 `// check 翻转后 nextTick 重绘该行`（复述 toggled→invalidateRow 代码）；L184 `// 空白延伸区命中（beyondCols）无对应列，仅选中行`（与紧邻 selectRowOnly JSDoc 重复，beyondCols=空白延伸区已在源头 hit-test.js:50 JSDoc 文档化） |
| src/components/table/ex/composables/use-pointer.js | 284→283 | 删 1 条复述：isSameHoverItem JSDoc「条目悬停相等判定：行列 + 条目身份（kind/index）+ disabled 全等」——逐项复述函数体五个比较 |
| src/components/table/ex/composables/use-tree-rows.js | 248→248 | 过时引用更新 1 处：L86 「painter/interactions/editor」→「painter/interaction/editor」（旧 interactions.js 经 B4 拆为 interaction/；批2 paint-utils 同款先例；interaction/cell-selection.js:22 现为 displayRows 消费方） |
| use-relayout.js | 240→240 | 无改动：逐条核验均为契约注释（solveWidths 现存 layout.js:96、「见 preparedColumns 注释」现指 table-ex.vue:167 均核验有效） |
| use-table-instances.js | 96→96 | 无改动：全部为锚定补偿/主题链/wrap 缓存契约注释 |

合计 1263→1260（−3）；精简注释 4 处（删 3、过时引用更新 1）。

## 保留的契约注释（逐字未动）

- use-cell-click.js：@host-* 注解块（1-16 行）、emitHeaderClick/tryEditButtonClick/tryToggleTreeRow/checkColumnState/finishCellClick 事件链 JSDoc、编辑开启事件序（先选中链再开编辑/点击是选中唯一入口）、selectRowOnly 空白延伸区契约、表头清除选中（非选中通道）、编辑按钮先于树槽判定、树槽消费原始 hit、cell-item-click payload 契约（DOM 版对齐/button 通道/capped dots '...' 键名）、openEditorAt 浮层盒/合并区域口径、veil 接线时序（先改引用再失效）、watch veil 清理、toPxStyle 浏览器行为依据、文件头职责行
- use-pointer.js：@host-* 注解块、hitAt 合并归一（rawHit 供树槽/树列不参与归一）、hoverCellOf 空白延伸区放行语义、bandRegionsOf/colBandRegionsOf/hoverRegions 脏区去重与合并扩展防残影、updateHoverItem 独立接线、applyItemCursor 光标覆盖口径（link 门控同谓词）、tooltip 调度/收起契约、pointerdown 提交时序
- use-tree-rows.js：@host-* 注解块、isLeaf 未映射即关闭（对齐 tree 组件兼容语义）、recordsVersion 就地回填重算依赖、DFS 平铺、树形列缺省接线、applyTreeToggle 全链（commit→toggle→必发 tree-expand/collapse→锚定补偿→窗口同步）、三条树 watch 契约、flatRows 五平行数组 @returns 结构
- use-relayout.js：@host-* 注解块、relayoutAndRedraw 两遍式管线、relayout 出口统一精算三连、滚动路径不重跑 solveWidths、rAF 合帧、relayout 源合一 watch 六源副作用序、渲染 props watch（placeholder 不进列准备）
- use-table-instances.js：@host-* 注解块、onThemeChange 主题刷新链与锚定基准先行捕获、wrap 缓存 key 维度、文本测量单一事实源、首帧 nextTick relayout

## 死代码存疑清单

无——五文件未发现注释掉的代码块。

## 偏离

无。

## 自检

- `git diff --unified=0`（三触碰文件）：本批 hunk 仅注释行增删；diff 中 use-cell-click L19 import 改 click-resolve、use-pointer 文件头/@host-reads/import 拆分 hunk 为工作区未提交的 B4 重构改动，非本批产生（批2 同款情况）
- 过时引用核验：solveWidths（geometry/layout.js:96）、preparedColumns 注释（table-ex.vue:167）、hit-test.js:50 beyondCols JSDoc、interaction/cell-selection.js:22 均存在
- `/d/npm/global/eslint` 三触碰文件：0 error 0 warning（ESLINT_OK）
- 未跑 build（按派发留待终验）；未改 scripts/、未改自检、未 commit
