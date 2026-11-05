# 实施记录

任务：table-ex 代码文件文件夹分类（第 1 轮实施，基线 f573055）
模式：整体实施（无设计阶段，分类方案由实施者确定）；纯移动 + import 同步，行为零变化。

## 分类方案与分组依据

8 个子目录（小写 kebab-case，参照先例 `src/components/table/column-types/`）：

| 子目录 | 一句话职责 | 文件数 |
|---|---|---|
| `shared/` | 跨域共享的常量与纯工具（镜像常量、文本换行、主题测量、树形展开），零 ex 内依赖，供所有子域消费 | 4 |
| `geometry/` | 行高几何与视口/列布局计算（relayout、估高/精算、Fenwick 前缀和索引） | 4 |
| `spans/` | 合并单元格：spanMethod / autoRowSpan 两种入口与区域注册查询 | 3 |
| `editing/` | 单元格编辑：编辑器类型/props/开值/提交值规整链 + 编辑控制器 | 2 |
| `interaction/` | 指针/点击/选中交互决策与调度：命中测试、拖拽误触抑制、编辑按钮命中、选中复制纯逻辑 | 4 |
| `cell-paint/` | 单元格内容绘制（canvasKind 通道）：取值链、文本原语、图标图片、条目/link/canvas 分发、tooltip 求值 | 8 |
| `table-paint/` | 整表分区绘制与调度：body/gridlines/header/overlay 五分区 + 视口换算工具 | 6 |
| `composables/` | table-ex.vue 功能纵切组合式（host ctx 注入模式），仅被组件 shell 消费 | 10 |

留根 3 个文件（理由）：

- `index.js` — 目录入口，`src/components/index.ex.js:2` 引用 `./table/ex/index.js`；符合组件目录约定。
- `table-ex.vue` — 组件 shell（状态枢纽 + host 组装），被 index.js 引用；符合"组件目录含 xxx.vue"约定。
- `table-ex.scss` — 组件样式，table-ex.vue 就近 import；符合约定。

依赖方向（移动后实测，无环）：`shared` ← {geometry, spans, editing, interaction, cell-paint, table-paint, composables, shell}；`geometry` → `spans`（row-geometry 消费 spanHeightRoleOf，单向）；`cell-paint` ← {interaction, table-paint, composables}；`editing` ← {interaction, table-paint, composables}；`composables` ← 仅 table-ex.vue。

## 旧路径 → 新路径映射（41 个移动文件）

根目录保留（3，不移动）：`index.js`、`table-ex.vue`、`table-ex.scss`

```
shared/
  constants.js              ← constants.js
  text-wrap.js              ← text-wrap.js
  theme.js                  ← theme.js
  tree.js                   ← tree.js
geometry/
  layout.js                 ← layout.js
  row-geometry.js           ← row-geometry.js
  row-geometry-controller.js ← row-geometry-controller.js
  fenwick.js                ← fenwick.js
spans/
  spans.js                  ← spans.js
  spans-method.js           ← spans-method.js
  spans-auto.js             ← spans-auto.js
editing/
  editor.js                 ← editor.js
  editor-resolve.js         ← editor-resolve.js
interaction/
  interactions.js           ← interactions.js
  schedulers.js             ← schedulers.js
  edit-button.js            ← edit-button.js
  cell-selection.js         ← cell-selection.js
cell-paint/
  cell-painters.js          ← cell-painters.js
  cell-content.js           ← cell-content.js
  cell-text.js              ← cell-text.js
  icon-image.js             ← icon-image.js
  item-painters.js          ← item-painters.js
  link-items.js             ← link-items.js
  canvas-kind-painters.js   ← canvas-kind-painters.js
  cell-tooltip.js           ← cell-tooltip.js
table-paint/
  painter.js                ← painter.js
  paint-body.js             ← paint-body.js
  paint-gridlines.js        ← paint-gridlines.js
  paint-header.js           ← paint-header.js
  paint-overlay.js          ← paint-overlay.js
  paint-utils.js            ← paint-utils.js
composables/
  use-tree-rows.js          ← use-tree-rows.js
  use-column-resize.js      ← use-column-resize.js
  use-cell-tooltip.js       ← use-cell-tooltip.js
  use-paint-state.js        ← use-paint-state.js
  use-pointer.js            ← use-pointer.js
  use-cell-click.js         ← use-cell-click.js
  use-cell-select.js        ← use-cell-select.js
  use-relayout.js           ← use-relayout.js
  use-table-instances.js    ← use-table-instances.js
  use-table-api.js          ← use-table-api.js
```

移动方式：文件系统 `mkdir` + `mv`（未用 git mv / git add，未提交）。

## 目录外 import 引用核查结果

grep（`grep -rn "table/ex" src/ demo/src/ --include="*.js" --include="*.vue"`）证实：任务预期"目录外直接 import 预期不存在"**与实际不符**——demo 侧存在对 ex/ 内部文件的直接引用。按任务约束"须同步更新并逐条列出"处理，共 **12 个文件、28 处**，全部已同步：

| 文件 | 行 | 旧 specifier → 新 specifier |
|---|---|---|
| demo/src/data/table-ex/main-view.vue | 346 | `../../../../src/components/table/ex/tree.js` → `.../ex/shared/tree.js` |
| demo/src/data/table-ex/self-checks/interactions.js | 36 | `@/components/table/ex/interactions.js` → `@/components/table/ex/interaction/interactions.js` |
| 同上 | 37 | `@/…ex/layout.js` → `@/…ex/geometry/layout.js` |
| 同上 | 38 | `@/…ex/row-geometry.js` → `@/…ex/geometry/row-geometry.js` |
| demo/src/data/table-ex/self-checks/painter.js | 23 | `@/…ex/painter.js` → `@/…ex/table-paint/painter.js` |
| 同上 | 24 | `@/…ex/editor.js` → `@/…ex/editing/editor.js` |
| 同上 | 25 | `@/…ex/layout.js` → `@/…ex/geometry/layout.js` |
| 同上 | 26 | `@/…ex/cell-painters.js` → `@/…ex/cell-paint/cell-painters.js` |
| 同上 | 28 | `@/…ex/row-geometry.js` → `@/…ex/geometry/row-geometry.js` |
| demo/src/data/table-ex/self-checks/cell-painters.js | 51 | `../../../../../src/components/table/ex/cell-painters.js` → `…/ex/cell-paint/cell-painters.js` |
| 同上 | 54 | `../../../../../src/components/table/ex/text-wrap.js` → `…/ex/shared/text-wrap.js` |
| demo/src/data/table-ex/self-checks/row-geometry.js | 24 | `@/…ex/row-geometry.js` → `@/…ex/geometry/row-geometry.js` |
| 同上 | 25 | `@/…ex/layout.js` → `@/…ex/geometry/layout.js` |
| demo/src/data/table-ex/self-checks/editor.js | 50 | `@/…ex/editor.js` → `@/…ex/editing/editor.js` |
| 同上 | 53 | `@/…ex/row-geometry.js` → `@/…ex/geometry/row-geometry.js` |
| demo/src/data/table-ex/self-checks/row-geometry-controller.js | 14 | `@/…ex/row-geometry-controller.js` → `@/…ex/geometry/row-geometry-controller.js` |
| 同上 | 15 | `@/…ex/spans.js` → `@/…ex/spans/spans.js` |
| 同上 | 16 | `@/…ex/text-wrap.js` → `@/…ex/shared/text-wrap.js` |
| demo/src/data/table-ex/self-checks/spans.js | 20 | `@/…ex/spans.js` → `@/…ex/spans/spans.js` |
| 同上 | 21 | `@/…ex/cell-painters.js` → `@/…ex/cell-paint/cell-painters.js` |
| 同上 | 27 | `@/…ex/row-geometry.js` → `@/…ex/geometry/row-geometry.js` |
| 同上 | 28 | `@/…ex/painter.js` → `@/…ex/table-paint/painter.js` |
| 同上 | 29 | `@/…ex/editor.js` → `@/…ex/editing/editor.js` |
| demo/src/data/table-ex/self-checks/layout.js | 27 | `@/…ex/layout.js` → `@/…ex/geometry/layout.js` |
| 同上 | 28 | `@/…ex/row-geometry.js` → `@/…ex/geometry/row-geometry.js` |
| demo/src/data/table-ex/self-checks/text-wrap.js | 18 | `@/…ex/text-wrap.js` → `@/…ex/shared/text-wrap.js` |
| demo/src/data/table-ex/self-checks/theme.js | 36 | `../../../../../src/components/table/ex/theme.js` → `…/ex/shared/theme.js` |
| demo/src/data/table-ex/self-checks/tree.js | 22 | `@/…ex/tree.js` → `@/…ex/shared/tree.js` |

其他目录外引用核查：

- `src/components/index.ex.js:2` → `./table/ex/index.js`：index.js 留根，无需改动。
- `src/`、`demo/src/` 内无其他 ex/ 内部文件引用（含 `../ex/` 相对形式，已单独 grep）。
- vite.config.js ex 模式仅替换组件注册表入口（`src/components/index.ex.js`），不受影响。
- 动态 import / require / import.meta：ex/ 内 grep 为零。

## 改动文件

对应"分类方案"（无设计步骤号，以分组为步骤单位）：

- 41 个移动文件：见上方映射表（`mv`，内容仅 import 行变更，逐文件 vs HEAD 校验一致）。
- `src/components/table/ex/table-ex.vue`：14 处 import 路径更新（composables/ ×10、geometry/、cell-paint/、spans/、editing/）。
- demo 侧 12 文件 28 行：见上表。
- 新增 8 个子目录：`shared/ geometry/ spans/ editing/ interaction/ cell-paint/ table-paint/ composables/`。

## 偏离

1. **任务输入预期有误（非设计文档，且任务已预留分支）**：00-task「预期不存在」的目录外直接 import 实际存在（demo 12 文件 28 处）。grep 证据见上节；处理方式即任务约束规定的"同步更新并逐条列出"，验收标准 5 亦已为此预留改动范围。
2. **首轮重写脚本层级错误（已修复）**：`../mappings`（ex/ 下指 `table/mappings.js`）被多加一层写成 `../../../mappings`（cell-content.js / editor-resolve.js 两文件）。import 解析审计脚本捕获（55 文件 191 specifier，broken=2），修正为 `../../mappings` 后复跑 broken=0。修复依据：从新位置 `ex/cell-paint/`、`ex/editing/` 回溯目录层级，`../../` 即 table/。
3. 无其他偏离。行为面核查：41 文件 vs HEAD blob 行数一致、差异行均为 import 行（脚本逐行比对通过）；export 面 / 组件注册名未动。

## 自检

| 检查 | 命令 | 结果 |
|---|---|---|
| 库构建 | `npm run build` | 退出码 0（base/ex × dev/prod 四段全过；无循环依赖告警，日志中 8 条 warn 均为本机 npm config 噪音） |
| demo 构建（目录外 import 编译门） | `npx vite build --config vite.demo.config.js`（一次性） | 退出码 0，`demo/dist/data/table-ex/main.js` 正常产出 |
| import 解析审计 | 临时脚本（已删除）：ex/ 全部 .js/.vue + 12 个 demo 文件，解析相对/`@/` specifier | 55 文件 191 个 specifier，broken=0 |
| 移动完整性 | 临时脚本（已删除）：41 文件 vs `git show HEAD:<旧路径>` 逐行比对 | 行数全部一致，差异行均为 import 行 |
| eslint | `npx eslint src/components/table/ex demo/src/data/table-ex` | ex/ 内 0 error / 6 warning（= 基线 6 warning，分散在 cell-paint 簇拆分后文件，内容未动）；4 个 error 均在 demo 存量文件（main-view.vue import/first ×2、self-checks/cell-painters.js no-unused-vars + no-template-curly-in-string），git diff -U0 证实本次仅改 import 路径行，不可能引入上述结构性/符号级 error → 无新增 |
| 行数 | `wc -l`（44 文件） | 最大 478（geometry/row-geometry-controller.js），全部 ≤500 |
| git 改动范围 | `git status --short` | `M table-ex.vue` + 41 `D`（旧路径）+ 8 `??`（新子目录）+ 12 `M`（demo import）+ 任务目录 untracked —— 与验收 5 相符；另见"遗留"第 2 条 |
| 行为验证 | demo 交互冒烟（附录 A CDP） | 按派发归 verifier 执行，本轮未跑（UNVERIFIED → verifier） |

## 遗留

1. **目录外一处注释路径过时**：`src/components/table/column-types/enum.js:4` 注释提及 `ex/editor.js`，现为 `ex/editing/editor.js`。属注释非 import，改注释超出本任务允许的目录外改动范围（仅 import 引用处），未动，建议后续任务顺带修正。
2. **`.vscode/settings.json` 会话内出现改动**（cSpell 用户词典新增词 `relayout`）：本任务未写入该文件，判定为编辑器 cSpell 扩展在会话期间自动加词（该词大量出现于本次检视的代码中）。未回滚（非本任务产物，回滚属丢弃他人改动）；git 范围核对时排除。
3. demo watch（:3000）当前未运行；验证前需启动 `npm run demo:build`，一次性构建产物已在 demo/dist 就绪。
4. 交互冒烟（自检 223/223、编辑浮层、选中/复制、console 无错误）待 verifier 执行。
