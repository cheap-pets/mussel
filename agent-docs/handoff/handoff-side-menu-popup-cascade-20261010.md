# Handoff

## Goal

side-menu 弹层（`side-menu-popup`）级联改造：每层面板只平铺一级菜单，面板内组行 hover 时右侧继续弹出下一层（flyout）。本会话任务为**设计方案并保存为文件**，方案已完成，代码未实施。

## Current State

- ✅ 已读源码（side-menu 全部文件、`src/components/common/popup.js` 协调器、demo 数据）与既有方案文档
- ✅ 方案已定稿保存：`agent-docs/plans/side-menu-popup-cascade/plan.md`（待评审，未实施）
- ❌ 未写任何组件代码
- ❌ 未改 demo 数据
- ❌ 未做浏览器验证

## Key Context

以下要点均已写入方案文档（引用其章节号），新会话读该文档即可，此处仅列索引：

- **多级显示的根因**：popup 内 `popupRow` 恒 false（`side-menu-node.vue:76-80` 判定含 `!popup`）→ 组行内联递归渲染整棵子树 + `resetExpanded` 全展开（方案 §2）。
- **最大的坑**：`createPopupCoordinator`（`src/components/common/popup.js`）的 `claimPopup` 有弹层单例互斥，每层弹层都注册 manager 会打开 L2 时关掉 L1——仅链头注册，子弹层由父层驱动（方案 §4.5）。
- **定时器链语义**：面板 mouseleave 臂自己+全部祖先（防链滞留）、锚点行 mouseleave 只臂子弹层（防误收）；进入任一面板向上清全链（方案 §4.4）。
- **模板陷阱**：`@mouseleave="delayHide"` 会把 MouseEvent 传入新签名首参 `withAncestors`，须改为显式传参（方案 §4.4 末段）。
- 方案内含 7 条决策记录（ESC 关整链、组行点击无动作、不做三角形检测等，§6）与 12 条 playwright 验证断言（§7）。
- 弹出触发路径不变（折叠 rail hover 一级组 / 展开态 hover 二级组），这是 `side-menu-revision.md` R2 的定稿，本次不改。

## Changed Files

本会话仅新增两个文档，未触碰任何源码：

- `agent-docs/plans/side-menu-popup-cascade/plan.md` — 方案文档（本任务交付物）
- `agent-docs/handoff/handoff-side-menu-popup-cascade-20261010.md` — 本交接文档

注意：git 工作区在会话开始前已有多处未提交改动（side-menu 系列、scrollbar.js、demo 等，见 `git status`），非本会话产物，勿混入后续提交。

## Next Steps

1. 用户评审 `agent-docs/plans/side-menu-popup-cascade/plan.md`，确认或调整决策（重点：§6 决策记录）
2. 按 §5 改动明细实施：先 `side-menu-popup.vue`（主体），再 `side-menu-node.vue` 的 `popupRow` 分支，最后补 demo 嵌套组数据
3. 按 §7 验证计划用 playwright 走 12 条断言（demo 页 `http://localhost:3000/side-menu/`，watch 服务通常已在跑，直接访问）
4. 验证通过后，对外文档三处同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`）——按项目 AGENTS.md 需用户确认后才更新

## References

- 方案文档：`agent-docs/plans/side-menu-popup-cascade/plan.md`
- 前置方案：`agent-docs/plans/side-menu/plan.md`、`agent-docs/plans/side-menu-revision/plan.md`（R2 浮出行为定稿）
- 弹层协调器：`src/components/common/popup.js`
- 项目知识索引：`agent-docs/knowledge/INDEX.md`

## Suggested Skills

- `project-knowledge`：实施完成后若产生新坑（如级联定时器、协调器互斥）沉淀知识
- playwright MCP：按验证计划做 DOM 断言（项目 AGENTS.md 指定优先用它）
