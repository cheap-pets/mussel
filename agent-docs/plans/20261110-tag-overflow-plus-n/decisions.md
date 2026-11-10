# decisions

- [启动] 用户指定与上一任务相同流水线：primary 设计 → peer 修订 → (free 实施 → free 验证)×2；实施/验证为 free 独立实例
- [启动] 基线含上一任务未提交改动（溢出 tooltip 8 文件）与用户保留的 form 调试 2 文件；本任务改动叠加其上，回滚需按文件清单区分
- [启动] `+n` tag 的 tooltip 与既有 title 协议的关系（是否受 title:false 控制）未指定，交设计裁决并在修订时终审
- [设计r1校验] 新增 docs-site/docs/skills 4 个 form-field 文档改动，为 form 调试同主题的用户并行改动 — 延续上一任务"保留不动"裁决，范围核对时排除
