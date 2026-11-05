# 实施记录（修复轮 1，键「终」）

模式：修复。依据：05-verify.md（终验报告）失败项 1、失败项 2 + UNVERIFIED 1；02-design.md 修订 4「验证」节为验收口径。实现源码（src/components/table/）本轮零改动。

## 改动文件

| 文件 | 对应问题 | 改动 |
| --- | --- | --- |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 失败项 1 | 「icon 列：双通道 compile 产物」块 DOM 断言改走 base table 真实消费链：`resolveColumnType('icon').compile(column, true)` 产物直断（构建链与 `src/components/table/base/table.vue:180` 同款）。svg 形态（`domSvg.class === 'mu-table__icon-cell'` 及 items/attrs/innerHTML 各键）与 cls 形态（class 直挂、无 innerHTML 键）两处断言均由 `resolveCellContent` 改为 compile(el, true) 链——`resolveCellContent` 是 canvas 解析链（`prepareColumn._render` 恒以 `type.compile(column)` dom=false 构建，`cell-painters.js:203`；且 `:300-303` 剥顶层 class/style/title），对 icon 列恒产 canvas 产物，不适用于 DOM cell class 断言 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 失败项 2 | 「button 图标」块 x 序断言期望值按连续横排布局修正：`["●@16","编辑@32","●@12","编辑@16"]` → `["●@16","编辑@32","●@70","编辑@102"]`。计算：条目起点 = 前序条目宽累加 + gap 8（与同文件 `:1040` 既有两遍式布局断言「pill 34×2 + gap 8」同语义）——条目 1 起点 8 → icon x = 8+8 = 16、caption x = 8+8+12+4 = 32；条目 2 起点 8+50+8 = 66 → icon-only 图标 pill 内居中 x = 66+(20−12)/2 = 70（`cell-painters.js:1467`）；条目 3 起点 66+20+8 = 94 → 降级 caption-only x = 94+8 = 102（`:1485`）。与终验实测实际值逐项一致。实现代码未动 |
| `demo/src/data/table-ex/main-view.vue` | UNVERIFIED 1 | editButton 夹具补 cls 形态用例：「启用」列追加 `editButton: { icon: 'demoGlyphA' }`（`demoGlyphA` = `installIcons` 注入类名 `mu-demo-glyph-a`，页面 `:338-340` 已注册）；svg 形态夹具（备注列 `dots`）保留不动。两形态 hover 均经 `paintEditButton` → `drawIconGlyph`（painter.js:994-1016 门控仅查 `column.editButton?.icon`，无 editable 门槛），点击走同一 `@edit-button-click` 监听。夹具改动一处一行 |

## 偏离

无。两个失败项均按派发修复方向落地（失败项 1 取「compile(column, true) 产物」路线、失败项 2 取「按布局公式修正期望值」路线），实现源码未动。

## 自检

- `node --check demo/src/data/table-ex/self-checks/cell-painters.js` → OK。
- `demo/src/data/table-ex/main-view.vue` `<script setup>` 提取后 `node --check` → OK。
- 断言依赖夹具核对：`iconProbeSvg`（svg）/ `demoGlyphA`/`demoGlyphB`（cls）经 self-checks 文件头部 `install(...)` 注册（`self-checks/cell-painters.js:304-307`），compile(el, true) 断言所需注册项就绪。
- self-checks 面板重跑与 demo 页验证属 verifier 职责，本轮未运行（3000 端口 rollup watch 服务已在运行，夹具改动增量构建后浏览器可见）。

## 遗留

- 失败项 2 所在块内位于 x 序断言之后的既有断言（宽度 `[50,20,34]`、省略只作用 caption、右缘终止、哨兵两态、未注册降级、tooltip 溢出矩阵）终验时因 x 序断言先抛出未执行，修复后需重跑整块确认（验证报告「补充说明」已注明）。
- UNVERIFIED 2（install 解析 pending → 两跳重试 → failed 链路，设计已声明不入同步断言）与「需人工检查」三项（真实字体时序、观感项、权衡认可）不在本轮修复范围。
- 文档同步四处仍按设计「实施阶段经用户确认后更新」，不在本轮范围。
