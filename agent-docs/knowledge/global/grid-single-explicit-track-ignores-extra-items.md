# grid 单条显式轨道忽略多余 item

## 结论

`grid-template-rows` 只定义一条显式轨道（如 `minmax(0, 0fr)` / `minmax(0, 1fr)`）时，只有 grid 容器的**首个**直接子元素受该轨道约束；第 2 个起的子元素落入隐式 `auto` 轨道，不参与 `fr` 收缩/过渡。

插槽内容收敛：在动画容器与插槽内容之间加一层固定包裹元素（如 `.mu-collapse__content`），把任意形态的插槽内容收敛成**恰好一个 grid item**，与内容形态解耦。

## 原因

fr 轨道尺寸由 item 贡献解算，隐式轨道按 `grid-auto-rows`（默认 `auto`）尺寸，`minmax(0, ·fr)` 的下限对它无效。

collapse 组件实测（Chromium 120）：默认插槽 3 个根元素直接作为 grid item 时，收起态轨道为 `0px 20px 20px`、面板残留 40px；加收敛层后轨道单值 `0px`。

## 注意

- 同理间距也不能放 grid 容器自身 padding 上（容器 padding 在轨道之外不收缩，实测收起残留 16px），须放唯一 item 的 padding 上并由 `minmax(0, ·)` 下限归零。
- 关联：`grid-0fr-track-margin-leak`、`grid-auto-track-fr-transition-bump`。
