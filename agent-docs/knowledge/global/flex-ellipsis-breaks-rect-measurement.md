# flex 压缩截断破坏 rect 内容宽测量

## 结论

对 flex 行做"渲染后实测内容宽"类自适应计算（如 pagination 页码档位收敛）时，若行内存在 `overflow: hidden; text-overflow: ellipsis` 的可压缩子元素：

1. **rect 跨度会被截断量抵消**——行溢出时该元素吸收全部压缩量，`getBoundingClientRect()` 跨度随之缩小，"内容宽 ≤ 容器宽"恒成立，判定虚高。须用 `Range.selectNodeContents(el).getBoundingClientRect().width` 补回文本自然宽（亚像素精确；勿用 `scrollWidth − clientWidth`：ellipsis 字形计入 scrollWidth 会高估，且两者均整型取整）。
2. **首尾子元素 margin 计入 flex 行外尺寸**——负自由空间按含首尾 margin 计算，rect 跨度只覆盖首尾元素边框之间。漏算则临界宽度下 span ≤ inner 判过、自由空间实为负，元素仍被压出省略号。

## 原因

- flex item 的自动最小宽度默认为 min-content；设 `overflow: hidden` 后归零，行溢出时该元素可被压缩到任意宽度（渲染为省略号）。
- 其余常见坑：`offsetWidth` 不含 margin；`justify-content: center` 下起点侧溢出不计入 `scrollWidth`（测量一律用 rect 跨度，不用 scrollWidth 判溢出）。

## 注意

- 适用前提是行内其余元素 `flex: none`（刚性），压缩只落在可截断元素上；若还有其他可压缩元素（如无 nowrap 的 `···` span），它们同样会让 rect 测量失真。
- 实例：`src/components/bar/pagination.vue` 的 `contentWidth()`（方案与验证记录见 `agent-docs/plans/pagination-button-count.md`）。
