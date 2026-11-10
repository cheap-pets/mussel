# decisions

- [启动] 任务目录用 agent-docs/plans/20261110-table-ex-overflow-tooltip/（项目 AGENTS.md 指定，不用 .pipeline/）
- [启动] 用户指定非预设流水线：primary 设计 → peer 修订 → (free 实施 → free 验证)×2；实施与验证均为 free 独立实例（同模型，上下文隔离，用户知情指定）
- [启动] column.title === false 抑制 tooltip，为验收标准 A3
- [实施r1校验] 保留 src/components/form/form-field.vue（console.log）与 demo/src/form/form/main-view.vue（error=""）的非任务改动 — 用户确认为其本人/其他会话调试改动，流水线不触碰，继续验证
