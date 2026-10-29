# 设计

基线 `mussel-table` @ `1c8f326` + 上轮未提交改动（10 文件，基线内产物）。输入：00-task.md、decisions.md（4 条前置决定）、01-explore.md。本设计为 design-review 交叉 D1 初始设计，供 X 审改 → R 修订后交 impl-verify（≤2 轮）消费。

引用核对说明：行号以当前 worktree 为准（上轮改动使部分行号相对 01-explore 有偏移，如 fixedLeftColumns watch 现为 `table-ex.vue:1370`）；spans.js / .eslintrc / .eslintignore / catalog.js / painter.js 关键节均已在设计阶段重读。

## 方案概述

四条工作线，均围绕「性能、复杂度、可读性」与 eslint 清零：

### A 线：eslint 清零与 warning 政策（裁定未解问题 #1 / #2 / #5）

现状两种口径：字面命令（含 `demo/dist`）130,629 errors，源码口径 14 errors + 231 warnings。

**裁定 #1（demo/dist 忽略口径）：`.eslintignore` 补一行 `demo/dist`**。理由：
- 00-task 验收标准 1 的字面命令（`demo/**` glob）随之可达「零 error」；改验证命令 glob 不治本——他人执行原命令仍拾取构建产物。
- `.eslintignore` 已有 `/examples/dist`、`/dist`（构建产物非源码的既有意图），`demo/dist` 为同一意图的遗漏补齐（vite.demo.config.js watch 产物）。
- 同时防误操作：`--fix` 若跑字面 glob 会改写 dist（且下次 watch 重建即被抹掉）。
- 属既有配置变更：改动清单单列（见下），必要性如上。

**裁定 #5（`__version__` no-undef）：`.eslintrc` 增 `globals: { "__version__": "readonly" }` 并加注释指向 `vite.demo.config.js:206-209` 与 `vite.config.js:55-56` 两处 define 注入**。理由：`__version__` 是库 / demo 两套构建都注入的真实全局（`src/env.js:1` 已用 `/* global __version__ __env__ */` 逐文件声明），配置级 globals 免去 demo 侧逐文件重复声明；不用 eslint-disable（会掩盖该文件未来其他 no-undef 真错）；改取版本方式（import 等）改动运行时代码且无等价物。与 #1 同属配置变更，一并单列留痕。

**裁定 #2（warning 政策）**，四档：

| 类别 | 处置 | 明细 |
|---|---|---|
| error（14） | 全部清零 | `--fix` 自动修 10（spaced-comment ×2、script-indent ×2、quotes ×6）；手工修 4：`demo/src/data/table-ex/main-view.vue` createSpanRecords 内 `records` 遮蔽改名 `rows`（对齐 createTreeRecords 先例）、`feedback/status-box/main-view.vue` 删未用 `ref` 导入、`navigation/side-menu/main-view.vue` `_` 遮蔽改名、home 的 `__version__` 走 #5 配置修复 |
| auto-fixable 格式 warning（212：newline ×210+2 等） | `--fix` 一次清零，范围为 src + demo/src 全量 | 触碰 ~20 个非 table-ex demo 文件（layout/box、data/collapse、split-box、grid-box 等），纯换行/缩进格式化零语义变更，`npm run build` + 187 自检 + demo 冒烟把关；半清（只 fix 含 error 文件）会留下同文件半新半旧格式 |
| complexity（9） | 分三类处置 | ① table-ex 内重构 5 处：spans.js `applyAutoRowSpan`(25)/`applySpanMethod`(18)/`registerRegion`(12)/`parseSize` 匿名闭包(12) + cell-painters.js `prepareColumn`(15)（B 线）；② 性能路径豁免 2 处：`row-geometry-controller.js` `remeasureVisibleRows`(11)、`row-geometry.js` `computeRowHeights`(11)——`// eslint-disable-next-line complexity` + 理由注释（每行热路径，拆分引入参数打包与调用开销，复杂度收益低于回归风险）；③ 范围外保留 2 处：`demo/src/advanced/case-grid-designer`(:245)、`src/events/resize.js` `sweep`(:60)，warning 留痕不动（范围克制） |
| max-len（10） | 保留 warning，本轮不处理 | ignoreStrings/Urls/Comments 已全开，剩余均为长代码行，纯排版裁量、触碰面广、收益低 |

**可执行口径提示**：eslint 为全局安装（`d:\npm\global` v8.57.0，PATH 可用，探索实测插件齐备），项目 devDependencies 无 eslint 系——验证用裸 `eslint` 命令；`npx eslint` 在无本地依赖时会从 registry 拉取（版本漂移风险，eslint 9 不兼容 .eslintrc），不采用、不新增依赖（00-task 约束）。

### B 线：spans.js 复杂度重构（收益 vs 风险评估）+ prepareColumn 小步重构

**评估（派发要求优先项）**：

- 收益：spans.js 四函数 complexIty 25/18/12/12 是全模块最高且集中（合并单元格语义敏感区，7 层嵌套峰值在 :304 附近）；重构后目标全部 ≤10（eslint `complexity` 仅在 >10 时告警，计入 `&&`/`||`/`??`——`eslint/lib/rules/complexity.js:105` `LogicalExpression`），判定条件模块级谓词化，可读性显著提升；不改公共接口（buildSpans 及查询函数签名不动）。
- 风险：合并语义回归（丢弃规则/夹紧/级联切断/树父链切断/警告键）。安全网：`demo/src/data/table-ex/self-checks/spans.js` 上轮断言（187 基线的组成部分，覆盖警告键与边界）+ demo「合并单元格」场景 e2e；自检覆盖缺口与补足手段见下「冻结的可验证性」。
- 结论：**重构**。纯函数模块 + 充分安全网 + 严格行为冻结约束（见下），可控。

**行为冻结约束（实施红线）**：警告文案与去重键逐字/逐个不变；region 登记顺序不变（regions 构建序）；丢弃/夹紧/切断规则语义不变；不引入每行级新增分配（拆出的谓词/解析函数均为模块级，参数直传，不在行循环内分配闭包或数组）。

**冻结的可验证性（187/187 覆盖不足，须补探针）**：`self-checks/spans.js` 只按消息子串/条数断言，且**未覆盖 5 个警告分支**——`spans.js:225` 值形态无效、`:240` colspan 非正整数、`:283` 树形列/check 列 reserved、`:347` takenOver info、`:361` orderBy info；警告去重键经 `createWarner`（spans.js:48-59）只把 message 交给注入出口，外部不可观测；`spans.regions` 的构建顺序亦无断言。故 187/187 + 现有单元自检**守不住**这 5 个分支、去重语义与登记顺序。补足手段（写入步骤 3）：重构前在 `self-checks/spans.js` **临时**追加一条探针 check（夹具覆盖上述 5 分支 + 已断言的 7 分支 + 重复键去重 + `spans.regions` 坐标序列，返回 `capture.messages` 原文序列与 regions 坐标序列）→ 记录基线序列 → 重构后重跑逐字比对 → 删除探针（交付 diff 中 `self-checks/spans.js` 仅含 A 线 quotes --fix），最终仍跑 187/187。

**分解方案（伪代码级，见「接口/数据结构」）**：
- `registerRegion`(12)：抽出 `fillCoveredCells(index, ...)`（:139-152 双层循环）与 `fillRowRegions(index, ...)`（:156-161），主体剩规范化判定 + 组装（等价结构 eslint 实测 ≤10，通过）。
- `applySpanMethod`(18)：闭包 `resolveDeclColumns`/`parseSize` 提为模块级（warnedKeys/emitWarn 参数化）；'rest' 展开与固定列夹紧段（:294-312）抽 `resolveDeclaredColspan(...)`；**`spanMethod(info)` 载荷构造抽 `buildSpanInfo(records, columns, row, rowCount, recordsOffset)`**（该段 3 个三元 + 1 个 `||`，`complexity` 计入 `||`）。证据：只做前述两项抽取时等价结构 eslint 实测 **13**（>10 仍告警），加入 `buildSpanInfo` 后实测通过。**R2 独立复测：分解骨架主循环恰为 10（`?.` 不计数，`&&`/`??`/三元各 +1）——零余量通过，主循环不得再保留任何额外分支（orderBy 警告等一律在抽取函数内）；实施变体若超限，继续抽取，不得改用豁免**。
- `parseSize`(12)：拆 `normalizeSpanValue`（number 糖 / 对象取 rowspan/colspan / **值形态无效警告**）+ `validateSpanSize`（≥1 整数校验与警告），各 ≤10。注意值形态无效警告（spans.js:224-228）文案含 `row`/`colIndex`，`normalizeSpanValue` 签名须带 `(raw, row, colIndex, emitWarn)`，不能只收 `raw`。
- `applyAutoRowSpan`(25)：抽 `collectAutoRowSpanColumns(ctx)`（takenOver 过滤 + 警告 + orderBy 警告）、`autoSpanKeyOf(col, mode, record)`（现 keyOf 闭包）、`isTreeBoundary(levels, parentKeys, row)`（含 `isTree`/`row > 0` 判定）、`isCascadeBoundary(segStartByCol, autoCols, colIndex, row)`、非原始值警告抽 `warnNonPrimitiveKey(...)`；**再加 `advanceSegment(seg, key, row, segStartByCol, colIndex)`**：`seg = { openFrom, openKey }` 每列创建一次（非每行），承担「键变则闭合 + 未开段则开段」两处判定。证据：只做前述抽取时等价结构 eslint 实测 **12**（>10 仍告警），加入 `advanceSegment` 后实测通过。`close` 的 registerRegion 调用与警告保留在闭包内。**R2 独立复测：分解骨架主循环恰为 10，零余量通过——同上约束（超限继续抽取，不得豁免；`isEmptyKey` 判定后两个 continue 分支已计入该 10，不可再并入主循环其他条件）**。

**prepareColumn**(15) 小步：抽 `resolveMaxLinesBuilder(column)`（:160-168 三分支）与 `isPlainTextColumn(column, canvasOnlyKind)`（:179-180 谓词），主体降至 ≤10（等价结构 eslint 实测通过）。列准备仅随 columns 引用变化执行，非热路径，低风险。

### C 线：性能——relayout 触发合帧（P1）+ 测量协议

**问题（代码事实）**：壳内**五个 relayout watch 语句、六个源**各自独立执行完整 `relayoutAndRedraw`（估高扫描 + 精算 + 重绘）：records（`table-ex.vue:1305`，先 scrollTo(0,0)）、columns（`:1315`，先 resetOverrides + invalidateMeasureCache）、recordsVersion（`:1323`）、[spanMethod, orderBy]（`:1328`，一个 watch 两源）、fixedLeftColumns（`:1370`）。父级一次替换 records + columns（demo 夹具切换、真实应用同时换数据与列定义）时同批触发 **relayout ×2**——上轮问题 2 修复后每次 relayout 尾部含可视行精算，双倍支付。

**P1 方案**：六源合并为单一 watch（数组源，一次 flush 一次回调），回调内按源 diff 执行各自前置副作用（records 变 → scrollTo(0,0)；columns 变 → resetOverrides + invalidateMeasureCache），然后**一次** `relayoutAndRedraw()`。时序等价性：副作用顺序与现 watch 定义序一致（scrollTo 先于 relayout、invalidate 先于扫描）；单一源变化时行为与现状逐字一致；多源同批时从「两次完整 relayout」变为一次（且 invalidateMeasureCache 在首次扫描前生效，省掉一次废扫描）。use-tree-rows 三条树 watch 不并入（tree/treeProps 两条带 resolveInitialExpansion 副作用、tree 一条 immediate，且极少与 records 同批；残留见未解问题）。

**测量协议（不劣化判定口径，全部为 01-explore 所列现存测量点）**：

| 指标 | 采集方法 | 不劣化判据 |
|---|---|---|
| 夹具切换 relayout 次数与成本 | ① 次数：在 `relayoutAndRedraw` 入口临时 `console.count('relayout')`（步骤 2 采集基线时加入，步骤 4 用后删除），playwright 读 console；② 成本：同一 `page.evaluate` 内 `t0=performance.now()` → 同批替换 records+columns → `await inst.$nextTick()` → `t1`，≥3 次取中位；③ 单次 `getLayoutInfo().lastRelayout.elapsed/scanCount`，default→multiline→default 一轮 | ① 同批两源：基线 2 → 1；场景切换按该批实际变化的源数 N → 1（N 基线实测）；② 批量 wall-clock ≤ 基线批量值，且 ≤ 单次 relayout elapsed ×1.5；③ 单次 elapsed ≤ 原两次之和 |
| 滚动帧绘制 | default 100k 场景滚动，`lastPaint.elapsed` 稳态采样 ≥5 次取中位 | 中位 ≤ 基线 ×1.1 或绝对差 <1ms（取宽者） |
| 功能锚点（上轮 05-verify 实测） | 多行文本精算 contentHeight=444；100k contentHeight=3,600,036；懒加载回填 3→6 行 | 数值逐一不变 |
| spans 构建 | demo「合并单元格」场景切换 + 无合并表 buildSpans null 快路径 | 行为不变（自检 + e2e），无新增告警 |
| 回归底线 | 「重跑自检」187/187；`npm run build`；stylelint | 全绿 |

> 次数判据不用 `repaintCount`、也不用 `lastRelayout`：前者是 200ms 轮询 + 仅 `lastPaint` 键变化才 +1（`demo/src/data/table-ex/main-view.vue:1262-1278`），后者每次 relayout 整体覆盖（`table-ex.vue:518`）；而 `redraw()` 是同步整幅绘制（`table-ex.vue:425-428`），同批两次 relayout 只会留下最后一次的 lastPaint/lastRelayout——两者都数不出 relayout 次数。

基线值在实施步骤 2 采集留痕（当前 :3000 存活未探测，不活则先 `npm run demo:build`，对应未解问题 #3）。

### D 线：正式 demo 两页（裁定未解问题 #4）+ 文档三处更新

**裁定 #4（数量/命名）**：`data/` 下**两页**，`data/table-ex-basic/` + `data/table-ex-scene/`，catalog data 分类各登记一条（插在 `data/table-ex` 验证页之前，导航序 = Table（DOM 基础）→ Table（DOM 进阶）→ TableEx 基础 → TableEx 场景 → TableEx 验证页）。命名避开 DOM 版已占用的 `table-advanced` 及易混淆的 `table-ex-advanced`（派发点名）。

- `data/table-ex-basic/`「TableEx 画布表格（基础）」，~250 行（体量参照 data/table 212 行）：① 最小挂载（columns/records/key-field/选中）；② 列型一览（text/number/currency/date/datetime/bool + mappings、tag/link/progress/button/img、check/rec_no）；③ 交互（sortable + order-by、fixed-left-columns、resizable、striped/gridlines/hover 模式）。
- `data/table-ex-scene/`「TableEx 画布表格（场景）」，~300 行：① 单元格编辑（editable/editor + update:cell-value 就地改）；② 树模式含 **isLeaf 懒加载 + tree-expand/tree-collapse**（上轮新 API 的活样例，回填走就地 push + recordsVersion++ 范式）；③ 合并单元格（autoRowSpan + spanMethod 'rest' 小计行）；④ 异步数据（recordsVersion 就地更新）。
- 每页 = main.js（5 行模板）+ main-view.vue，复用 demo-page/demo-section；catalog 登记 + **重启 `npm run demo:build`** 两者缺一不可（vite.demo.config.js:60-108 启动期枚举 + catalog 单一事实源）。
- `demo/src/data/table-ex/` 验证页保留不动其验证职责，仅 A 线 lint 清零触碰（script-indent --fix + records 改名）。

**文档三处更新**（用户已授权，decisions [前置]3）：补上轮 API 缺口（01-explore 块 4 grep 实证三处全缺）：
- `treeProps.isLeaf`：三处 `tree-props` 行由 `{ key, parentKey }` 补为含 `isLeaf`（说明：字段名映射，**未映射不生效**；无子级记录仅当 `isLeaf === false` 时显示展开三角并可点击触发懒加载，有子级记录照常显示——`tree.js:135` `hasKids || isLeafOf?.(record) === false`；措辞对齐 mu-tree 文档既有 isLeaf/node-expand 术语）。`docs-site/components/table-ex.md:191` 的「树模式」正文同一句只写 `{ key, parentKey }`，须同步补 isLeaf（只改表格会留下同页自相矛盾）。
- `tree-expand` / `tree-collapse` 事件：三处扩展事件表各补两行（载荷 `{ key, record, level }`；每次箭头 toggle 均发；懒加载用法一句话——tree-expand 中判断 record.isLeaf 后异步回填，回填通道 = 就地 push 子级 + recordsVersion++，避免 records 引用替换导致滚动复位）。
- `expandableAt`/`buildFlatRows` 第五平行数组属内部实现，不上文档（AGENTS.md：对外文档不写内部实现细节）；本轮 spans/P1 重构同样不产生文档变更。
- `docs-site/guide/` 经 grep 仅 `guide/install.md` 提及 MuTableEx（ex 版引入说明），无 tree/事件内容，本轮不改。

## 遵循约定与复用

提取自 01-explore.md「现有约定」，设计阶段复核属实：

- eslint 双轨（error/warn）已在 .eslintrc 定制（complexity warn 10 / max-len warn 120 / vue/script-indent error）；本轮不放宽任何阈值（见被拒绝备选 A2）。
- constants.js 模块隔离镜像常量头注约定（:1-7）——B 线不合并 row-geometry/cell-painters 的本地回退常量（有意设计）。
- table/mappings.js 单一事实源、base 不得反向 import ex/（知识库 INDEX.md:33）；painter state G2-a 原地变更契约（`table-ex.vue:430-433` 注释，`redraw()` 同步整幅见 `:425-428`）；sizechange 统一入口。
- demo 页三件套 + catalog.js 登记 + 重启 demo:build；「（验证页）」标注惯例保留。
- 文档三处同步义务（AGENTS.md「项目结构」节）；检索排除 `docs-site/.vitepress/dist/`。
- 自检套件 `demo/src/data/table-ex/self-checks/`（十模块，「重跑自检」触发）为 B/C 线安全网，187/187 为回归底线。
- 性能测量：`getLayoutInfo()`（lastPaint/lastRelayout）、调试面板 repaintCount（200ms 轮询的绘制计数，不作 relayout 次数判据，见 C 线表）、measureText/setTransform 劫持计数、大数据注入（知识库 table-ex-performance-profiling 条目）。
- 全局 eslint v8.57.0（PATH 裸命令），无本地依赖、不新增（A 线口径）。

## 改动清单（含新增或修改的测试文件）

### 既有配置变更（单列，必要性见 A 线裁定）

| 文件 | 改动 | 必要性 |
|---|---|---|
| `.eslintignore` | 补一行 `demo/dist` | 验收字面命令可达零 error；构建产物非源码（既有 /dist、/examples/dist 同意图）；防 --fix 误写 dist |
| `.eslintrc` | `globals` 增 `"__version__": "readonly"` + 注释指向 vite.demo.config.js / vite.config.js 的 define 注入（.eslintrc 为 JSON，eslint 8 经 strip-json-comments 解析，允许 `//` 注释） | demo 构建真实全局契约的准确声明；内联 disable 会掩盖未来真错 |

### src（B/C 线 + lint）

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/spans.js` | B 线重构：四热点函数分解（模块级 helper 化），行为冻结；:345 spaced-comment 随 --fix | complexity 25/18/12/12 清零、可读性 |
| `src/components/table/ex/cell-painters.js` | B 线：prepareColumn 两处抽取 | complexity 15 → ≤10 |
| `src/components/table/ex/table-ex.vue` | C 线 P1：五个 watch 语句（六源）合一（含副作用 diff） | 同批多源触发 relayout 2→1 |
| `src/components/table/ex/row-geometry-controller.js` | `remeasureVisibleRows` 加 complexity 豁免注释（不改代码逻辑） | 性能路径豁免留痕（裁定 #2②） |
| `src/components/table/ex/row-geometry.js` | `computeRowHeights` 加豁免注释（不改代码逻辑） | 同上 |
| `src/components/table/ex/painter.js` | :1346 spaced-comment 随 --fix（无其他改动） | error 清零 |

### demo

| 文件 | 改动 | 原因 |
|---|---|---|
| `demo/src/data/table-ex-basic/`（新目录：main.js + main-view.vue） | D 线基础页 | 验收标准 3 |
| `demo/src/data/table-ex-scene/`（新目录：main.js + main-view.vue） | D 线场景页（含上轮 API 活样例） | 验收标准 3/4 |
| `demo/src/catalog.js` | data 分类增两条目（置于 data/table-ex 之前） | 入口枚举单一事实源 |
| `demo/src/data/table-ex/main-view.vue` | 仅 lint：script-indent ×2 随 --fix；createSpanRecords 内 `records` 改名 `rows` | error 清零；验证页职责不动 |
| `demo/src/data/table-ex/self-checks/spans.js` | :125/:259 quotes 随 --fix（断言本体零改动，作 B 线安全网） | error 清零 |
| `demo/src/calendar/`、`form/color-input/`、`form/date-input/`、`navigation/pagination/` 各 main-view.vue | quotes error 随 --fix | error 清零 |
| `demo/src/feedback/status-box/main-view.vue` | 删未用 `ref` 导入（手工） | error 清零 |
| `demo/src/navigation/side-menu/main-view.vue` | `_` 遮蔽改名（手工） | error 清零 |
| `demo/src/home/main-view.vue` | 无代码改动（#5 配置修复后 error 消失） | — |
| `demo/src/layout/box`、`data/collapse`、`layout/split-box`、`layout/grid-box` 等 ~20 文件 | auto-fixable 格式 warning 随 --fix（纯换行/缩进） | 裁定 #2 第二档 |

### 文档（用户已授权）

| 文件 | 改动 | 原因 |
|---|---|---|
| `skills/mussel-ui/references/components/data.md` | MuTableEx 节（:233 起）：tree-props 行补 isLeaf；扩展事件表补 tree-expand/tree-collapse | 验收标准 4 |
| `docs-site/components/table-ex.md` | 三处：① 树模式正文 `:191` 的 `{ key, parentKey }` 说明补 isLeaf；② 属性表 `tree-props` 行（:244）；③ 扩展事件表（:252 区）补两事件（措辞对齐 tree.md 的 isLeaf/node-expand 术语） | 同上 |
| `docs/quick-reference_components.md` | MuTableEx 节（:1748 起）同步（与 data.md 互为副本） | 同上 |

### 测试文件

新增/修改的测试资产 = demo 两新页（本身即验证载体）+ 自检套件**交付零改动**（187 断言为 B/C 线回归安全网；步骤 3 的探针 check 仅临时存在，交付前删除）。无测试框架（AGENTS.md），不新增测试文件。

## 接口 / 数据结构

零公共 API 变更（本轮全部为内部重构与配置；文档补的是上轮已实施 API）。仅签名与伪代码：

### B 线 spans.js（全部模块级私有，公共导出 buildSpans/coveredAnchorOf/regionAt/spanCellKindOf/regionsForRows/resolveSpanCell/spanRectOf/spanRegionRect/spanHeightRoleOf 签名不变）

```js
// registerRegion 分解（:103-166）：
function fillCoveredCells (index, row, rowTo, col, colTo)   // covered 双层循环回填
function fillRowRegions (index, region, row, rowTo)          // rowRegions 逐行 push
// registerRegion 主体：截断/跨度<2 丢弃/重叠丢弃判定 + region 组装 + 三表回填编排

// applySpanMethod 分解（:171-325）：
function buildSpanInfo (records, columns, row, rowCount, recordsOffset) // spanMethod(info) 载荷（prev/next/recordNumber）
function resolveDeclColumns (columns, name, warnedKeys, emitWarn)  // key 优先→field（闭包提模块级）
function parseSize (raw, row, colIndex, emitWarn)                    // 组合 normalize + validate，保持调用点不变
function normalizeSpanValue (raw, row, colIndex, emitWarn)           // number 糖/对象取 rowspan/colspan/值形态无效警告（'rest' 透传）
function validateSpanSize (size, row, colIndex, emitWarn)            // ≥1 整数校验 + 警告，返回 size|null
function resolveDeclaredColspan (size, colIndex, fixed, colCount, row, emitWarn) // 'rest' 展开 + 固定列边界夹紧 + clamp 警告
// applySpanMethod 主体：行循环（try/catch spanMethod(buildSpanInfo(...))）→ 键遍历 → 接管/保留列过滤 → 登记

// applyAutoRowSpan 分解（:331-468）：
function collectAutoRowSpanColumns (ctx)                            // takenOver 过滤 + info/orderBy 警告，返回列下标数组
function autoSpanKeyOf (col, mode, record)                          // true/string/Function 三形态
function isTreeBoundary (levels, parentKeys, row)                   // 树关或首行早退；层级变化或父链不同（§2.2 规则 4）
function isCascadeBoundary (segStartByCol, autoCols, colIndex, row) // 左列分段起点切断（规则 3）
function advanceSegment (seg, key, row, segStartByCol, colIndex)     // 键变闭合 + 未开段开段（seg 每列一次，非每行分配）
// 主体：autoCols 外提；close 闭包保留（registerRegion/警告在内）；行循环内逐谓词判定
```

### C 线 table-ex.vue watch 合一（替换 :1305-1328 与 :1370 五个 watch 语句，六源）

```js
// 六源合一（数组源，一次 flush 一次回调；pre flush 不变）：
watch(
  [
    () => props.records,
    () => props.columns,
    () => props.recordsVersion,
    () => props.spanMethod,
    () => props.orderBy,
    () => props.fixedLeftColumns
  ],
  ([records, columns], [prevRecords, prevColumns]) => {
    if (records !== prevRecords) {
      scrollEl.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
    if (columns !== prevColumns) {
      resetOverrides()
      rowGeometry.invalidateMeasureCache()
    }
    relayoutAndRedraw()
  }
)
```

各注释（A3 数据契约、G1-b 契约、§4 spans 身份等）随迁移保留于合并块内。

### D 线 catalog 条目（demo/src/catalog.js data 分类，插于 data/table-ex 之前）

```js
{ path: 'data/table-ex-basic', title: 'TableEx 画布表格（基础）', desc: '列类型、排序、固定列与交互' },
{ path: 'data/table-ex-scene', title: 'TableEx 画布表格（场景）', desc: '编辑、树（含懒加载）、合并单元格与异步数据' }
```

## 被拒绝的备选

**A1：验证命令改 glob（`demo/src/**`）而非 .eslintignore 补行**——00-task 字面命令仍会踩 demo/dist（130k error 陷阱留给后续执行者）；ignore 补行同时防 `--fix` 误写产物。拒绝。

**A2：complexity 阈值放宽（10→20/25）**——spans.js 是合并语义敏感区，放宽等于放弃本轮「复杂度可读性」目标且掩盖真实热点；豁免仅限性能路径两处并逐处留理由。拒绝。

**A3：性能路径两函数（remeasureVisibleRows/computeRowHeights）也重构**——每行热路径，拆分引入参数打包/函数调用开销与回归风险，高于 11→≤10 的复杂度收益；以豁免注释替代。拒绝（重构）。

**A4：demo 选项 B（单页多节）/选项 C（新顶级分类）**——B 延续验证页 1564 行的巨页形态、无法直链主题；C 无顶级目录先例（现有顶级均按组件类别），catalog 顶层结构改动面最大；两页制对齐 table/table-advanced、tree/tree-advanced 先例。拒绝。

**A5：移除 applyTreeToggle / onThemeChange 尾部与 relayout 内部重复的「remeasure+recompute+redraw」**——评估后不动：两处尾部三连位于锚定补偿（写 scrollTop）**之后**，承担「以最终 scrollTop 同步窗口并重绘」职责，移除会引入一帧滞后（scroll 事件异步）；内部三连在前的一次执行近乎幂等（缓存命中 delta=0 早退），冗余成本可忽略。拒绝（变更）。

**A6：regionsForRows 每帧 Set/Array 分配缓存化**——分配规模 ∝ 可视窗行 × 区域数（painter.js:336/:1333 两个调用点均窗内规模），无 profile 证据支撑为瓶颈；缓存引入 (spans 引用, from, to) 失效复杂度。评估后不动。拒绝。

**A7：`__version__` 用文件内联 eslint-disable**——行级/文件级 disable 会掩盖该文件未来其他 no-undef 真错；globals 配置声明精确对应构建契约。拒绝。

**A8：max-len ×10 逐条修**——ignoreStrings/Urls/Comments 已全开，剩余均为长代码行，纯排版裁量、收益低；保留 warning 政策留痕（不阻塞验收标准 1）。拒绝（本轮处理）。

## 风险与回滚

- **B 线 spans 重构**（最高回归风险项）：安全网 = self-checks/spans.js 断言（已覆盖 7 个警告分支与边界）+ **临时探针**（补 5 个未覆盖警告分支、去重键、regions 顺序的前后逐字比对，用后删除）+ demo「合并单元格」场景 e2e + 187/187 底线；行为冻结约束（警告文案/去重键逐字、登记顺序、规则语义、行循环零新增分配）写入实施红线。回滚 = revert spans.js 单文件（纯函数模块，无接口变更）。
- **C 线 P1**：watch 合并时序风险——副作用顺序（scrollTo → resetOverrides/invalidate → relayout）与现状逐字等价已在设计内推演；验证覆盖夹具切换/仅换列/仅 recordsVersion/排序/固定列五路径 + 树 toggle（未并入，独立路径）。回滚 = 还原为五个独立 watch 块。
- **A 线 --fix 触碰面**：~20 个非 table-ex demo 文件纯格式 diff；`npm run build` + 自检 + demo 冒烟把关；不可自动修的 4 error 均为单点手工修改。
- **上轮改动共存**：工作区含上轮 10 个未提交文件，本轮叠加其上且文件重叠（table-ex.vue、spans.js、cell-painters.js、demo main-view.vue 等）——回滚粒度只能是 hunk 级。约定：实施记录逐文件登记本轮 touched 位置摘要，回滚按实施记录对照 `git diff` 以 hunk 为单位执行，不整文件 reset（保护上轮基线内产物）。
- **demo 新页 404**：catalog 登记 + 重启 demo:build 缺一不可（探索证实的强约束）；验证步骤显式包含重启动作。
- **文档更新**：用户已授权（decisions [前置]3）；仅补 API 事实，不写内部实现。

## 测试计划

执行口径：eslint 用全局裸命令 `eslint "src/**/*.{js,vue}" "demo/**/*.{js,vue}"`（.eslintignore 补行后字面 glob 即源码口径）；`:3000` 由 `npm run demo:build`（watch）提供，不活则重启（未解问题 #3）。

| 验收标准 | 手段 | 具体检查 |
|---|---|---|
| 1. eslint 零 error + warning 政策留痕 | 命令 | `eslint "src/**/*.{js,vue}" "demo/**/*.{js,vue}"` exit 0 且输出 0 error；warning 仅剩政策允许项（complexity 范围外 ×2 + max-len ×10），与本设计「裁定 #2」表逐条对账留痕 |
| 2. 优化落地无回归 + 性能不劣化 | 命令 + 浏览器 | ① `:3000/data/table-ex/`「重跑自检」187/187；② `npm run build` 通过；③ `npx stylelint "src/**/*.scss"` 零报错；④ 性能协议四行（C 线表）：切换 relayout 计数 N→1（临时 `console.count` 埋点，用后删除且 `git diff` 无残留）+ 批量 wall-clock 与 elapsed/scanCount 对比、滚动 lastPaint 中位 ≤ 基线×1.1 或 Δ<1ms、contentHeight 锚点 444 / 3,600,036 / 懒加载 3→6 行逐一不变；⑤ spans：demo「合并单元格」场景切换 + hover/选中/事件载荷冒烟 |
| 3. demo 新页 | 浏览器（playwright DOM/可访问性快照） | catalog 登记 + 重启 demo:build 后：① `:3000/data/table-ex-basic/` 与 `:3000/data/table-ex-scene/` HTTP 200；② 基础页：列型可视（snapshot 含 tag/progress/button 列内容）、排序点击后 `update:order-by` 生效（行序断言）、固定列滚动不位移；③ 场景页：编辑提交就地改值、树 isLeaf 懒加载全链（点箭头 → 事件 → 回填 → 子行出现）、合并区域单元格跨行跨列（getLayoutInfo/像素）、recordsVersion 异步更新重绘；④ 首页导航含两新条目（catalog 消费） |
| 4. 文档三处同步 | 命令 + 人工 | 对 `tree-expand` 与 `tree-collapse` 各跑一次 `git grep -n`，模式取**反引号包裹的事件名**（裸词会被既有 `tree-expanded-keys` 命中，假阳性）——data.md / docs-site/components/table-ex.md / quick-reference_components.md 各有命中且事件表行完整；`tree-props` 行三处均含 isLeaf；`docs-site/components/table-ex.md` 树模式正文（:191）亦含 isLeaf；人工通读一遍措辞（对齐 tree.md 术语） |
| 回归. 上轮功能保持 | 浏览器 | 验证页三问题上轮验收口径抽查：图形列文本垂直居中（ink 中心 ≤1px）、多行文本格线精算重绘、懒加载回填不闪顶 |

## 实施步骤

串行，不标并行组。每步完成判据可独立验证；实施循环上限 2 轮（00-task），步骤 1-3 为第一轮候选、4-6 为第二轮候选，亦可单轮完成全部。

1. **eslint 配置与清零**（文件集合：`.eslintignore`、`.eslintrc`、A 线全部 demo/src 修复点 + painter.js/spans.js 的 spaced-comment）
   - 补 ignore 行与 globals → 裸 `eslint` 全量跑 → `--fix`（同口径）→ 手工修 4 处不可自动修 error。
   - 完成判据：0 error；warning 余量 = complexity ×9（table-ex 5 待步骤 3 重构 + 性能路径 2 待步骤 3 豁免 + 范围外 2）+ max-len ×10（步骤 3 后 complexity 应降至范围外 ×2）；eslint 输出留痕。依赖：无。
2. **性能基线采集**（文件集合：`table-ex.vue` 仅加临时 `console.count('relayout')` 埋点，步骤 4 末尾删除；产物 = 基线数值表，记入实施记录）
   - 前置：确认/重启 `:3000`。按 C 线测量协议采四行指标（切换 relayout 计数与批量 wall-clock、滚动 lastPaint 中位、contentHeight 锚点、spans 场景冒烟基线）。
   - 完成判据：基线数值齐且与上轮 05-verify 锚点（444 / 3,600,036 / 3→6 行）吻合；relayout 计数基线留痕。依赖：无（与步骤 1 无文件交集，但按串行约定排后）。
3. **B 线重构 + 豁免**（文件集合：spans.js、cell-painters.js、row-geometry-controller.js、row-geometry.js；`self-checks/spans.js` 仅加临时探针，验证后删除）
   - 先按「冻结的可验证性」临时追加探针 check，跑一次记录基线序列；再按分解方案实施（行为冻结红线）；性能路径两处加豁免注释。
   - 完成判据：`eslint` 下 complexity warning 仅剩范围外 ×2（5 个重构目标逐一实测 ≤10，不得改用豁免）；探针前后消息序列与 regions 序列逐字一致，随后删除探针（交付 diff 无探针）；自检 187/187；步骤 2 性能口径复测不劣化。依赖：步骤 1、2。
4. **C 线 P1 合帧**（文件集合：table-ex.vue）
   - 五个 watch 语句（六源）合一（副作用 diff 迁移注释）；用步骤 2 的埋点测同批计数。
   - 完成判据：同批替换 records+columns 的 relayout 计数 2→1（场景切换按实际源数 N→1）且批量 wall-clock 不劣化；删除 `console.count` 埋点且 `git diff` 无残留；仅换列/仅 recordsVersion/排序/固定列四路径行为等价冒烟；自检全绿。依赖：步骤 3（同文件上轮+本轮改动叠加，串行降冲突）。
5. **D 线 demo 两页**（文件集合：demo/src/data/table-ex-basic/、demo/src/data/table-ex-scene/、demo/src/catalog.js）
   - 建页 + 登记 + 重启 demo:build。
   - 完成判据：两页 HTTP 200 且测试计划第 3 行 DOM 断言过；eslint 新页零告警。依赖：步骤 1（lint 口径已就位）。
6. **文档三处 + 终验**（文件集合：data.md、docs-site/components/table-ex.md、quick-reference_components.md）
   - 补 treeProps.isLeaf 与两事件；随后全量终验（验收标准 1-4 + 回归行）。
   - 完成判据：验收标准 1-4 全过；实施记录含本轮改动逐文件清单（供 hunk 级回滚）。依赖：步骤 4、5。

## 未解问题

对 01-explore.md「未解问题」逐条回应（#1/#2/#4/#5 为派发要求的设计裁定，已写入方案概述 A/D 线）：

1. 【设计决策】eslint 忽略口径 → **裁定：`.eslintignore` 补 `demo/dist`**（方案概述 A 线，配置变更单列留痕）。已裁定。
2. 【设计决策】warning 政策 → **裁定：error 全清；auto-fixable 全量 --fix；complexity 分三类（table-ex 重构 5 / 性能路径豁免 2 / 范围外保留 2）；max-len 保留**（A 线裁定 #2 表）。已裁定。
3. 【运行验证】:3000 存活 → 归入实施步骤 2 前置（不活则 `npm run demo:build`）；新增目录的重启要求已在步骤 5 显式化。已归置。
4. 【设计决策】demo 页数量/命名 → **裁定：两页 `data/table-ex-basic/` + `data/table-ex-scene/`**（D 线，避开 table-advanced / table-ex-advanced）。已裁定。
5. 【设计决策】`__version__` 修法 → **裁定：`.eslintrc` globals readonly + 注释指向 define 注入**（A 线裁定 #5）。已裁定。

设计后新增残留（非阻塞，供 X 审改关注）：

6. `--fix` 对 ~20 个非 table-ex demo 文件的格式触碰：设计已裁定接受（纯格式、build/自检把关）；若交叉认为改动面过宽，降级方案 = 仅 fix 含 error 的文件、格式 warning 保留（验收标准 1 不受影响）。→ **X 审改表态：维持（接受全量 --fix）**。证据：212 条均为 `vue/singleline-html-element-content-newline`（210）/`multiline`（2），只给元素内容首尾加换行；Vue 模板编译器 condense 模式删除含换行的首尾空白文本节点，不改渲染文本；且有 `npm run build` + 187 自检 + demo 冒烟三道把关。降级方案不采用（同文件半新半旧格式）。
7. use-tree-rows 三条树 watch 未并入 P1 合帧：树 props 变化极少与 records 同批触发，并入需迁移 resolveInitialExpansion 副作用，复杂度收益低；若实施中发现同批场景实际存在，可在实施轮补充。→ **X 审改表态：维持**。证据修正：带副作用的是 tree（`use-tree-rows.js:211`，另带 `immediate: true`）与 treeProps（`:218`）两条，treeExpandedKeys（`:226`）无副作用但含展开集对比；并入需跨模块迁移树状态机，收益不抵风险。补一条口径：tree + records 同批属 P1 范围外，验证中若出现 ≥2 次 relayout 只记录、不判 P1 退化。
8. demo 两新页的内容节选为设计建议清单，实施时可按演示效果微调章节取舍（不改两页定位与 catalog 登记）。→ **X 审改表态：维持**，但两页不得删 isLeaf 懒加载与 `tree-expand`/`tree-collapse` 活样例（验收标准 4 的样例来源），catalog 两条目与 path 不动。
