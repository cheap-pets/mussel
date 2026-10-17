# Handoff

> 2026-10-17 · 第三阶段：split-box splitter prop 重构为选项对象 API。在 rev2（未提交工作区）基线上继续；rev2 文档见 References。

## Goal

split-h-box / split-v-box 的 splitter 相关 prop 改为选项对象 API，旧 prop（git HEAD 已发布面）保持兼容并输出废弃警告。

## Current State

- 全部实现并验证（构建 dev+prod、ESLint、headless Edge 运行时断言），工作区未提交。
- 最终 API：
  - `splitter: Object`（两侧共享）；`leftSplitter/rightSplitter: [Boolean, Object]` 默认 `true`，`false` 不渲染该侧分隔条（v-box 为 `topSplitter/bottomSplitter`）。
  - 选项键 7 个：`size/shape/visibility/resizable/collapsible/collapseHandle` 透传 splitter；`dblclickReset` 由 box 层消费（双击行为总开关，默认 true）。
  - 合并优先级：`defaultSplitterOptions`（全局）< 旧 prop 兼容值 < `splitter` < `xSplitter`。
  - 全局默认：`app.use(Mussel, { splitter: {...} })`；`src/index.js` 把 `componentOptions` 转发给 `installComponents` → `layout/index.js` 的 `install()` 合入 `defaultSplitterOptions`（普通对象，非响应式，仅安装期生效——用户明确不要 reactive）。
- 旧 prop 兼容（HEAD 4.1.5 发布面，warnDeprecated kebab 警告 + 新 API 未覆盖的键上生效）：`resizable`/`collapsible`（false|true|side 枚举，兼渲染门控）、`splitter-size/shape`、`splitter-collapse-handle`、`splitter-dblclick-reset`。Boolean 类 prop 显式 `default: undefined`（防"缺席转 false"无法区分未传）。
- rev2 阶段未发布的按侧布尔 prop（`left-resizable/left-collapsible/left-splitter-visibility` 等）直接删除，无兼容（git 中不存在）。
- 代码结构：全部收敛在 `split-box.js`——`useSplitBox(props, { component, sides })` 单一 composable（吸收 preview 状态、v-bind 剥离 computed、`onSplitterDblclick`、级联复位 watch、collapsible 接线）+ `createSplitterProps({ start, end })` props 工厂（第四阶段统一命名；本阶段代码名为 genSplitterProps）。组件内解构用 start/end 原名，不重命名。
- `splitter.vue` 的 `onPointerMove` 已简化（`toggled` 早返回 + preview 边沿触发锁存），complexity 12>10 警告消除。
- demo（flex-layout）已改新 API。

## Key Context

- **API 形态经多轮用户反转**，最终定稿如上。历史：拆分返回（startSplitterProps+BoxOptions）→ 完整返回+组件内 rest 剥离 → 合并单 composable；`showSplitter`→`hasSplitter`；`globalSplitterOptions`→`defaultSplitterOptions` 且去 reactive。用户偏好：命名状态化（hasXxx）、消除重复、结构收敛、组件内直接用 start/end 原名。
- **defineProps 不能引用 setup 局部变量**：props 工厂调用处必须内联 `{ start: 'left', end: 'right' }` 字面量（SFC 编译限制）；import 引用无问题。
- **vite build 不校验 setup 未定义标识符**：模板/脚本改名漏项只会在运行时炸（本轮曾漏 right/bottom 侧，grep 复查发现）。批量重命名后必须 grep 旧名。
- 拖拽行为验证用合成 PointerEvent（页面内打桩 `HTMLElement.prototype.setPointerCapture = function () {}` 绕过无活动指针的 NotFoundError，`clientX` 即 `pageX`）；本环境无 playwright。11 项断言全过（预览阈值 20、收拢 45、toggle 冻结、释放清预览、resizable 出 px、清理 mu-resizing/active）。
- `dblclick` 分支（dblclickReset/resizable→reset、collapsible→toggle）未做运行时验证（DOM 不可静态观测），仅代码 review。
- 4.1.5 是否已发布仍未确认（rev2 遗留）；breaking 项（默认出条、size 默认 normal、旧按侧 prop 删除）迁移说明需随版本发布。
- 验证方法沉淀：`agent-docs/knowledge/patterns/headless-edge-dom-verification.md`、`pitfalls/demo-watch-wipes-dist.md`。

## Changed Files

- `src/components/layout/split-box.js` — 重写：useSplitBox 合并全部逻辑 + createSplitterProps 工厂 + defaultSplitterOptions
- `src/components/layout/split-h-box.vue` / `split-v-box.vue` — 收缩为本地 props + 工厂展开 + 一次 useSplitBox 解构 + onMounted(init)
- `src/components/layout/index.js` — 新增 `install(app, options)` 合入 `options.splitter`
- `src/index.js` — `installComponents(app, componentOptions)` 转发安装选项
- `src/components/layout/splitter.vue` — onPointerMove 简化
- `src/components/layout/splitter-options.js` — 创建后按用户要求删除（并入 split-box.js）
- `demo/src/flex-layout/main-view.vue` — 新 API
- `agent-docs/knowledge/` — patterns/headless-edge-dom-verification.md、pitfalls/demo-watch-wipes-dist.md + INDEX.md 登记

## Next Steps

1. 文档三处同步（**须先征得用户确认**，项目规则）：`skills/mussel-ui/references/components/layout.md`、`docs/quick-reference_components.md`、`docs-site/components/split-box.md`——新 API props 表、示例、迁移映射（可参考 rev2 文档第 5 节映射表 + 本阶段旧 prop 兼容替代文案）、breaking 标注。
2. 确认 4.1.5 发布状态，决定迁移说明随版本节奏。
3. 提交与否由用户决定（当前全部未提交，含 rev2 中间态与 message/tooltip/utils 无关改动——勿混入同一提交）。

## References

- 前序：`agent-docs/plans/handoff-split-box-splitter-refactor-20261017-rev2.md`（rev2 定稿，含交互规则/迁移映射/CSS 规则）
- 源码：`src/components/layout/split-box.js`、`split-h-box.vue`、`split-v-box.vue`、`splitter.vue`、`index.js`、`src/index.js`
- 验证页：`demo/src/flex-layout/main-view.vue`
- 知识索引：`agent-docs/knowledge/INDEX.md`

## Suggested Skills

- `mussel-ui`：仅文档同步阶段查阅现有文档结构（实现期项目规则禁用）
- `project-knowledge`：若后续产生新坑/模式，按 AGENTS.md 时机沉淀
