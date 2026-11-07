# 决策清单

- [启动] 流程 = D1(designer@primary) → X×1(amender@peer) → R×1(designer@primary) → (I1@fast → I2@fast)×≤2 — 用户指定，取代 cross 标准 AGREE 门与循环
- [启动] 槽位：implementer/verifier 均绑 pipeline-fast（验证为独立实例、同模型） — 用户指定，优先于回退规则
- [启动] 任务目录用 agent-docs/plans/ — 项目 AGENTS.md 约定
- [人工修订1] 设计未解问题1（hover 编辑描边滚入固定列压上沿）落地为验收标准 4，须修复 — 用户裁定，取代"默认不处理"
- [人工修订1] 流程切换：(implementer@primary 修改 + verifier@fast 检验) × ≤2 — 用户指定；zcode 重启后 subagent 或可用 playwright
- [人工修订2] 新验收标准 5：跨列合并格 B 的上/下相邻行端列 hover 后，B 内部被合并格线不得显现（脏区重绘须跳过合并区间；hover 过 B 后消失为现状） — 用户报告
- [人工修订2] R1 检验取消并入下一轮：fast 检验须同时覆盖验收 4（hover 描边裁剪）与验收 5（合并格线残影）及既往 UNVERIFIED 项 — 用户指定
- [人工修订2] 预算重算：预估 11（原7+修订轮4），派发上限 ceil(11×1.5)=17 — 验收范围扩大
- [人工修订2] 新缺陷3：hoverMode=column 时跨列合并 B 的相邻行首/末列 hover 后 B 内部格线残留，再次 hover B 后消失 → 验收标准 5 — 用户报告
- [人工修订2] R1 检验取消（用户中断）；fast 检验须同批覆盖验收 4+5+既往 UNVERIFIED 4 项；(修改+检验) 额度与 00-task 修复轮键"整体" R=2 对齐，耗尽即停
