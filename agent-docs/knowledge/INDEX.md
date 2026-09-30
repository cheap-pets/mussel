# 项目知识

> 按 project-knowledge skill 规范维护：新知识写入 `pitfalls/`、`patterns/`、`conventions/`、`constraints/`、`tradeoffs/` 子目录，并在此索引登记。方案/规划类文档归 `agent-docs/plans/`，不入知识库。

## Pitfalls

- [Teleport 弹层与宿主组件的 CSS 变量级联断裂](./pitfalls/teleport-popup-css-vars.md)
  弹层 Teleport 到 root 后宿主类上的组件级 CSS 变量不生效，弹层类须重复声明默认值。

- [grid-template-rows 展开动画期间执行 scrollIntoView 会错位](./pitfalls/scroll-during-grid-rows-animation.md)
  nextTick 后立即滚动按动画中间态计算，须等动画时长结束后再滚。
