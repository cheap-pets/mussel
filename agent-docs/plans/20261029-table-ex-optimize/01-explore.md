# 探索报告

任务：table-ex 交叉优化设计摸底（00-task.md）。基线：`mussel-table` @ `1c8f326` + 工作区 10 个未提交改动文件（上轮 fixes 产物：src/components/table/ex 六文件 + demo/src/data/table-ex 四文件，20261029-table-ex-fixes 04-impl.md 改动清单逐一对应；另有知识库 INDEX.md 修改与 3 篇新知识条目、2 个 plans 目录未跟踪）。背景已读：上轮 01-explore / 04-impl / 05-verify-1。

---

## 相关代码

### 块 1：eslint 口径与报错清单

**配置与可执行来源：**

- `D:\workshop\cheap-pets\mussel\.eslintrc`（:1-78）— `root: true`；parser `vue-eslint-parser`；extends `standard` + `plugin:vue/vue3-recommended`；自定义规则：`vue/script-indent` error（2 空格、baseIndent 1）、`vue/html-indent` warn、`complexity` **warn 阈值 10**（:45）、`max-len` warn 120（:46-58）、`no-shadow`/`no-void`（allowAsStatement）error。
- `.eslintignore`（全文 3 行）— 仅 `/examples/dist`、`/dist`、`node_modules`。**未排除 `demo/dist`**。
- 可执行来源：**全局安装**，非项目依赖（package.json:20-32 devDependencies 无 eslint 系）。`d:\npm\global\node_modules`：eslint@8.57.0、eslint-config-standard@17.1.0、eslint-plugin-vue@9.33.0、vue-eslint-parser@10.4.0、eslint-plugin-import/n/promise 全齐；`which eslint` → `/d/npm/global/eslint`，PATH 直接可用，**无需 npx 拉取**（实测 `eslint --version` → v8.57.0，插件全部解析成功）。项目 `"type": "module"`（package.json:6）与 eslintrc（JSON 形式 .eslintrc 非模块）兼容，实测正常运行。

**报错清单——两种口径：**

① **字面口径**（00-task.md 验证命令原文 `demo/**/*.{js,vue}`）：**130,629 errors + 2,014 warnings**，77/350 文件有消息——**几乎全部来自 `demo/dist/` 构建产物**（rollup 非压缩输出，vite.demo.config.js:240 `minify: false`）：demo/dist/assets/catalog.js 74,822E、demo/dist/data/table-ex/main.js 28,181E 等。规则分布（errors）：no-tabs ×45,843、indent ×45,598、semi ×17,184、quotes ×15,295、space-before-function-paren ×2,145。**验收标准 1 的字面命令按现状不可能零 error，除非忽略 demo/dist**（.eslintignore 加一行或改 glob——改配置文件属设计决策，00-task「按既有配置执行」约束下的裁量点）。

② **源码口径**（`--ignore-pattern "demo/dist/"`，即 src/ + demo/src + demo 根配置）：**14 errors + 231 warnings**，32/305 文件有消息。

全部 14 个 error（`path:line:col [规则] 摘要`）：

| # | 位置 | 规则 | 内容 | 可 --fix |
|---|---|---|---|---|
| 1 | src/components/table/ex/painter.js:1346:1 | spaced-comment | `//` 后缺空格 | ✓ |
| 2 | src/components/table/ex/spans.js:345:5 | spaced-comment | 同上 | ✓ |
| 3 | demo/src/data/table-ex/main-view.vue:756:1 | vue/script-indent | 期望 8 空格实为 6 | ✓ |
| 4 | demo/src/data/table-ex/main-view.vue:757:1 | vue/script-indent | 同上 | ✓ |
| 5 | demo/src/data/table-ex/main-view.vue:761:11 | no-shadow | `records` 遮蔽 :395 上层声明 | ✗（改名） |
| 6-10 | demo/src/data/table-ex/self-checks/spans.js:125:14、:259:14；demo/src/data/calendar/main-view.vue:76:21；demo/src/form/color-input/main-view.vue:84:21；demo/src/form/date-input/main-view.vue:135:21；demo/src/navigation/pagination/main-view.vue:89:21（共 6 处） | quotes | 字符串须单引号 | ✓ |
| 11 | demo/src/feedback/status-box/main-view.vue:77:12 | no-unused-vars | `ref` 导入未用 | ✗（删除） |
| 12 | demo/src/home/main-view.vue:37:22 | no-undef | `__version__` 未定义（vite.demo.config.js:206-209 `define` 注入，eslint 无对应 globals 声明） | ✗（eslintrc globals 或内联注释） |
| 13 | demo/src/navigation/side-menu/main-view.vue:254:41 | no-shadow | `_` 遮蔽 :250 | ✗（改名） |

（#6-10 合并计 6 处 quotes；合计 14：spaced-comment ×2、vue/script-indent ×2、quotes ×6、no-shadow ×2、no-unused-vars ×1、no-undef ×1。）

warning 分布（231）：`vue/singleline-html-element-content-newline` ×210（集中在 demo/src/layout/box 54、data/collapse 36、layout/grid-box 33、split-box 33 等 DOM demo 页）+ `vue/multiline-html-element-content-newline` ×2——全部可 --fix；`max-len` ×10（含 demo/src/data/table-ex/main-view.vue:217 =129 字符、self-checks/spans.js:336 =128）；`complexity` ×9，见块 2。

**--fix 可行性**：实测统计（JSON 报告 fix 标记）——errors 10/14 可自动修，warnings 212/231 可自动修；不可自动修 = no-shadow ×2、no-unused-vars ×1、no-undef ×1 + complexity ×9 + max-len ×10。table-ex 模块自身（src/components/table/ex/）仅 2E（spaced-comment）+ 5W（complexity）；上轮新改的 demo/src/data/table-ex/main-view.vue 含 3E + 1W（其中 script-indent ×2 与 no-shadow 位于上轮新增代码附近，:756-761）。

### 块 2：代码复杂度与性能热点

**行数与职责（wc 实测，2026-10-29 当前 worktree）：**

| 文件 | 行数 | 职责 |
|---|---|---|
| ex/painter.js | 1441 | 绘制管线：分区绘制（表体/格线/固定区/表头/overlay）、脏区、itemHits、lastPaint |
| ex/table-ex.vue | 1403 | 组件壳：props/9 个 watch、relayout 编排、交互接缝、编辑器接线、树接线、暴露方法 |
| ex/cell-painters.js | 1271 | 单元格内容绘制适配器（列准备 prepareColumn + 文本/items/tag/button/progress/img/树槽） |
| ex/spans.js | 659 | 合并单元格：spanMethod/autoRowSpan 构建与查询索引 |
| ex/editor.js | 577 | 编辑器控制器（类型解析/样式/提交） |
| ex/row-geometry.js | 486 | 行几何（uniform/variable + Fenwick、估高/精算） |
| ex/interactions.js | 470 | 命中/光标/点击决策纯函数 |
| ex/row-geometry-controller.js | 424 | 行几何控制器（双签名缓存/进窗精算/锚定） |
| ex/theme.js | 355 | 主题探针/快照 watcher + 测量缓存 |
| ex/layout.js | 345 | 列宽求解/可视窗口纯函数 |
| ex/text-wrap.js | 291 | 折行/省略/估行数 |
| ex/tree.js | 274 | 树纯函数（childrenIndex/flatRows/expandableAt/isLeaf，含上轮新增） |
| ex/use-tree-rows.js | 252 | 树接线 composable（含上轮 tree-expand/collapse emit） |
| ex/use-column-resize.js | 136 | 列宽拖拽 |
| ex/constants.js | 48 | 跨模块镜像常量 |
| base/table.vue + table-row.vue + table.scss | 391+96+196 | DOM 版（同源 props/列协议参照） |

**复杂度（eslint complexity warn 实测，阈值 10，全为既有告警非本轮引入）：**

- spans.js:331 `applyAutoRowSpan` = **25**；spans.js:171 `applySpanMethod` = **18**；cell-painters.js:140 `prepareColumn` = 15；spans.js:103 `registerRegion` = 12；spans.js:214 匿名箭头 = 12；row-geometry-controller.js:349 `remeasureVisibleRows` = 11；row-geometry.js:370 `computeRowHeights` = 11。（另 demo/src/advanced/case-grid-designer:245 =12、src/events/resize.js:60 `sweep` =12，属 table-ex 外。）

**超长函数 / 深嵌套（启发式扫描：括号配对测函数体长、缩进/2 测嵌套深；括号口径对工厂函数含整个返回对象体）：**

- 超长：row-geometry-controller.js:53 `createRowGeometryController` ≈372L；editor.js:346 `createEditorController` ≈232L；use-tree-rows.js:40 `useTreeRows` ≈213L；spans.js:171 `applySpanMethod` ≈155L；spans.js:331 `applyAutoRowSpan` ≈138L；painter.js:1353 `createPainter` ≈89L；cell-painters.js:223 `drawCell` ≈84L（「扫描口径」标注：工具脚本启发式，未过 parser）。
- 深嵌套峰值：spans.js 7 层（:304 附近）、editor.js 6 层（:409）、table-ex.vue/row-geometry.js 5 层、其余 3–4 层。
- 重复（有据可查的镜像常量，**有意设计**非待修重复）：constants.js:41-43 `ROW_HEIGHT_FALLBACK=36`/`FONT_SIZE_FALLBACK` ↔ row-geometry.js:15-17 本地同值回退（36/18/14）↔ cell-painters.js:52 `FALLBACK_LINE_HEIGHT=18`——constants.js:1-7 头注声明「镜像 DOM 规格 / 模块隔离」的既定约定，设计需尊重该隔离前提。

**性能基线可测量点（按知识库 `table-ex-performance-profiling` 口径，全部现存可用）：**

1. `getLayoutInfo()`（table-ex.vue:1225-1240，defineExpose）→ `lastPaint`（painter.js:1426 getter，paint() 耗时）+ `lastRelayout` { elapsed, scanCount, rebuild }（table-ex.vue:518 写入，relayout/估高阶段）+ colWidths/contentHeight/rowGeometryMode/viewRows。
2. demo 调试面板：重绘计数 `repaintCount` 200ms 轮询（demo/src/data/table-ex/main-view.vue:1232、:1262-1272）+ lastPaint/lastRelayout 直显（:278-281）；组件实例挂 `window.__canvasTable`（:1368），控制台直调。
3. measureText/setTransform 原型劫持计数（知识库条目原文方法，测量缓存真实命中）。
4. 大数据注入：props 直替（`__vueParentComponent.props` 直替 + setTimeout ≥60ms，知识库条目）或 demo 既有 100k 行夹具（default 场景，上轮实测 contentHeight 3,600,036）。
5. 回归底线：demo 自检套件 187/187（demo/src/data/table-ex/self-checks/ 十模块，「重跑自检」按钮触发；上轮 05-verify 实测值，作「不劣化于当前」基线）。
6. 参照锚点（上轮运行实测，05-verify-1.md:21-25）：default 100k 滚动、多行文本精算 contentHeight=444、文本 ink 偏移 ≤1px、懒加载回填 3→6 行/252px——优化后同口径复测即可比较。

### 块 3：demo 落点

**页面组织与构建枚举（事实）：**

- 页面 = `demo/src/<顶级分类>/<子目录>/`，含 `main.js`（5 行模板：`createVueApp(MainView)`，demo/src/data/table-ex/main.js）+ `main-view.vue`（可选页面级 style）。顶级目录现存：advanced/basics/buttons/common/data/feedback/form/home/layout/navigation/overlay。
- **入口枚举自 catalog.js，非文件系统扫描**：vite.demo.config.js:60-106 `buildInputs()` 在模块加载时（:108）执行一次——home 固定入口 + 遍历 `demo/src/catalog.js` 的 category/pages；页面 path 必须以分类前缀开头（:66-68 强制、重复检测 :70-72、**缺 main.js 直接 throw** :77-79）。未登记目录仅构建期 warn（:99-101）且**不产 input（不构建、:3000 必 404）**——比知识库「重启生效」条目更强：**新页必须改 demo/src/catalog.js + 重启 demo:build，两者缺一不可**。
- catalog.js data 分类现登记（:97-121）：data/calendar、data/table（基础）、data/table-advanced（进阶，DOM 版）、data/table-ex（「TableEx 画布表格……（验证页）」）、data/tree、data/tree-advanced 等。
- `demo/src/data/table-ex/` 现状：main-view.vue **1564 行**（验证/夹具页，保留不动）+ main.js + self-checks/。对照：正式页体量参照 data/table 212 行、data/table-advanced 226 行、data/tree 224 行。
- 服务：`serveDemoDist` 仅 watch 模式起 :3000（vite.demo.config.js:173-203，`configResolved` 内 isWatch 判断）。

**新增正式 demo 页目录名选项（事实约束下的候选，供设计定）：**

- 选项 A：`data/` 下同级新页，从简到繁各一页，如 `data/table-ex-basic/`（渲染/列型/基础交互）+ `data/table-ex-formal/` 或 `data/table-ex-scenes/`（编辑/树/合并/固定列）。命名须避开已占用的 `table-advanced`（DOM 版）。catalog 各加条目（title 格式参照「TableEx 画布表格」）。
- 选项 B：单页多节——新页如 `data/table-ex-guide/`，内部用 demo-section 从简到繁分节（table-ex 验证页已是此形态；优点一处入口，缺点单文件继续膨胀）。
- 选项 C：新顶级分类目录（如 `components/`）——现有顶级均按组件类别组织，无先例，需改 catalog 顶层结构，改动面最大。
- 公共部分（demo-page/demo-section/createVueApp、common/app.js）均可直接复用；页面标题/描述进 catalog 即得 HTML title（copyHtmlFiles :129-148）。

### 块 4：文档三处现状

**三处覆盖现状（table-ex 均有实质内容）：**

1. `skills/mussel-ui/references/components/data.md`（409 行）——按分类合并的 agent 参考；`:112` 指向、`:233` 起 `### MuTableEx` 整节：差异说明、扩展属性表（含 `tree-props`：`{ key, parentKey }`，缺省说明）、扩展事件表（`update:tree-expanded-keys`）、方法表、扩展列配置。
2. `docs-site/components/table-ex.md`（309 行，独立组件页）+ `docs-site/components/table.md`（310 行）；另有 `docs-site/guide/` 样式页（styles*）。tree.md 含 mu-tree 懒加载节（node-expand + isLeaf）。
3. `docs/quick-reference_components.md` ——`:1748` 起 `### MuTableEx` 节，与 data.md 互为同步副本（AGENTS.md 约定）。

**上轮新增 API 缺口（词边界 grep 实证，三处源文档全部缺失；`docs-site/.vitepress/dist` 下命中为构建产物不计）：**

- `tree-expand` / `tree-collapse` 事件：三处均无（skills data.md、quick-reference_components.md、docs-site/components/table-ex.md；grep 命中的 `tree-expanded-keys` 为既有 API 前缀误报）。
- `treeProps.isLeaf` 映射：三处的 `tree-props` 行均只写 `{ key, parentKey }`（skills data.md MuTableEx 节扩展属性表、docs-site/components/table-ex.md 同构、quick-reference 同构）；table-ex 侧无任何 isLeaf 字样。
- 关联缺口：上轮语义变更「箭头判定源 hasChildren → expandableAt（isLeaf:false 无子可展开）」未在任何文档反映；`expandableAt`/`buildFlatRows` 第五平行数组 `expandable` 属内部实现（AGENTS.md：对外文档不写内部实现细节，不需上文档）。
- mu-tree 组件文档（skills data.md:35、docs-site/components/tree.md）已有 isLeaf/node-expand 覆盖——table-ex 新 API 的措辞可与之对齐（术语先例）。

---

## 现有约定

- eslint：error/warning 双轨已在 .eslintrc 定制（vue/script-indent error、html-indent warn、complexity/max-len warn），上轮新代码已大体合规（仅 3E+1W 残留）；项目无 lint script，无 husky/lint-staged（package.json scripts :10-19 仅 build/demo/docs/pub）。
- demo：页面三件套 main.js/main-view.vue/可选 style + catalog.js 登记；「（验证页）」标注惯例（catalog data/table-ex desc）；新增目录须登记 + 重启（vite.demo.config.js:60-108 事实 + 知识库 demo-watch-new-entry-restart 条目）。
- 文档：三处同步义务（AGENTS.md「项目结构」节）；`docs-site/.vitepress/dist/` 为构建产物，检索文档时须排除。
- 优化相关既定约定：constants.js 模块隔离镜像常量（:1-7 头注）；table/mappings.js 单一事实源、base 不得反向 import ex/（知识库 INDEX.md:33）；painter state G2-a 原地变更契约（table-ex.vue:427-434 注释）；sizechange 统一入口（INDEX.md:13）。

## 约束与风险

- **验收标准 1 的字面命令不可达**：`demo/**` glob 拾取 demo/dist（13 万 error）。设计须先裁定忽略口径（.eslintignore 加 `demo/dist`，或验证命令改为 `demo/src/**`），否则「零 error」无意义。加 ignore 行是对「既有配置」的修改，需设计留痕。
- **warning 政策空白**：231 warnings 中 210+2 为 demo DOM 页格式类（--fix 即清零，但会触碰 20+ 个与 table-ex 无关的 demo 文件——改动面扩大须设计确认）；complexity ×9 修齐需重构 spans.js 等（w 阈值本身也是设计裁量点：放宽到 15/20 还是重构拆函数）。
- `eslint --fix` 若跑字面 glob 会改写 demo/dist 产物（下次 watch 重建会清掉，demo-watch-wipes-dist 条目）——fix 必须在排除 demo/dist 的口径下执行。
- 复杂度重构热点集中在 spans.js（25/18/12/12 四处）——合并单元格语义敏感区，上轮 187 自检断言为主要安全网；`remeasureVisibleRows`/`computeRowHeights`（11）是性能路径本体，拆分不得引入额外每行开销。
- 性能「不劣化」判定需要数字锚点：知识库口径的 lastPaint/lastRelayout/measureText 计数 + 上轮 05-verify 实测值（444/3,600,036 等）为现成基线；重跑需 :3000 服务（上轮实例由上轮任务拉起，本会话未验证其存活）。
- 上轮代码未提交（10 文件改动为基线内产物）：优化实施叠加其上，回滚粒度只能是文件级；建议设计明确「本轮改动 vs 上轮改动」的边界标注方式。
- demo/src/data/table-ex/main-view.vue 已 1564 行且含 3 个 error——新正式页与验证页职责切分时，验证页仅做 lint 清零（改动最小化），不以优化为由重构。

## 验证方式

- eslint：`eslint "src/**/*.{js,vue}" "demo/**/*.{js,vue}" --ignore-pattern "demo/dist/"`（或 .eslintignore 补 `demo/dist` 后用 00-task 字面命令）；全局 eslint@8.57.0，无本地依赖。
- `npm run build`（4 次 vite build）；`npx stylelint "src/**/*.scss"`（.stylelintrc.json 在，上轮 exit 0 基线）。
- demo 自检：`:3000/data/table-ex/` 调试面板「重跑自检」，187/187 基线。
- demo 新页：登记 catalog + 重启 `npm run demo:build` 后 `:3000/<path>/` DOM 断言。
- 性能：getLayoutInfo().lastPaint/lastRelayout + repaintCount 轮询 + measureText 劫持计数（方法见块 2）。

## 未解问题

1. 【设计决策】eslint 忽略口径：demo/dist 进 .eslintignore 还是验证命令改 glob；若进 .eslintignore 属修改「既有配置」，需留痕确认。
2. 【设计决策】warning 政策：210+2 条 demo DOM 页格式 warning 是否 `--fix` 全量清除（触碰 20+ 非 table-ex 文件）；complexity ×9 是重构消除还是调整阈值豁免（spans.js 25/18 重构收益 vs 风险）。
3. 【运行验证】:3000 服务当前是否存活（上轮偏离 1 拉起的实例，本探索未探测）；性能基线复测前需确认/重启 demo:build。
4. 【设计决策】新增正式 demo 页数量/目录名（块 3 选项 A/B/C）；`data/table-ex-advanced` 名已被 DOM 版占用，命名需避开。
5. 【设计决策】`__version__` no-undef 的修法（.eslintrc 加 globals / demo 页内联 eslint-disable / 改用其他取版本方式）——eslintrc 为既有配置，加 globals 同样是配置修改，与问题 1 同批裁定。
