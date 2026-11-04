# 已确认决策

- [启动] 自定义流水线：designer 设计 → design-amender 审改 → designer 交叉修订 → (implementer + verifier) × n（n ≤ 2）— 用户指定
- [启动] implementer 绑定 Fast 槽位（默认为 Primary）— 用户指定
- [启动] 评审方式为交叉；R 回应后不再派 X 复审（用户流程未含复审环节）— 用户指定
- [启动] 实施粒度为整体 — 用户流程为单一实施+检验组合
- [启动] 任务目录用 agent-docs/plans/20261104-enum-column-mappings/ — 项目 AGENTS.md 指定（覆盖 .pipeline/）
- [D1/未解问题1] A4「保留 color 选项能力」解释为：text 列新增 column.color 选项（与 bool/number 等类型对齐），mappings 移除后 text 仍具染色能力 — designer 解释性决定，经审改员复核，最终由用户检查点确认
- [D1/未解问题2-3] 知识库 INDEX.md 条目 33/36 冲突与文档三处同步 — 推迟至任务收尾、用户确认后处理，不在实施范围
- [R/交叉回应] 台账 #1-#9 全部接受，A4 解释维持；回应未经 X 复审（用户流程无复审环节）— 设计状态：通过（交叉），回应未复核风险由终验兜底
