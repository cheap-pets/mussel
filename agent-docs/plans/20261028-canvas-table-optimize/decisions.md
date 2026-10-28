# 决策记录

- [任务创建] 流水线采用用户自定义：design → amender → design 复审 → impl → verify（FAIL 最多再 2 轮 impl+verify）；设计阶段不设用户确认门。 — 用户在请求中明确定义。
- [任务创建] enum 直接移除、不做兼容层。 — 用户目标"去掉 enum 类型"。
- [impl 后] 环境豁免：无 playwright mcp、3000 服务未运行，验收 4/5 及浏览器手段项判 UNVERIFIED + 需人工，不判 FAIL；可自动化项必须全部执行。 — impl 与调度者均确认环境无浏览器工具。
- [impl 后] 设计 S0 的改前性能基线未能采集（同上环境限制），验收 5 的"无回退"度量转为需人工项，在收尾汇报中如实说明。 — 同上。
- [用户指示] verify 第 2 轮：playwright mcp 已接入调度者环境，浏览器类验收项（UNVERIFIED 的 #2/#4/#5）改用 playwright mcp 实测；若连接失败则沿用上轮环境豁免裁定，不得改用 npx 起浏览器。 — 用户明确要求重跑。
