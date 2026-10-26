# Handoff

## Goal

side-menu 弹层级联改造方案的**二次审核**与按用户确认修订。审核对象为上轮修订方向规则后的 `agent-docs/plans/side-menu-popup-cascade/plan.md`；修订后方案待实施。

## Current State

- ✅ 二次审核完成：上轮修订（方向规则）与源码逐项核对无误（rail 48 / min-width 200 / max-width 400 与 scss 一致，分支逻辑、断言公式正确）；新发现 2 警告 + 1 疑问 + 若干小问题；上轮 6 条评审发现全部复核属实
- ✅ 警告与疑问经 AskUserQuestion 逐项确认，4 项决策已全部修入方案文档：
  1. **删旧断言 12**（几何不可达），位置由"方向延续"断言替补（继承实现后该场景轻易可达）
  2. **计时器清除以 §4.4 为准修 §3**：进入面板只清该层及其祖先的待关计时器，已离开的深层按自身计时收起；§7 新增断言 14（回上层面板）
  3. **方向规则改为父层方向继承**：每层默认侧 = 父层 position（链头 `'right'`），仅默认侧放不下且另一侧放得下才翻转，两侧不足保持默认侧（§4.7 重写、§6.8 决策 8 重写、§4.4 provide 附带 position ref）
  4. **resize 语义两处勘误**（§3 拆行 + §4.5 拆行）：与 scroll 同走 `handleAnchorMove()` 重定位，源码 `side-menu-popup.vue:183` 即此语义，不得照"关链"实现
- ✅ 前序交接 `handoff-side-menu-popup-cascade-review-20261010.md` 已同步更新为两轮累计状态；与方案文档重复处以方案文档为准
- ✅ 审核遗留 6 项经用户确认按建议全部修入方案文档：§4.5 两处补 `?.` 并删与 §4.6 重复的子层跟随句、§4.6 补 `handleAnchorMove` 向下委托条目、§4.8 补删 `createExpandToggle` import、§6.5 如实注明 `warnDeepLevel` 不可达、§7 新增断言 15（滚动/resize 链式重定位）
- ❌ 未写组件代码、未改 demo 数据、未浏览器验证

## Key Context

- **断言 12 不可达的推导**（决策依据，方案文档只留结论）：菜单宽 W、L1 左翻后 L2 锚点右缘 ≈ 菜单左缘 − 20，`rightSpace ≈ W + 右距 + 16`。demo W=240 时约 256~356 ≥ L2 常规宽（200~300）→ 旧"子层默认右"规则下 L2 恒右翻、盖 rail（方向锯齿）；左翻需面板宽逼近 max-width 400 的超长 label 协同，前置窗口仅几十 px。继承规则下 L2 `base='left'` 且左侧恒充足 → 恒左翻，无需特殊数据——故断言 12 是重写而非删除。
- **用户决策偏好**：警告/疑问逐项确认后再改文档；小问题与上轮遗留不擅自修入（"审核 → 用户决策 → 修订"节奏）。
- **遗留 6 项已全部修入方案文档**（用户确认按建议处理）：§4.5 两处可选链 + 跟随机制去重、§4.6 补 `handleAnchorMove` 委托、§4.8 补删 import、§6.5 告警不可达如实描述、§7 断言 15。知情项已接受放弃：断言 12/13 不覆盖新旧分叉点（两侧不足且左余量>右余量 → 旧取大侧、新保持默认侧）。
- 方向继承技术落点：base 经 §4.4 `provide('sideMenuPopup')` 附带 position 传递；`updatePosition` 递归先父后子，子层取 base 时序天然正确。

## Changed Files

- `agent-docs/plans/side-menu-popup-cascade/plan.md` — 18 处修订：状态行、§1 目标、§3 交互表（方向表述/待关清除/resize 拆行）、§4.4、§4.5（resize 拆行 + 两处 `?.` + 跟随机制去重）、§4.6（补 `handleAnchorMove` 委托）、§4.7 重写为方向继承、§5、§6.8 决策 8 重写、§4.8（补删 import）、§6.5（勘误）、§7 前置 + 断言 12 重写 + 新增断言 14/15
- `agent-docs/handoff/handoff-side-menu-popup-cascade-review-20261010.md` — 累计更新为两轮状态（7 处）
- `agent-docs/handoff/handoff-side-menu-popup-cascade-review2-20261010.md` — 本文件

注意：git 工作区在会话开始前已有多处未提交改动（side-menu 系列、scrollbar.js、demo 等），非会话产物，勿混入后续提交。

## Next Steps

1. 实施：按 §5 改动明细先 `side-menu-popup.vue`，再 `side-menu-node.vue` 的 `popupRow` 分支，最后补 demo 嵌套组数据
2. 按 §7 用 playwright 走 15 条断言（demo 页 `http://localhost:3000/side-menu/`，watch 服务通常已在跑，直接访问）；断言 12 需靠右列 rail 实例 + resize 微调，注意 demo 容器 flex-wrap 换行会破坏靠右几何
3. 验证通过后对外文档三处同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`）——按项目 AGENTS.md 需用户确认后才更新

## References

- 方案文档：`agent-docs/plans/side-menu-popup-cascade/plan.md`（§4.7 方向继承、§6.8 决策 8、§7 断言 12-14）
- 前序交接：`agent-docs/handoff/handoff-side-menu-popup-cascade-review-20261010.md`（两轮累计状态）、`agent-docs/handoff/handoff-side-menu-popup-cascade-20261010.md`（实施前基础交接）
- 相关源码：`src/components/side-menu/side-menu-popup.vue`（`computePosition` :65-98、resize :183）、`src/components/side-menu/side-menu.scss`（rail/min-width/max-width 值）、`demo/src/side-menu/main-view.vue`（flex-wrap 布局、demo 数据现状）

## Suggested Skills

- playwright MCP：§7 验证（项目 AGENTS.md 指定优先用它）
- `project-knowledge`：实施后若产生新坑（级联定时器、协调器互斥、方向继承）沉淀知识
