# 容器 display:none 期间测量污染溢出折叠宽度缓存

## 结论

横向 menu 一级溢出折叠（`menu.vue`）在容器（或任意祖先）`display:none` 期间执行测量，会把 **0 宽度**写入 `widthCache`；恢复显示后按 0 宽直算 → 全部一级项展开渲染、溢出触发器消失、行被 `overflow: hidden` 裁剪。**0 宽应视同"未测量"**：测量写入加 `width > 0` 守卫（或 `innerWidth() <= 0` 时跳过测量），使 `computeCount` 继续返回 `-1` 走 `fullMeasure` 兜底。

## 原因

- 折叠数由 `widthCache` 直算（`computeCount`）；`display:none` 子树无布局盒，`getBoundingClientRect().width` 恒为 0。
- 隐藏瞬间 `sizechange`（RO 观测到 0×0）照常派发 → `recompute` 重测可见行，测量写入不设洁净条件，0 宽直接入缓存。
- 现状（含漂移检测）靠**下一次容器 resize** 的漂移比对（缓存 0 vs 真实宽）触发全量重测自愈；删除漂移检测的直算路径改动（见 `agent-docs/plans/menu-overflow-measure.md`）会去掉该自愈路径，损坏状态持续到 items 身份变化 / `fonts.ready` 重测。
- 实测（`demo/menu` 面板 2，900px、8 项，正确态 = 6 行 + 触发器）：容器 `display:none` → 恢复后 8 行、无触发器（错误）；再 resize 至 640px 后恢复为 5 行 + 触发器（正确）。

## 注意

- 触发条件是测量发生时元素无布局盒。`visibility: hidden` / 移出视口不影响（宽仍真实）；`v-if` 卸载重建实例不涉及。
- 挂载时就处于 `display:none`（含首测落在 `fonts.ready` 之后而仍隐藏）同样污染，机制相同。
- 0 是安全哨兵：栏行内在宽恒 > 0（图标槽 16 + 行内 gap 8 + 左右 padding 32，见 `menu.scss` 栏行覆盖）。
- 同类 rect 测量失真但机制不同：见 [flex 压缩截断破坏 rect 内容宽测量](./flex-ellipsis-breaks-rect-measurement.md)。
