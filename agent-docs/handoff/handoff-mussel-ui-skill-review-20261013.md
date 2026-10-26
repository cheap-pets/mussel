# Handoff — mussel-ui skill 修订方案

## Goal

评审 `agent-docs/plans/mussel-ui-skill-review/plan.md`（针对 `skills/mussel-ui/` 的修订方案），修正其中的错误判断、补齐遗漏项，并把文档改写成 agent 可直接执行的清单（只保留 agent 工作所需信息，删除给人阅读的解释性内容）。

## Current State

已完成：方案文件已重写并落盘。[mussel-ui-skill-review.md](/Volumes/External/workshop/cheap-pets/mussel/agent-docs/plans/mussel-ui-skill-review/plan.md)

未开始：`skills/mussel-ui/` 下任何文档均未改动（受 AGENTS.md「未经确认不更新文档」约束）。方案中 P1/P2/P3 全部条目待执行。

## Key Context

**任务性质**：用户要求「检查方案，有问题或优化点直接修订」。deliverable 是**方案本身**，不是 skill 文档。方案获批后才动 skill 文件。

**方案改写原则**（用户明确要求）：文档中文字必须都是 agent 工作所需，不能是给人阅读的补充解释。因此删掉了原方案的「总体结论」「做得好的」等评价段落，每项只保留「现状 → 事实（含 `file:line`）→ 修复 → 验证」四段式。

**复核结论**：原方案 3 条 P1 修正（`navigation.md:25` header 插槽作用域参数、`styles.md:277` `.flex-0` 取值、`upgrade/rules.md:146` 导出清单漏 `icons`）经源码复核**全部属实**；63 个全局组件覆盖结论准确。但原方案自身有 4 处错误 + 3 处遗漏，已订正：

错误（原方案写错/误判，勿回退）：
1. `form.md` 透传表重复只涉 3 个组件（Date/DateRange/Time），非 4 个；Color 无该表，`form.md:436` 是 `disabled`/`readonly` 说明行
2. 标题层级问题中 `form.md` 全文用 `##` 是最主要不一致，原方案整段漏掉
3. `upgrade/rules.md:308` 属性选择器清单**确有缺项**（缺 `align-self`、`collapsible`、`padding-x/y`、`margin-x/y`、`margin-*`、`padding-*`），相对 `upgrade/process.md:70` 不同步。原方案判定「清单已列全，删『等』即可」有误——须先补齐
4. `upgrade/process.md:70` 不是「等」开放列表（是完整枚举），原方案误列

新增漏项：
1. `MuTabButton` 在 V4 **不再全局注册**（`src/components/tabs/index.js` 只注册 MuTabs/MuTabBar/MuTabPanel，`tab-button.vue` 是 `MuTabBar` 内部组件）；Mussel 3 曾全局注册（`mussel3/src/components/index.js:138`）。`upgrade/rules.md:1033` 迁移表未提示此点，会让 agent 误以为标签仍可用。列为 P1-4
2. `SKILL.md:37`（判不准→走默认路径）与 `upgrade/process.md:35`（不确定→询问用户）是**判定规则矛盾**，非仅用词问题。原方案归入语言类。已升级为 P1-6
3. `dropdown-items` 位置疑问给定论：维持现状不改（`form.md:240` 已互链 `navigation.md:198` 单源）

**版本基准**：`package.json` 为 `4.1.5`。方案文档中两处「核对日期」写的是 2026-10-12，P2-5 要求执行时统一为执行日（本次会话日期 2026-10-13）。

**关键源码事实**（已核实，供后续会话免重复核对）：
- `src/components/index.js` 注册 63 个 `Mu*` 组件 + 2 个指令（`v-mu-scrollbar`、`v-mu-tooltip`）
- `src/index.js:61-66` 导出：`* from './env'`、`EventInterceptor`、`colors`、`icons`、`install`/`installIcons`
- `src/components/menu/side-menu.vue:10` header 插槽不传 `:collapsed`，仅 :40 的 footer 传

**未提交的工作区状态**（会话开始前已存在，非本次改动）：`AGENTS.md` 修改、`skills/mussel-ui/SKILL.md` 修改、`skills/upgrade-v1-to-v4/` 三个文件已删除、`skills/mussel-ui/references/upgrade-v1/` 三个文件为新增未追踪。即上一轮 commit 在做 v1 skill 合并，本次方案建立在该合并后的结构上。

**三处副本约束**：组件/公共样式文档在 `skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/` 三处互为副本。方案 P1-2（`.flex-0`）与 P3-4（`text-*` 措辞）属公共样式描述，改动须同步后两处。

## Changed Files

- `agent-docs/plans/mussel-ui-skill-review/plan.md` — 全量重写（唯一改动）

## Next Steps

1. 等用户对方案的确认/批准
2. 批准后按 P1-1 ~ P1-6 执行事实订正（共 6 项，十分钟级），逐条按方案内的「验证」段落核对
3. 再执行 P2-1/P2-2（收益最高：减少 SKILL.md 每轮全文注入的上下文占用、消除「先违反规范再返工」路径）
4. P2-3/4/5 与 P3 各项独立，可按需分批
5. 改动完成后同步 `docs/`、`docs-site/` 三处副本（仅 P1-2、P3-4 涉及）
6. 未要求提交前不要 commit

## References

- 修订方案：[agent-docs/plans/mussel-ui-skill-review/plan.md](/Volumes/External/workshop/cheap-pets/mussel/agent-docs/plans/mussel-ui-skill-review/plan.md)
- 上游 commit：`fae78c4` 修订 mussel-ui 与 upgrade-v1-to-v4 skill
- 相关 skill：`skills/mussel-ui/SKILL.md`、`skills/mussel-ui/references/upgrade/rules.md`、`skills/mussel-ui/references/upgrade-v1/rules.md`
- 相关历史规划：`agent-docs/plans/skill-doc-revision/plan.md`、`agent-docs/plans/skill-internal-detail-cleanup/plan.md`

## Suggested Skills

- `ste-clarify-zh` — P3-4 语言细节批量修订时可用，但须注意本方案要求的是「agent 工作所需」的表述，与纯消歧改写不完全等价
