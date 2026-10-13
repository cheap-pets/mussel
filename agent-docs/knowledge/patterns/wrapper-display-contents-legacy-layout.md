# 包裹层 display: contents 兼容既有扁平布局

## 结论

组件需要新增包裹层（如为横向布局模式引入 `__body`）但默认模式依赖 title/message/slot 等直接子元素的扁平布局（根 gap、align-items 居中、slot 内 `mt-auto`）时：包裹层默认 `display: contents`（不生成盒子，子元素仍按根容器子元素参与布局），仅新模式选择器下改生成盒子。参照 `status-box.scss` 的 `icon-position='right'` 实现。

## 原因

- 若包裹层始终是普通盒子：slot 从根的直接子元素降级为孙元素，`mt-auto`（自由空间在包裹层内部为 0）失效、`self-stretch` 基准从根宽变为包裹层宽、整体居中结构改变——已有用法静默回归。
- `display: contents` 下子元素的包含块是祖父容器，根的 gap / 对齐 / auto margin 行为与真实扁平 DOM 完全一致。

## 注意

- `& > *` 这类子选择器不再命中下沉为孙元素的节点，其上的 `overflow` / `max-width` 等规则须随之下放到元素自身，否则默认模式丢失裁剪/限宽。
- 新模式选择器（含属性选择器）特异性高于基础规则，不依赖书写顺序。
- 包裹层上被忽略的属性（contents 盒子不应用 overflow/max-width）无需清理，留着无害。
