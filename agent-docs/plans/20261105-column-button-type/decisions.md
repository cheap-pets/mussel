# 已确认决策

- [启动确认] 基线 `M demo/src/data/table-ex-basic/main-view.vue` 视为与本任务无关，保留原样 — 用户选择
- [启动确认] (impl → verify) 对上限 n=2：初次实施+验证，FAIL 后最多 1 次自动修复轮（R=1，键「整体/终」）— 用户按字面确认
- [启动确认] 确认门=自动：R1 完成后不经检查点直接进入实施；设计末次改动未经 X 复核的状态随实施记录 — 用户选择
- [D1未解问题] DOM 侧按钮组不做溢出截断语义（td 自然换行；canvas 逐 pill 丢弃越界）——designer 判定不影响验收标准，对齐留待后续
- [D1未解问题] mu-table button 列不配类型级默认宽（table-ex TYPE_DEFAULT_WIDTHS 140/80 仅 table-ex 消费，demo 均显式配宽）——双端默认宽一致属后续任务
- [人工意见1-1] DOM 侧 button 直接使用 mu-button，强制 small 尺寸 — 用户裁决，取代设计原 pill 视觉镜像方案（设计被拒备选 3 方向）
- [人工意见1-2] 文档三处不随本次实施同步，后续单独任务处理 — 用户裁决
- [D1修订未解] 双端色域不一致：DOM 通道受 MuButton color validator 仅 4 色、canvas 17 色，超出色 DOM 回退缺省；为 MuButton 扩色或 canvas 收敛属后续任务 — designer 判定不影响本次验收
- [R1] 设计阶段结束：X1 AMENDED 无未解决异议，R1 全项复核接受并确认联动自洽；按确认门=自动进入实施 — 设计末次改动已经 A 复核，无残留风险；设计状态记为「交叉审改后经 A 复核接受」（非 AGREE）
