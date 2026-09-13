# 保存 Tooltip 设计方案文档

不进行代码实现，仅将已确认的设计方案（浅色浮层 + 带箭头）写入 `docs/plans/tooltip-component.md`，命名跟随现有 `docs/plans/*.md` 惯例。

文档内容：
- 背景与调研结论（库内及 V1/V3 无先例；复用 dropdown-panel 定位/显隐时序、usePopupManager、$mussel.rootElement Teleport）
- API 设计（props/事件/expose，用法示例）
- 视觉规范（浅色浮层变量、箭头、动画）
- 定位算法（4 向 + 自动翻转 + 交叉轴居中夹紧 + 箭头偏移修正）
- 显隐时序与触发方式（hover/focus/click）
- 文件清单（新增/修改）
- 验证方案（demo 页 + Playwright DOM 断言）
- 后续可扩展项（v-mu-tooltip 指令、start/end 对齐变体）

仅新建这一个文件，不动其他代码。