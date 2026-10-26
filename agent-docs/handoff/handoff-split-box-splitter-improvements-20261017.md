# Handoff

> 2026-10-17 · 第四阶段：split-box / splitter 复杂度与可读性改进（review 结论落地）。基线为第三阶段选项对象 API 完成态，工作区未提交。

## Goal

在不改变对外 API、交互行为、废弃警告语义的前提下，落地上轮 review 的改进：全局默认值改为每 app、修正旧 prop 优先级、收敛 split-box.js 重复逻辑、提升 splitter.vue 命名与分支可读性、去重两轴 CSS。

## Current State

- 第四阶段全部实现完成（2026-10-17 第二会话），工作区未提交。
- 实施内容与建议清单一致，另有两处实施决策：
  - `border-radius` 已获用户确认：line 形态基础 `::after` 保持 `1px`；pill 形态在两轴共用的 pill 基础块加 `calc(var(--full-size) / 2)`（厚度一半，端头全圆）。computed 断言 line=1px、pill 两轴均=2px。
  - h/v sides 去重采用「导出 `SPLIT_H_SIDES` / `SPLIT_V_SIDES` + 预生成 `splitHBoxSplitterProps` / `splitVBoxSplitterProps`」方案；`createSplitterProps` 不导出。
- splitter.vue 补充：`onPointerMove` 的 toggle 分支守卫恒真（progress ≥ 40 时上方同步块必已置 previewed），为满足 complexity ≤ 10 改为无条件清 previewed。
- 验证全部通过：
  - `npx eslint src/components/layout src/index.js` 0 问题；`npm run build`（dev+prod）通过。
  - playwright demo 回归 15/15：拖拽出 px、dblclick reset、collapse-only 类、预览阈值 20、收拢阈值 40、释放清理（mu-resizing/active/preview）、dblclick 展开、dblclickReset=false no-op（props 替换法注入）。
  - UMD 双 app 页 4/4：app 级全局默认互不污染（slim vs normal）、全局 resizable=false → inert、实例旧 prop resizable=true 压过全局 false；废弃警告正常输出。
  - 教训：拖拽后元素位移，boundingBox 必须每步重取（第一轮 5 个失败断言均为坐标过期，非代码问题）。
- 实施后追加 API 决策（用户确认）：`resizable` 默认值改为 `false`——默认仅渲染视觉分隔条（inert），拖拽需显式开启。`splitter.vue` prop default 改 false。
- 追加简化（用户确认）：`OPTION_DEFAULTS` 整个删除——全部选项缺席即默认，渲染类键由 splitter props 兜底；`dblclickReset` 缺席视为 true（`onSplitterDblclick` 改判 `=== false`）。`mergeOptions` 删除，改用 `utils/object.js` 的 `defaults({}, pick(侧对象), pick(splitter), legacy, pick(全局))` 按优先级倒序传入（defaults 先到先得）；白名单 pick 防用户侧未知键落到 splitter 根节点。语义差异：`defaults`/`pick` 不过滤 null，显式传 null 不再被跳过（原 mergeOptions 过滤），属误用暴露，可接受。
- 验证（playwright）：空选项 inert + 不可拖、collapse-only dblclick toggle 默认开启、`dblclickReset=false` no-op、resizable drag/dblclick reset；双 app UMD 页 4/4（全局 slim 不串 app、旧 prop 压全局、侧对象压全局）。ESLint 0 问题，build 通过。
- agent-docs 已同步：第三阶段文档 `splitBoxSplitterProps` 改名注记、knowledge headless 文档 defaultSplitterOptions 示例改历史表述。

## Key Context

### 1. 全局默认值改每 app（优先做）

- 现状：`split-box.js:9-12` 模块级 `defaultSplitterOptions`，`layout/index.js:3-8` 在 install 时 `Object.assign`，`src/index.js:56` 转发 `componentOptions`。
- 问题：模块单例跨 app 串值（多 app 测试、SSR 每请求一个 app、微前端），且与项目既有约定不一致。
- 既有约定与可用数据：tree/calendar/message-box 均读 `inject('$mussel').options.<key>`（`tree.vue:50`、`calendar/constants.js:23`、`message-box.vue:36`）；`src/index.js:40` 的 `context.options` 就是 `componentOptions`，已含 `splitter`。
- 方案：`useSplitBox` 内 `inject('$mussel', null)?.options?.splitter` 作为全局默认源；合并顺序 `OPTION_DEFAULTS < 全局 < 旧 prop < props.splitter < 侧对象`；删除 `defaultSplitterOptions`、`layout/index.js` 的 `install` 及导出、`src/index.js:56` 的转发（恢复 `installComponents(app)`）。
- 用户约束：默认值必须是普通对象、非响应式、安装期确定；不要引入 reactive/computed 依赖。
- 无 plugin 直连组件时 inject 为 null，fallback `{}`，与现状（模块对象为空）等价。

### 2. 旧 prop 优先级修正

- `split-box.js:96-120` 只在旧 `collapsible` 为 true/side 时写入，旧 `resizable` 完全不写入。结果：全局默认 `{ collapsible: true }` / `{ resizable: false }` 会压过实例上显式的 `:collapsible="false"` / `:resizable="true"`，违反文档声明的 `default < 旧 prop < splitter`。
- 修正：`props.collapsible !== undefined` 时总是写入 `[true, sides[side]].includes(...)` 的布尔结果；`resizable` 同理。渲染门控仍由 `hasSplitter` 负责，隐藏语义不变。
- 该组合场景罕见，属优先级一致性修正。

### 3. 默认值双份真相

- `split-box.js:25-33` 与 `splitter.vue:31-50` 重复 7 个默认值；box 填满后 `v-bind`，splitter 自身默认值在 box 场景失效。
- 建议：`OPTION_DEFAULTS` 只保留 `{ resizable: true, dblclickReset: true }`（`onSplitterDblclick` 需要），其余键仅在显式传入时按白名单透传，由 splitter 默认值兜底。逐项等价：size normal / shape line / visibility always / collapsible false / collapseHandle false。
- 保留 7 键白名单（`OPTION_KEYS`），防止未知键落到 splitter 根节点或覆盖 `collapsed` 等内部状态。

### 4. split-box.js 简化清单

- `OPTION_KEYS` 与 defaults 键重复：合并 helper 内部改用白名单循环，减少一份列表。
- `pickOptions` + 5 次 `Object.assign` → `mergeOptions(...sources)`：以 defaults 为基，逐 source 按白名单覆盖非空值。
- 删 `collapsibleStart/End`（:164-165）与 `unref`（:3、:180），`updateCollapsed` 按 target 直接读 `startOptions/endOptions`。
- `startSplitterProps/endSplitterProps`（:152-162）抽 `toSplitterProps(options)`（剥离 `dblclickReset`）。
- 两个 watch（:209-221）合并；改用数组源 `watch([hasStartSplitter, () => startOptions.value.collapsible], ...)`，避免 getter 返回新数组导致每次重算都触发回调。
- `warnDeprecatedProps()`（:123）移出 computed，放 setup 主体执行一次（`warn` 内部 once 去重，但避免 computed 副作用）。
- `[true, sides[side]].includes`（:99、:142）抽 `isSideEnabled(value, side)`；resizable 修正后复用同一 helper。
- `genSplitterProps` 命名与第三阶段文档的 `splitBoxSplitterProps` 不一致，建议统一（如 `createSplitterProps`）并同步旧 handoff 文档。
- h/v box 的 sides 重复：从 split-box.js 导出 `SPLIT_H_SIDES` / `SPLIT_V_SIDES`，或预生成 `splitHBoxSplitterProps` / `splitVBoxSplitterProps`。注意 defineProps 只能引用 imported binding，不能引用 setup 局部变量。

### 5. splitter.vue

- :55 `COLLAPSE_THRESHOLD` → `DEFAULT_COLLAPSE_SIZE`，与新增的 20/40 阈值区分。
- :107 `tMin / 2 || COLLAPSE_THRESHOLD` 显式化为 `tMin ? tMin / 2 : DEFAULT_COLLAPSE_SIZE`。
- :132 仅 `props.resizable` 时计算 `calculateSizeRange`（或移入 resize 分支），collapse-only 不需要 startSize/min/max/collapseSize。
- :123 `stopDrag` 仅在本次拖拽置过 preview 时 emit false；把 `previewed` 挂到 `activeDrag`。注意 toggle 分支已 emit false。
- :128 入口防重入 `if (activeDrag) return`（或先 `stopDrag()`），避免第二指针覆盖句柄导致旧监听泄漏。
- 不改交互常量与阈值语义。

### 6. CSS

- `splitter.scss:119-130`、`:218-229`：collapse-only/inert 两轴规则完全相同，上提到基础块，写成 `&.mu-flex-splitter--collapse-only` / `&.mu-flex-splitter--inert`（特异性 0,2,0，仍压过 row/col 的 cursor）。
- `split-box.scss:20-24`：`transition` 移到 `.mu-split-box__start, __end` 基类，退出预览也有过渡。
- `splitter.scss:39` border-radius 变更待确认；未确认时恢复 `calc(var(--full-size) / 2)`。

### 7. 边界与验证

- 不触碰工作区中 message/tooltip/utils 的无关注改动；不提交；文档三处同步需用户确认（项目规则）。
- 实现期不使用 mussel-ui skill。
- `vite build` 不校验 setup 未定义标识符：批量改名/删引用后 grep 旧名（`defaultSplitterOptions`、`collapsibleStart`、`genSplitterProps` 等）。
- demo watch 常驻 :3000；本环境 playwright 可用（第三阶段会话无）。验证页 `http://localhost:3000/flex-layout/`。
- 补第三阶段遗留的 dblclick 三断言：resizable→reset、collapse-only→toggle、`dblclickReset=false`→no-op。
- 行为回归：默认拖拽、阈值收拢、预览、动态关闭复位（第三阶段 11 项断言）。

## Changed Files

- 本轮（实现）：`src/components/layout/{split-box.js,split-h-box.vue,split-v-box.vue,splitter.vue,index.js,splitter.scss,split-box.scss}`、`src/index.js`；demo 未改。
- 文档：本文件、`handoff-splitter-options-object-api-20261017.md`（改名注记）、`knowledge/global/headless-edge-dom-verification.md`（示例更新）。

## Next Steps

1. 文档三处同步（**须先征得用户确认**，项目规则）：`skills/mussel-ui/references/components/layout.md`、`docs/quick-reference_components.md`、`docs-site/components/split-box.md`——补 splitter 选项对象 API（含第三阶段）与全局默认 `app.use(Mussel, { splitter })`（现为每 app 注入，非模块单例）。
2. 提交与否由用户决定（工作区含 message/tooltip/utils 无关改动——勿混入同一提交）。

## References

- 第三阶段交接：`agent-docs/handoff/handoff-splitter-options-object-api-20261017.md`
- rev2 定稿：`agent-docs/handoff/handoff-split-box-splitter-refactor-20261017-rev2.md`
- 源码：`src/components/layout/{split-box.js,split-h-box.vue,split-v-box.vue,splitter.vue,index.js,split-box.scss,splitter.scss}`、`src/index.js`
- 全局选项约定样例：`src/components/tree/tree.vue:50`、`src/components/calendar/constants.js:23`、`src/components/message/message-box.vue:36`
- 知识库：`agent-docs/knowledge/INDEX.md`（headless 验证、demo watch 清 dist 等）
- 验证页：`demo/src/flex-layout/main-view.vue`

## Suggested Skills

- `project-knowledge`：实现中若发现新坑/模式，按 AGENTS.md 时机沉淀。
- `mussel-ui`：仅文档同步阶段查阅结构；实现期禁用（项目规则）。
