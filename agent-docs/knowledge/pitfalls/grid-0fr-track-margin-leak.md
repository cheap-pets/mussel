# grid 0fr 收缩轨道计入 item margin，收起态泄漏间距

## 结论

`grid-template-rows: 0fr` 收起动画中，grid item 的 `margin`（含 margin-top）计入轨道 content 贡献尺寸：`min-height: 0 + overflow: hidden` 只能把 content 贡献压到 0，压不掉 margin。给收起容器（如 side-menu 组子菜单）加 `margin-top` 会导致收起后残留等高空隙（computed rows 如 `"48px 2px"`）。

间距应放进**被裁剪的内容里**（容器内首个子元素上），随 0fr 一起收没：

```scss
.mu-side-menu__group {  // 0fr 轨道 item，overflow: hidden
  & > .mu-side-menu__node:first-child { margin-top: 2px }  // 内容内间距，不泄漏
}
```

## 原因

grid 轨道 sizing 用 item 的 outer contribution（border-box + margin）；`min-height: 0` 只解除 content 最小高，margin 不受影响。间距元素位于 overflow: hidden 容器内部时，容器高度被轨道钉死为 0，内容（含 margin）整体被裁剪。

## 注意

- 验证方法：读收起态 `getComputedStyle(li).gridTemplateRows`（如 `"48px 0px"` 为干净，`"48px 2px"` 为泄漏），或比对收起后 li 底边与行底边。
- `row-gap` 同理不随轨道收缩，不适用做展开区间距。
