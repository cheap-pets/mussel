# 实施记录 — G2-a（painter.js 绘制管线 + painter 自检断言）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/canvas-table/painter.js` | G2-a | 绘制管线：`draw(ctx, state)` 整幅入口（设计 `draw(state)` 的 ctx 前置纯函数形式，返回 lastPaint 统计）+ `drawRegion(ctx, state, region)` 脏区入口 + `cellRectAt(layout, row, col)` + `createPainter({ canvas })` 有状态封装。分区顺序严格按 A2：表体滚动区（逐格背景→内容，选中/斑马纹画行背景时直接取值）→ 网格线（gridlines 四模式，末列无线、首行顶线由表头底边框承担）→ 固定左列区（整高不透明重绘 + x-scrolled 强化色分界线，不受 gridlines 约束，对齐 `.mu-table--x-scrolled .last-fixed-col`）→ 表头区（bgFill 底/caption 按 `_align` 锚点/排序图标 asc·desc 主色三角复刻 sort-icon.vue/check 表头 ✓〔table.vue:22 同款条件〕/列分隔线/底边框 soft）→ 覆盖层（hover 五模式 + 调宽参考线 1px 主色）。脏区 clip 调度：`{rows}/{cols}/{cell}/{header}/{colFrom}` 五种 region 各自 save/clip/restore 后走同一分区管线，clip 内先 destination-out 擦除为透明（半透明行底色/覆盖层混色起点与整幅一致）；完全可见格跳过 save/clip/restore（A3 kaka P0），视口边缘部分可见格才 clip。`ctx.setTransform(dpr,0,0,dpr,0,0)` 每次绘制直乘。`lastPaint = { rowStart, rowEnd, rowCount, colStart, colEnd, elapsed }` 每次绘制结束按实际绘制范围写入。`createPainter` 承接 G1-c 遗留 2：`onImageLoad → invalidateCell(row, col)` 自动接管、重绘前 `isRegionPaintable` 校验行仍在窗口/格在可视列空间（滚出即跳过）；invalidate rAF 合帧（同帧多区域合并为整幅）、支持 `{ immediate, state }`（immediate 同步、state 更新基线）、draw 重置挂起队列、dispose 全量清理 |
| `demo/src/data/canvas-table/self-checks/painter.js` | G2-a | G0 占位填充为 11 条断言（见下「判据对照」），全部同步执行、在位 canvas（挂入文档、断言后移除）+ 固定 rgba 主题夹具 + relayout 真实布局求解，像素采样/区域比对/lastPaint 结构断言 |

### G2-a 判据对照（02-design.md 实施步骤）

| 判据条目 | 断言 |
|---------|------|
| 在位 canvas 渲染出完整表格 | 「整幅绘制」表头底色/底边框/caption 文字/单元格文字/行线/列线/末列无框 7 项像素证据；「固定列」滚动后固定区逐像素一致 + 强化分界线；「覆盖层」行/列 hover 混色 + 模式开关 + 参考线；「表头细节」asc/desc 三角方向主色 + check 表头 ✓ 受控绘制；「行底色优先级」选中>斑马>普通三态（含固定列） |
| lastPaint 统计字段有值且 rowCount 与窗口一致 | 「整幅绘制」「虚拟滚动」两断言：六字段齐全、`rowStart/rowEnd/rowCount/colStart/colEnd` 与 `relayout().viewRows/viewCols` 逐字段一致、elapsed 非负数；scrollTop=18（跨行，rowCount=9 = ceil(viewH/rowH)+OVERSCAN+1 上界口径）与 scrollTop=360（对齐，行 10 起 8 行）两种位形均一致，且 rowCount « 全量 50 行（仅可视区证据）；createPainter 断言补六字段存在性 |

### 与依赖模块的契约落实

- **theme（G1-a 补修版）**：颜色快照串可能为 `color(srgb)` 形态——painter 直接透传 canvas fillStyle（canvas 原生接受），不依赖 parseColor/withAlpha；文本测量缓存消费 `createMeasureCache`（模块级共享，主线程同步绘制）。
- **layout（G1-b）**：宽高取 `layout.stickyWidth/Height`，行/列定位经 `colLefts/rowHeight/headHeight/scrollTop/scrollLeft`，窗口以 `viewRows/viewCols`（start/end 排他）为准；`cellRectAt` 供 interactions/editor/自检共用。
- **cell-painters（G1-c）**：`drawCell(ctx, { col, record, recordNumber, emit, rect, theme, onImageLoad })` 逐格调用法；`onImageLoad` 以 `(row, col)` 闭包注入并在 createPainter 内接管为 invalidateCell。
- **decisions「[I1 前]④」**：窗口口径全链使用 layout 的 viewH/viewW 派生结果，lastPaint 与 viewRows 同源，S3 可直接对照。

## 偏离

无设计偏离。以下为设计未定项的实现形状选择（记录供 S1/S3 知悉）：

1. **`draw(state)` 落地为 `draw(ctx, state)` 纯函数 + `createPainter` 工厂**：设计 A8 给出模块职责但未定导出形状；img onload 联动与 rAF 合帧需要持有最近 state（同 G1-a `createThemeWatcher` 先例）。组件壳（S1）经 `createPainter({ canvas })` 一次接线，`draw/invalidate/invalidateRow/invalidateCell/lastPaint/dispose` 全部经工厂暴露。
2. **脏区先擦除再绘制**：行底色 `--mu-primary-faint`、覆盖层 `--mu-gray-translucent` 为半透明变量，横带重绘若直接叠画会在旧帧上重复混色；clip 内 `destination-out` 擦除为透明后走同一管线，保证任意路径绘制像素一致。设计未规定擦除方式，属实现正确性措施。
3. **固定区半透明底色像素为混合值**：分区 3 按设计「整高不透明重绘」（先铺不透明 bgNormal），固定列选中格像素 = selectBg 混合 bgNormal，与滚动区（透明底直绘原色）在白底页面视觉一致；自检按各自口径断言（真实变量同为半透明时行为一致）。
4. **lastPaint 区域语义**：整幅 = 窗口口径；region 绘制按实际绘制范围（行横带 = 该带行区间 + 全窗口列；表头 = rows 0/cols 窗口；单格 = 1×1；调宽竖带 = 自 colFrom 至窗口末列）。G0 调试面板轮询 lastPaint 变化计重绘次数，横带重绘可被感知（A3「hover 变化时仅脏带重绘」的 demo 证据通道）。
5. **表头 caption 对齐**：按列 `_align` 锚点绘制（对齐 DOM th 的 align class），check 表头存在时按 DOM inline 流转为左锚（方框后接文本）。
6. **自检期望修正 2 处**（首轮浏览器实测 75/77 后）：①固定列采样点 (30,126) 落在 rec_no 居中数字字形反走样像素上 → 移至 (50,126) 并按固定区混合值口径断言；②`dispose()` 未清空 `last` 与注释「dispose 清理」不符 → painter.js dispose 补 `last = null`。均为本白名单内文件的修正，非设计偏离。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| 语法 | `node --check` 两文件 | 通过 |
| 编译校验 | `npx vite build --config vite.demo.config.js`（一次性，按派发约定） | 通过：built in 575ms；`demo/dist/data/canvas-table/main.js` 217.30 kB（含 painter 模块与断言），无报错 |
| 页面可达 | `curl http://localhost:3000/data/canvas-table/` | 200（期间发现 ：3000 未监听——此前 watch 进程已退出，已重新后台启动 `npm run demo:build`（任务 `exec_ce4be5a2-5a3f-4025-b898-fa4f95feafc5`，结束时保持运行）；与一次性构建并存正常） |
| demo 自检区浏览器实测 | playwright 访问页面，读自检面板 DOM（`li.ct-check-item--fail` 精确提取失败条目） | **painter 模块 11/11 全部通过**；整页 **77/77 通过、失败 0**；console 0 errors（18 条 warning 均为 Chrome 对自检高频 getImageData 的 willReadFrequently 性能提示，断言画布读回所致，生产绘制路径无 readback，不处理） |
| stylelint | — | 不适用：本步骤无 `.scss` 改动 |
| eslint | — | 项目未安装 eslint（G1-b/G1-c 同结论）；以 node --check + 构建 + 浏览器执行代替 |
| `npm run build` | — | 未执行：全局库构建属 S2 集成步骤（并行组规则：不跑影响全局的命令） |

## 遗留

1. **img onload → invalidateCell 端到端联动（rAF 异步路径）留 S3**：runChecks 仅支持同步断言，自检已覆盖窗口校验的同步返回值（窗口外 false、窗口内 true）；真实 img 加载完成 → 联动重绘的像素证据按 G1-c 预留归 S3 验证。
2. **rAF flush 合帧行为留 S3**：同帧多 region 合并为整幅的逻辑已实现，浏览器内异步观察（invalidate 后等一帧断言重绘）不属同步自检能力。
3. **S1 对接契约（本步骤定义，S1 实施者需知）**：
   - `createPainter({ canvas })` 创建，`onUnmounted` 调 `dispose()`；
   - 组件以持久 state 对象传入 `draw(state)`（字段契约见 painter.js 模块头注释：dpr/layout/theme/records/columns/recordsOffset/emit/keyField/getRecordKey/selectedKey/headerChecked/gridlines/hoverMode/striped/orderBy/hover/resizeGuideX）；hover/选中/`resizeGuideX` 等 state 变更后原地改该对象再调 `invalidate(region)` 即以新状态重绘，或 `invalidate(region, { state })` 传新对象；
   - 各触发点 → region 映射（A3 重绘表）：hover/选中变化 → `{rows:[旧,新]}` 或 `{cols}`（组件侧两次 invalidate）、编辑提交/check 点击 → `invalidateRow(row)`（nextTick）、headerChecked → `{header:true}`、调宽 move → `{colFrom}`、滚动 → `draw(state)` 整幅（rAF 合帧由组件滚动路径承担）；
   - `getLayoutInfo().lastPaint` 直接取 `painter.lastPaint`（G0 调试面板轮询通道即自动生效）；
   - canvas 物理尺寸（`canvas.width = round(cssW*dpr)`）与 style 尺寸同步仍归组件壳 relayout 路径（A2），painter 只做 setTransform。
4. **固定列选中底色像素口径**（偏离 3）：如后续需要固定区与滚动区像素严格同值（非白底页面场景），需将分区 3 的不透明底铺改为与滚动区一致的透明起点——属视觉等价性优化，当前白底场景无差异，未做。
5. 一次性构建与 watch 并存按派发执行；本步骤开始时发现 watch 服务已退出（非本步骤改动所致），已重新启动，最终实测基于重启后的 watch 服务 + 最新一次性构建产物。
