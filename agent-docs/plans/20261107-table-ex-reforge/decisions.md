# 已确认决策

- [启动] 流水线按用户指定固定：primary 设计 → primary 修订 → (fast 实施 → fast 检验)×n≤2 — 覆盖三档预设默认值
- [启动] design-amender 槽位由用户指定为 pipeline-primary（同模型、全新独立实例），取代默认 Peer — 用户明确指定
- [启动] 提交策略：实施阶段不 commit（用户未答，按项目默认「未要求不提交」）；确认门时再确认，若用户要求则改按 code-reforge 每批独立 commit
- [确认门] 两次询问未获答复，按用户预设流水线继续实施；设计已经独立修订(AMENDED/争议0)，全部改动不提交可按批回滚，终验后交用户审查
- [确认门] 提交策略维持「不提交」
- [收尾] 检验 PASS 后执行既定收尾：02-map.md 改写现状导航（code-reforge 步骤6收尾）+ table-ex-structure-map.md 知识同步（INDEX-table 站规「代码重构后同步更新」），特别授权 designer 编辑该知识文件
- [扩展] 用户指令：free subagent（等同 fast 槽位）执行收尾修复 + table-ex 注释精简；并发 ≤3、滚动派发（完成一个立即发下一个）；本波次预估 12 派发 / 上限 18
- [扩展] 自检断言冻结仅对「icon 列重跑判错项」解除（用户明确要求修改）；重构等价性已由 05-verify-1 PASS 闭环
- [扩展] 注释精简原则：@host-* 注解与契约/不变式注释逐字保留，零代码 token 变更，每批 eslint 自证，最终统一 build+自检验证
