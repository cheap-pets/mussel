# 实施记录

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/canvas-table/painter.js` | 步骤 2（问题 1/2/3） | P1：`paintHeaderCells`/`paintHeaderColLines` 重构，滚动列表头文字与分隔线在 `[fixedWidth, W)` clip 内绘制（paintHeader/paintHeaderPass 两入口共活）；P2：`drawHeaderCell` check 表头内容组（✓ + 可选 caption）按列 align 整体分布（对齐 DOM th text-align 语义）；P3：`paintHoverEditorStroke` 改用 `editorRectOf`（格线内缘等距） |
| `src/components/canvas-table/editor.js` | 步骤 2（问题 3） | 新增导出 `editorRectOf(rect, { topGridline, rightGridline })`：四周内缩 EDITOR_GAP，上/右格线占用本格矩形的 1px 从 top/height、width 扣除；`computeEditorStyle` 增加 `gridlines` 入参并消费同一函数（浮层盒缘与描边外缘逐边相等） |
| `src/components/canvas-table/cell-painters.js` | 步骤 2（问题 4） | 新增 `multilineBlockTop`：`drawTextValue` wrap 路径、`drawArrayLines`、`drawLinkItems` 三处多行块改为整体垂直居中（n=1 时首行锚 = 单行省略路径 h/2 锚）；`drawArrayLines` 调用补传 measure（走缓存） |
| `src/components/canvas-table/interactions.js` | 步骤 2（问题 5） | `hitTest` 新增 `beyondCols` 输出：表体行有效 + colIndex −1 + x ≥ 内容右缘（colLefts 末列右缘 − scrollLeft） |
| `src/components/canvas-table/canvas-table.vue` | 步骤 2（问题 3/5） | `hoverCellOf` 放行空白区命中（col 保持 −1，行带高亮生效、列高亮/编辑描边/树箭头按 col 无效跳过）；`onClick` 空白区分支 `selectRowOnly`（仅发选中事件序，不发 cell-click）；`bandRegionsOf` 过滤负列号；`computeEditorStyle` 调用传 `gridlines: props.gridlines` |
| `src/components/canvas-table/use-column-resize.js` | 步骤 3（问题 6） | 删除未使用的 props 解构（lint） |
| `src/components/canvas-table/row-geometry.js` | 步骤 3（问题 6） | eslint --fix（prefer-const，无行为变化） |
| `demo/src/data/canvas-table/self-checks/painter.js` | 步骤 4 | 新增 3 条断言：R1 固定表头无残影、R2 check 表头 ✓ 中心 = 格几何中心（±0.5px）、R4a/R4b 单行锚与块居中对齐（±1px/±2px）；新增 `darkBoundsOf` 工具；清理未用 import/函数 |
| `demo/src/data/canvas-table/self-checks/editor.js` | 步骤 4 | 既有 computeEditorStyle 期望值按 R3 口径同步更新；新增 1 条 `editorRectOf` 四边等距断言（含 gridlines none 分支） |
| `demo/src/data/canvas-table/self-checks/interactions.js` | 步骤 4 | 新增 1 条 R5 断言：beyondCols 放行/列区/表头/行越界/右缘边界/scrollLeft 六态 |
| `demo/src/data/canvas-table/self-checks/cell-painters.js` | 步骤 4 | 三处多行 y 期望由顶对齐改为块居中口径（60→[21,39]、80→[22,40,58]、60→[21,39]）；lint 修复 |
| `demo/src/data/canvas-table/self-checks/{layout,row-geometry,tree}.js` | 步骤 3（问题 6） | eslint --fix 与未用常量清理（无断言增删） |
| `demo/src/data/canvas-table/main-view.vue` | 步骤 3（问题 6） | eslint --fix 模板格式（无逻辑变化） |

新增 self-checks 断言数：5（painter +3 / interactions +1 / editor +1）。

## 偏离

无设计外改动。以下为测试计划预留的口径修正与实施说明（设计文档「修复若改变既有断言的像素口径，允许同步修正夹具」）：

1. **既有断言像素口径同步修正**（R3/R4b 修复直接改变几何）：
   - `self-checks/editor.js` computeEditorStyle 系列期望值：`[4,68,92,28]`→`[4,69,91,27]`（固定列，上/右格线各扣 1px）、变高行 `[76,92]`→`[77,91]`、fallback width `192`→`191`、noFixed top +1；滚动列 `[54,40,72,28]` 不变（首行 + 末列恰好无扣除）。
   - `self-checks/cell-painters.js` 三处多行 y 期望（见上表）。link 竖排 4 行 height 88 夹具恰好 (88−72)/2 = 8 = padding，期望不变。
2. **R4a 检查结论（未改单行路径）**：单行省略路径绘制锚 = `rect.y + height/2`（格几何矩形中心），实测无 1px 格线污染；格线在本格内 1px 侵入仅造成 0.5px 级「可视区中心」偏差，属亚像素级，且保持整数锚可避免 dpr=1 下半像素抗锯齿模糊，故未按可视区中心 (+0.5px) 调整。R4a 断言以 ±2px 容字体 middle 基线与墨迹中心的固有差验证锚点。
3. **断言基线数说明**：00-task.md 记基线 144 条；实测当前工作区（HEAD + 第一步脏文件）页面运行 142 条（module 138 + data 4），逐文件核对既有断言无删除（各文件 checks 数只增不减）。本轮 +5 → 新基线 **147**，全数通过。
4. **demo watch 产物刷新**：watch 进程（vite build --watch，PID 13524，含 3000 服务）对源码改动无响应（touch 后 90s 无重编译，dist 停留于任务开始前时间戳）。为完成浏览器自检执行了一次性 `npx vite build --config vite.demo.config.js` 刷新 `demo/dist`——未启停、未占用 3000 服务，watch 进程未动。
5. **P5 点击语义**：空白区点击仅发 `update:selected-record-key` + `update:selected-record`（与 resolveCellClick 事件序一致），不发 cell-click（该区域无对应列）；check/树槽/编辑器不适用。此为实施者裁量，非设计明文。

## 自检

| 项 | 命令/手段 | 结果 |
|---|---|---|
| R6 lint | `npx eslint src/components/canvas-table/ demo/src/data/canvas-table/` | 0 error / 0 warning（基线 39 error / 19 warning） |
| 构建 | `npm run build` | ✓ built in 495ms |
| demo 产物 | `npx vite build --config vite.demo.config.js` | ✓（watch 僵死后的替代刷新，见偏离 4） |
| R0 回归 | demo 自检面板 | **147/147 通过**（0 fail） |
| R1 | 自检断言 + 端到端像素 | fixed 场景 scrollLeft=80：固定表头区 [140,228)×[4,32) 无文字像素（修复前有滚动列 `名称` 文字 [154,182)）；固定列自身表头 `ID`/`固定链接` 正常 |
| R2 | 端到端像素 | 默认场景 check 表头 checkbox 像素盒中心 (24,18) == 表头格几何中心 (24,18)，偏移 (0,0)（修复前 dx=−8） |
| R3 | 端到端像素 | 行 2 状态格 hover 描边像素 113/139/268/358 → 四边距最近格线空白均 4px（修复前 上 3/右 3/下 4/左 4）；编辑浮层 computed [268px,113px,91px,27px] 与描边盒逐边一致 |
| R4a/R4b | 端到端像素 | multiline 场景行 1（h=52）三列（单行省略 / wrap 单行内容 / 数组单元素）文字墨迹均为 [251,263)、centerY=257 全等（修复前 wrap/数组 248 vs 单行 257，差 9px） |
| R5 | 端到端交互 | narrow 场景（Σ=576 < 960）：空白区 (700,54) hover 像素 255→242 与列区内 (300,54) 同色；点击发 update:selected-record-key=1 + update:selected-record（无 cell-click）；选中行 selectBg(225,236,243) 覆盖空白区与列区一致；普通格点击链（key → record → cell-click）回归正常 |
| console | 页面错误检查 | 1 error = demo 夹具既有非法 img src（`data:image/png;base64,AAAA1:0`），任务前已存在，与本改动无关 |

## 遗留

- **demo watch 进程僵死**（对源码改动无重编译响应，3000 服务本身正常）：建议用户择机重启该 watch 进程；本轮以一次性 build 刷新产物，若 watch 复活重编译产物同源无冲突。
- R4a 的 0.5px 级「可视区中心」口径未采纳（理由见偏离 2），如需亚像素精确居中可后续再议。
- 问题 2 修复覆盖「check 表头有 caption」场景：内容组（✓ + caption）按 align 整体分布，DOM 参照为 th text-align 对 inline 内容的居中；无对应 DOM 逐像素对照（DOM 版同场景无 canvas 对照夹具）。
