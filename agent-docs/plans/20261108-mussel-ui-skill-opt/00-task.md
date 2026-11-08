# 任务：mussel-ui skill 整体检查与优化

## 目标
优化项目内 `skills/mussel-ui`：
1. 将 mussel1/mussel3 升级内容拆为独立 skill：`skills/mussel1to4`、`skills/mussel3to4`
2. 内容与 `src/` 当前实现一致
3. 组件/API 覆盖已有实现
4. SKILL.md 主线精简，非主线内容合理拆到 references/，references 划分合理
5. 语言面向 agent：准确、简洁、不冗余

## 基线
git status --short（2026-11-08 摘要，前任务遗留）：
- M：`src/components/table/ex/**`（37 文件）、`demo/src/data/table-ex/self-checks/**`（5）、`agent-docs/knowledge/**`（4）、`todo/misc.md`
- D：`src/components/table/ex/interaction/interactions.js`
- ??：`agent-docs/plans/20261107-*/`、`scripts/`、`src/components/table/ex/interaction/{click-resolve,hit-test,resize-resolve}.js`
- `skills/`、`docs/`、`docs-site/` 无改动
本任务改动仅限 `skills/mussel-ui/**`、`skills/mussel1to4/**`、`skills/mussel3to4/**`。

## 约束
- 不改 `src/`、`docs/`、`docs-site/`、全局 `~/.zcode/skills`；仅项目内 `skills/`
- 不执行 git 提交
- 拆出的两个新 skill 需含可用 SKILL.md（frontmatter name/description，触发词覆盖升级场景）
- 文档面向 agent 消费，不写人类向铺垫

## 验收标准
1. `skills/mussel1to4/SKILL.md`、`skills/mussel3to4/SKILL.md` 存在且自包含升级内容；mussel-ui 不再含升级迁移主线（可留指引行）
2. mussel-ui references 组件清单与 `src/components/` 实际导出一致；抽查 API 描述与实现一致
3. SKILL.md 结构：主线只留核心流程，非主线在 references，划分清晰无重复
4. 无与源码矛盾的描述（以抽查清单为准）

## 验证命令 / 环境
- 清单比对：`ls src/components/` vs `skills/mussel-ui/references/components/`
- 无构建要求；verifier 抽查源码一致性

## 预设与开关
自定义流水线（用户指定）：fast 探索 → fast 拆出 upgrade → primary 设计 → peer 评审 → primary 复核定稿 → primary 实施（并发 3）→ primary 终检
- 设计修订 N=1；确认门：无（用户已授权全流程）；并发数：实施阶段 3

## 槽位与角色映射
- fast：pipeline-fast（explorer；拆出步 implementer）
- primary：pipeline-primary（designer / implementer ×3 / verifier）
- peer：pipeline-peer（design-reviewer）
评审模型：异构；验证：独立实例

## 流水线名
临时组合（用户自定义七步）

## 预算
- 预估派发 13 = 前段 9（实 10）+ 追加段 3（skills 补录 1 + docs/docs-site 同步 1 + 终检 1）
- 派发 `d / 上限 20`（追加段启动时重算）
- 设计修订 `k / 1`；回设计 `0 / 1`；修复轮 `终 0 / 1`
