# 已确认决策

- [启动] 修订轮数 = 1 — 用户确认
- [启动] 设计复核 off — 用户确认
- [检查点 1] 用户指令：针对 03-review-2 全部未决条目（blocker 2 / major 10 / minor 10）再走一轮修订 + 评审（人工驱动，不计入设计循环；记 03-human-1.md）
- [检查点 2] 用户指令：使用 impl-verify 流水线实施（设计未通过评审：03-review-3 blocker 1 / major 2 / minor 5 未决，视为接受已知风险）
- [I1 前] 03-review-3 的 8 条未决项按其评审建议并入实施约束（不回改设计文档）：①日期面板 blur 兜底判据改"面板内焦点或最近 window pointerdown 目标在面板内"；②G0 夹具补 columns 替换 / headerChecked·orderBy 受控绑定 / 就地改 record 处理器 / resizable 开启 / DOM 版 mu-table 参照；③demo 暴露坐标辅助（getCellRect）供 page.mouse 坐标级交互；④viewH/viewW 口径 = clientHeight−headHeight / clientWidth−fixedWidth；⑤multiline 未识别 is 的 items 按文本绘制；⑥拖拽宽度以 widthOverrides（按列 key）存放，不写回 props；⑦枚举编辑值 = mapping key（字符串）；⑧拖拽误触 flag 在 pointerup 后延时清除 — 依据：用户已知悉全部未决条目后指令实施；调度者据 impl-verify「不改设计」与验收可行性合并处理