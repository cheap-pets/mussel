# table-ex 计数断言冷键被预热致重跑恒败

## 触发特征

自检面板首次全绿，「重跑自检」后缓存计数断言恒败：期望首绘计 2 实得 1（A=2/B=1 类），或目标键计数恒为 0；伪装成组件缺陷。

## 根因

劫持 `measureText` 断言缓存命中时，固定字符串冷键在同进程内已被前序用例或 demo 页预热——模块级缓存/字体已有该键，首绘即命中，重跑不复现冷启动计数。

## 做法

- 错误：固定字符串冷键 + 固定期望计数（如首绘 A=2 / 二绘 B=1）。
- 正确：冷键 = 基底字符串 + 每次运行随机小数（保证同进程唯一）；按探针字符/字形维度计数而非总次数断言；`document.fonts.status === 'loaded'` 设为断言前置。图标字形计数直调 `drawIconGlyph`（iconSizeOf 取整会使逐字形缓存键漂移）。

## 来源

demo/src/data/table-ex/self-checks/cell-painters.js；agent-docs/plans/20261107-table-ex-align/04-impl.md
