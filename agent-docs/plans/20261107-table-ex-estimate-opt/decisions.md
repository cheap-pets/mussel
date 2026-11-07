# 决策清单

- [启动] 流水线 = D1(designer/primary) → X(design-amender/peer) → R(designer 终订) → (I1+I2)×≤2；R 后不再 X 复审 — 用户指定
- [启动] implementer 绑定 Fast 槽位（默认 Primary）— 用户指定 "fast 实施"
- [启动] 基线 `M todo/misc.md` 为用户工作文件，与本任务无关 — 调度者判定
- [启动] totalHeight 采样修正（滚动条跳动）不纳入，另案提案 — 会话分析既定
- [启动] 评审方式取交叉（peer 直接审改设计），对应 design-review-cross 单轮 — 用户"peer 修订设计"指定
- [实施] 设计经 X 审改（AMENDED 4 项）+ R 终订全接受，用户流水线预授权直接实施（等价确认门"自动"）— 用户指定流程
- [终验1] 环境阻塞处置：用户选择解除阻塞后重验（接入 playwright MCP，派终验-2）— 用户答复
