# Handoff

## Goal

按 `agent-docs/plans/side-menu-popup-cascade/plan.md`（两轮评审定稿）实施 side-menu 弹层级联改造（每层单级、逐层浮出），并用 playwright 走完 §7 全部 15 条断言。

## Current State

- ✅ 实施完成：`side-menu-popup.vue` 级联主体、`side-menu-node.vue` popupRow 分支、demo 嵌套组数据
- ✅ 15 条断言全部通过（2026-10-10，`http://localhost:3000/side-menu/`）
- ✅ 验证中发现并修复 2 个实现 bug（见 Key Context），修复已回写方案文档 §4.4 规则 3 / §4.6 注记
- ✅ 方案文档状态行改为「已实施并验证」；知识库沉淀 2 条 pitfall 并更新 INDEX
- ❌ 对外文档三处同步未做（按项目 AGENTS.md 需用户确认后才更新）
- ❌ 未提交 git（未被要求）；git 工作区在会话开始前已有多处未提交改动，非本会话产物，勿混入

## Key Context

- **实施 bug 1（已修）**：`hide()` 内沿用 `clearHideTimer()` 的向上清语义，会取消祖先尚未触发的待关计时器 → 链收起时先触发的深层把祖先计时器清掉，L1/L2 滞留成孤儿（断言 5 实测暴露）。修复：hide 只清自身。方案原文只定义了「向上清」的保活语义，未定义 hide 的清理边界。
- **实施 bug 2（已修）**：`updatePosition()` 递归子层时，父面板 `popupStyle` 响应式 patch 尚未落地，子层读父面板内锚点 rect 拿到旧坐标 → resize/scroll 下子层不跟随（断言 15 实测暴露）。修复：清 left/right/top 旧键后 `Object.assign(el.style, style)` 同步写 DOM 再递归。
- **playwright 验证经验（DOM 合成事件）**：
  - MCP 工具调用间隙可能触发真实 window blur → coordinator 关链；时序敏感断言必须放在单次 evaluate 内完成
  - `el.click()` 不产生 mousedown；coordinator 的外点判定靠 mousedown，dropdown 靠 mouseover（非 mouseenter）触发——各需对应事件
  - 合成 mousedown 的 target 不能是 window（`Node.contains(window)` 抛 TypeError），用 body
  - 收藏面板内行 `data-key` 恒为 null（in-favorites 置空），DOM 断言须按 header/label 定位；弹层面板定位用「可见优先」过滤，防多实例隐藏残留面板混链
  - demo flex-wrap 布局换行项恒靠左，无自然靠右实例；断言 12/13 用 `transform: translateX` 平移 rail 实例模拟靠右几何（rect 随 transform 变化，弹层按 rect 定位），验证后还原
- **验证偏差（有意为之）**：demo 嵌套组加了第二个组 `report-finance`（方案 §5 只写一个），为断言 8 同层双组行换锚复用提供数据；断言 8 在 L2→L3 层执行（L1 面板内仅一个组行）；断言 8 的面板顶对齐校验须按「底对齐翻转」分支算（面板 bottom = 锚点行 bottom，实测恒差 96px 为面板高）
- 弹层内图标 path 为 tabler 相对坐标形式（chevron-right 是 `m9 6 6 6-6 6`），断言别按绝对坐标 `M9 6l6 6l-6 6` 匹配

## Changed Files

- `src/components/side-menu/side-menu-popup.vue` — 级联改造主体（含 2 处实施修订）
- `src/components/side-menu/side-menu-node.vue` — popupRow 加 popup 分支 + 注释同步
- `demo/src/side-menu/main-view.vue` — 报表下补 report-custom / report-finance 两个嵌套组
- `agent-docs/plans/side-menu-popup-cascade/plan.md` — 状态行 + §4.4 规则 3 + §4.6 同步写 DOM 注记
- `agent-docs/knowledge/project/cascade-delay-hide-clears-ancestor-timer.md` — 新增
- `agent-docs/knowledge/global/reactive-style-patch-vs-recursive-rect-read.md` — 新增
- `agent-docs/knowledge/INDEX.md` — 登记上述两条
- `agent-docs/handoff/handoff-side-menu-popup-cascade-impl-20261010.md` — 本文件

## Next Steps

1. 对外文档三处同步（需用户确认后执行）：`skills/mussel-ui/references/components/`（side-menu 页）、`docs/quick-reference_components.md`、`docs-site/components/side-menu.md`——补充级联浮出行为说明（每层单级平铺、hover 组行逐层浮出、方向沿父层延续）
2. 同步完成后可做一轮快速回归（断言 1/2/5/12 即可覆盖主路径）
3. 提交按用户指示进行（commit 规范见项目 AGENTS.md，注意剔除会话前遗留改动）

## References

- 方案文档（含实施修订）：`agent-docs/plans/side-menu-popup-cascade/plan.md`
- 前序交接：`agent-docs/handoff/handoff-side-menu-popup-cascade-review2-20261010.md`（实施前最后状态）、`handoff-side-menu-popup-cascade-review-20261010.md`、`handoff-side-menu-popup-cascade-20261010.md`
- 新沉淀知识：`agent-docs/knowledge/project/cascade-delay-hide-clears-ancestor-timer.md`、`agent-docs/knowledge/global/reactive-style-patch-vs-recursive-rect-read.md`

## Suggested Skills

- `mussel-ui`：对外文档同步时参考其组件描述结构（写文档用；项目 AGENTS.md 禁止在改组件功能时用它，写文档不受限）
- playwright MCP：文档同步后的快速回归
