# Handoff

## Goal

side-menu 弹层级联改造（`side-menu-popup` 每层单级、逐层浮出）。方案经两轮评审与修订（第二轮：方向继承、resize 勘误、计时器表述对齐、断言调整，均经用户逐项确认）；代码仍未实施。方案文档 `agent-docs/plans/side-menu-popup-cascade/plan.md` 待实施。

## Current State

- ✅ 方案与 dev 分支源码逐条核对完成（两轮），结论：整体可实施，核心机制（递归自持子弹层、provide 路由 openPopup、仅链头注册 coordinator、定时器链）与源码一致，行号引用无错位
- ✅ 方向规则两轮修订：先改为「默认右、右不足且左充足才左翻」，后经确认改为**父层方向继承**（每层默认侧 = 父层 position，链头 'right'；仅默认侧不足且另一侧充足才翻转，两侧不足保持默认侧）——方案 §4.7 / §6.8
- ✅ 二次审核 4 项决策已修入文档：方向继承（§1/§3/§4.7/§5/§6.8）；resize 语义勘误为 handleAnchorMove 重定位（§3/§4.5，源码 `side-menu-popup.vue:183` 即此语义）；§3「进入面板取消整链待关」改为「该层及其祖先」（对齐 §4.4 规则 1）；断言 12 重写为方向延续断言（继承后可达：菜单右半 + L1 左翻 → L2 左翻不盖 rail）、新增断言 14（回上层面板：下层按自身计时收起本层留）
- ✅ 审核遗留 6 项经用户确认按建议全部修入文档：§4.5 两处补 `?.` 并删与 §4.6 重复的子层跟随句、§4.6 补 `handleAnchorMove` 向下委托条目、§4.8 补删 `createExpandToggle` import、§6.5 改为如实注明 `warnDeepLevel` 不可达、§7 新增断言 15（滚动/resize 链式重定位）
- ❌ 未写任何组件代码、未改 demo 数据、未做浏览器验证

## Key Context

**本会话新增、方案文档之外的信息**（评审发现 + 方向规则推论，均未写入文档者优先在此列出）：

- **审核遗留项已全部修入文档**（用户确认按建议处理，方案 §4.5/§4.6/§4.8/§6.5/§7）：§4.5 表格两处可选链、updatePosition 子层跟随统一走 §4.6 递归（删 §4.5 重复句）、§4.6 补 `handleAnchorMove` 委托、§4.8 补删 import、§6.5 告警不可达如实描述、断言 15 补链式重定位验证。知情项已接受放弃：断言 12/13 不覆盖新旧分叉点（两侧不足且左余量>右余量 → 旧取大侧、新保持默认侧），构造窗口窄。

- **方向继承的关键事实**（已写入 §4.7/§6.8，实施时务必知悉）：base 传递经 §4.4 的 `provide('sideMenuPopup')` 附带 position ref；`updatePosition` 递归先父后子，时序天然正确。左挂 rail 下 L1 恒右 → 子层 base 恒右，子层锚点左缘 ≈ 68px（rail 48 + GAP 4 + 行内边距 16）< min-width 200px → **L2+ 恒右（左翻分支在 rail 布局下等价死代码，这正是规则想要的效果）**。菜单靠右时 L1 左翻 → 子层 base='left' 且左侧恒充足 → 逐层向左延续不盖 rail（旧「子层默认右」规则下该场景 L2 会因右侧余量恢复 ≈ 菜单宽+20 恒向右盖 rail，锯齿——继承正是为消除它而加）。

- 与旧 `computePosition`（`side-menu-popup.vue:65-98`，源码尚未改动）的行为分叉点：①第三分支（两侧都不足取空间更大一侧）删除，两侧不足保持默认侧；②子层默认侧不再是恒 'right' 而是父层 position。L1 层除两侧不足场景外与旧规则一致。

- 方向规则两轮修订**只改方案文档**，源码未动。

## Changed Files

两轮会话仅改文档，未触碰源码：

- `agent-docs/plans/side-menu-popup-cascade/plan.md` — 第一轮：状态行、§1/§3/§4.7/§5/§6.8/§7 方向规则修订；第二轮（用户逐项确认）：状态行、§1 目标、§3 交互表（方向表述 / 待关清除 / resize 拆行）、§4.4 provide 附带 position、§4.5 resize 行勘误、§4.7 重写为方向继承、§5、§6.8 决策 8 重写、§7 前置与断言 12 重写 + 新增断言 14
- `agent-docs/handoff/handoff-side-menu-popup-cascade-review-20261010.md` — 本交接文档（两轮累计更新）

注意：git 工作区在会话开始前已有多处未提交改动（side-menu 系列、scrollbar.js、demo 等），非本会话产物，勿混入后续提交。

## Next Steps

1. 按方案 §5 改动明细实施：先 `side-menu-popup.vue`（递归子实例 + provide 路由 + 定时器链 + 链头 manager + 级联关闭 + **§4.7 方向继承** + 删除展开相关），再 `side-menu-node.vue` 的 `popupRow` 分支，最后补 demo 嵌套组数据
2. 按 §7 用 playwright 走 15 条断言（demo 页 `http://localhost:3000/side-menu/`，watch 服务通常已在跑，直接访问）；断言 12 需选靠右列 rail 实例 + resize 微调（注意 flex-wrap 换行会破坏靠右几何）
3. 验证通过后，对外文档三处同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`）——按项目 AGENTS.md 需用户确认后才更新

## References

- 方案文档：`agent-docs/plans/side-menu-popup-cascade/plan.md`（含 §4.7 方向继承规则、§6.8 决策 8、§7 断言 12-15）
- 前一版交接：`agent-docs/handoff/handoff-side-menu-popup-cascade-20261010.md`
- 前置方案：`agent-docs/plans/side-menu/plan.md`、`agent-docs/plans/side-menu-revision/plan.md`（R2 浮出行为定稿）
- 弹层协调器：`src/components/common/popup.js`
- 项目知识索引：`agent-docs/knowledge/INDEX.md`

## Suggested Skills

- `project-knowledge`：实施完成后若产生新坑（级联定时器、协调器互斥、方向规则死分支）沉淀知识
- playwright MCP：按 §7 做 DOM 断言（项目 AGENTS.md 指定优先用它）
