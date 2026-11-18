# Decisions
- [2026-11-18 用户] 批②-c（C2 条目包装归一）不做 — 收益低，纯搬移成本提前付
- [2026-11-18 用户] C3 四类型合并剔除（peer 裁决过度抽象）、C5 剔除（raw column 防御兼容非缺陷）
- [2026-11-18 用户] pointercancel 取消语义对齐项目现有实现（cancel≈up 提交，5 处一致）— 不单独决策
- [2026-11-18 用户] 协作模式：primary 修改 → (exec 验证 → primary 修复)×n，n≤2 — 实际首轮 PASS 未进修复轮
- [2026-11-18 调度者] 任务目录用 agent-docs/plans/（项目约定覆盖 .pipeline/）；check-scope 因无 02-design.md 跳过，范围核对并入 verifier
- [2026-11-18 调度者] verify-readonly check 报 3 处 allow 内产物误报（中文文件名/相对路径匹配失效），源码零越权，不还原
