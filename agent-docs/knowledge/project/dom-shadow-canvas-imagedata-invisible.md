# overlay DOM 阴影 canvas getImageData 不可见

## 触发特征

断言 canvas-table 滚动阴影「出现/位置」时，getImageData 读 header 下沿区域与未滚动帧无像素差异，疑似功能失效。

## 根因

顶部滚动阴影是 overlay 层 DOM 元素的 box-shadow（`.mu-canvas-table__header-shadow`），不在 canvas 位图内，getImageData 读不到。

## 做法

- 错误：用 canvas 像素对比验证 DOM overlay 效果（阴影出现、位移、显隐）。
- 正确：断言 DOM（元素 offsetTop / computed box-shadow / 显隐类），或截图后合成像素比对；canvas 内绘制的阴影才可用 getImageData。

## 来源

agent-docs/plans/20261027-canvas-table-improve/05-verify-1.md（A2 行验证手段修正）；src/components/canvas-table/canvas-table.scss
