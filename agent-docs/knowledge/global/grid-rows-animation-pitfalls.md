# grid-template-rows 0fr↔1fr 展开动画的坑

适用场景：`grid-template-rows: 0fr ↔ 1fr`（或 `minmax(0, 0fr ↔ 1fr)`）过渡做展开/收起动画（collapse 面板、side-menu 组子菜单同款配方）。四个独立坑，症状各异：

## 1. 收起残留空隙：0fr 轨道计入 item margin

grid 轨道 sizing 用 item 的 outer contribution（border-box + margin）；`min-height: 0 + overflow: hidden` 只压 content 贡献，压不掉 margin。给收起容器（0fr 轨道 item）加 `margin-top` 会残留等高空隙（rows 如 `"48px 2px"`）。`row-gap` 同理不随轨道收缩。

正确：间距放 overflow hidden 容器**内部首子元素**上，随 0fr 一起收没：

```scss
.mu-side-menu__group {  // 0fr 轨道 item，overflow: hidden
  & > .mu-side-menu__node:first-child { margin-top: 2px }  // 内容内间距，不泄漏
}
```

验证：收起态读 `getComputedStyle(li).gridTemplateRows`，`"48px 0px"` 为干净、`"48px 2px"` 为泄漏。

## 2. 过渡中行内容抖动：auto 轨道被 fr 插值隆起

`auto 0fr ↔ auto 1fr` 过渡中 auto 轨道 used size 钟形隆起再回落（实测 48 → 77.2 → 48px），item 被 stretch 拉高，行内居中内容下沉回弹，两方向都出现。容器高度 indefinite（内容撑开）时必现。

修复二选一：首轨道用确定长度（`<length> 0fr ↔ <length> 1fr`，全程恒定）；或 fr 轨道独立成只含单一 fr 轨道的动画容器（side-menu 旧结构做法）。

验证：逐帧读 `gridTemplateRows`，首轨道值随帧变化即中招。

## 3. 多余 item 漏出：单条显式轨道只约束首个 item

`grid-template-rows` 只定义一条显式轨道时，仅容器**首个**直接子元素受约束，第 2 个起落隐式 `auto` 轨道，不参与 fr 收缩/过渡（collapse 实测：插槽 3 个根元素时收起轨道 `0px 20px 20px`、残留 40px）。

正确：动画容器与插槽内容之间加一层固定包裹元素（如 `.mu-collapse__content`），把任意形态插槽内容收敛成恰好一个 grid item。容器自身 padding 同理在轨道之外不收缩，间距须放唯一 item 上。

## 4. 动画期间 scrollIntoView 错位

触发展开的同一 tick 内 nextTick 后执行 scrollIntoView，落点按**动画中间态**位置计算，最终滚不到位。nextTick 只保证 DOM patch 完成，插值仍在进行。

正确：发生展开变化时等动画时长结束后再滚（实现取 `setTimeout(scroll, 200)` 对应 150ms 过渡）；无展开变化可立即滚。首次挂载另有的初始渲染延迟与此是两回事。

## 来源

- collapse 组件、side-menu 组展开（src/components/collapse/、src/components/menu/）
- 各坑实证记录见原单条目 git 历史（grid-0fr-track-margin-leak / grid-auto-track-fr-transition-bump / grid-single-explicit-track-ignores-extra-items / scroll-during-grid-rows-animation）
