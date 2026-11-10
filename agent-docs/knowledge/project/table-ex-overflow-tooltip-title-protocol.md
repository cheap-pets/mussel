# table-ex 溢出 tooltip title 协议

## 结论

- table-ex（canvas）列溢出 tooltip：`title` 未设置 / `null` 视同 `true`——文本、tag、button 条目溢出省略时 hover 自动出 tooltip；仅显式 `title: false` 抑制。
- 触发链：`cell-content.js` / `hit-test.js` 门控 → `use-cell-tooltip.js`（`$mussel.tooltip` 控制器缺失即短路全不出）→ `cell-tooltip.js` 求值与测量。
- DOM 版 mu-table 不在此协议内：base/table 路径未触及，原生 title 仍仅对 truthy 生效——canvas 默认开 / DOM 默认关为有意分叉，统一口径须另立任务。

## 来源

src/components/table/ex/cell-paint/cell-content.js、cell-paint/cell-tooltip.js、composables/use-cell-tooltip.js、interaction/hit-test.js、table-ex.vue（worktree 2026-11-10，未提交）

## 注意

- 控制器缺失宿主（不完整 install）下 devWarn once 去重提示，关闭方式 `title: false`。
- 验证：`http://localhost:3000/data/table-ex/?scene=default`（文本+title:false）与 `?scene=items`（tag/button），悬停须先移出 tooltip 面板（pointer-events:auto 物理覆盖上方格，直接垂直移入被拦截为既有语义）。
- `cell-tooltip.js` 有 eslint complexity warning（12>10），设计真值矩阵所致，属已知豁免。
