# 决策清单

- [启动] 用户指定组合：(primary 修复 + fast 检验) × n，n ≤ 2 — 无设计/评审环节，直修
- [启动] 任务目录用 agent-docs/plans/20261107-table-ex-striped-overflow/ — 项目 AGENTS.md 约定替代 .pipeline/
- [补充] 用户追加同族缺陷：横向滚动时 head 绘制阴影越界，派 primary 续做处理 — 验收标准增第 4 条，检验合并为一次覆盖两项修复
- [澄清] 用户澄清：阴影越界是窄列情况（列总宽 < 表格宽）下超界，非超出整个表格区域 — 缺陷描述与验收标准 4 已修正，重派续做
- [澄清] 被取消续做实例无源码残留（src 改动均为首轮 striped 修复），仅仓库根目录遗留 2 张复现探针 PNG（default-yscrolled-xscrolled.png / narrow-yscrolled-shadow.png），任务结束统一清理
