# table-ex 现状导航（02-map.md）

> 基准：工作区（HEAD `ee16eb4` + 结构重构批次 B1–B6 改动未提交，2026-11-07 终验 PASS；批次定义与验证记录见同目录 02-design.md、verify-*.md）。
> 性质：code-reforge 步骤 6 收尾产物（现状导航）。重构前测绘底图（依赖边全量、S8 扫描、痛点入围指标）已完成使命；长期结构数据以 `agent-docs/knowledge/project/table-ex-structure-map.md`（与本文件同基准同步）为准。
> 本轮结构变化：B1 删 painter 转口（cellRectAt 直引 paint-utils）；B2 controller 参数 `ctx`→`deps`；B3 @host 注解补全 + 交付两门禁脚本；B4 interactions.js（407 行）按域拆为 hit-test / click-resolve / resize-resolve；B5 描边链提取 cellFrameOf/strokeBodyFrame；B6 锚定收敛 syncAnchoredLayout / recordNumberOf。

## 1. 模块与目录一览（一句话职责 + 行数，2026-11-07 实测）

| 模块/文件 | 行数 | 职责 |
|---|---|---|
| **table-ex.vue** | 474 | L0 壳：props/emits/模板/host 袋构建（L227 起）/12 步组装（L286-452）/defineExpose |
| index.js | 2 | 包公共入口（`export { default, MuTableEx }`，S1 生态豁免项） |
| table-ex.scss | 186 | 组件样式（BEM，--mu-* 变量） |
| **composables/**（10） | | L1 功能纵切编排：注册全部 watch 与生命周期；横向互调全经 host 袋（@host-* 注解，见 §3） |
| use-cell-click.js | 395 | click 单一入口编排：表头/树槽/条目/check/选中/开编辑分支派发 |
| use-cell-select.js | 223 | 单元格选中编排：selectedCell 置清、键盘/剪贴板通道 |
| use-cell-tooltip.js | 198 | tooltip 壳级编排：定时器/去重键/合成锚点 |
| use-column-resize.js | 131 | 列宽拖拽：widthOverrides/clickGuard/startResize |
| use-paint-state.js | 125 | paintState（30 字段）组装与手动同步 + redraw/invalidate 入口 |
| use-pointer.js | 283 | 指针交互编排：hover/hoverItem/cursor/hitAt |
| use-relayout.js | 240 | 布局重算/滚动/尺寸响应 + relayout 源合一 watch |
| use-table-api.js | 155 | 对外 API：scrollToRecord/getLayoutInfo/getCellRect 等 |
| use-table-instances.js | 96 | 实例生命周期：painter/measure/wrapCache/themeWatcher 创建清理 + onThemeChange |
| use-tree-rows.js | 248 | 树接线：展开集/平铺链/wiredColumns/toggle 操作/三条树 watch |
| **interaction/**（6） | | L3 指针交互决策纯函数（无 DOM、无事件绑定），B4 起按域拆分 |
| hit-test.js | 184 | 命中域：hitTest 命中检测 / resolveCursor 光标 / resolvePointerdown 按下 / resolveTooltipTarget 门控 / isTreeArrowSlot 树槽 |
| click-resolve.js | 218 | click 域：resolveOrderByNext/isCheckHeaderColumn/resolveHeaderClick/resolveCellClick/resolveTreeToggle/resolveItemClick/resolveCellClickOpen 七分支 |
| resize-resolve.js | 18 | 调宽域：resolveResizeWidth clamp + RESIZE_MIN_WIDTH 下限 |
| edit-button.js | 31 | 编辑按钮命中判定（isEditButtonHit） |
| cell-selection.js | 125 | 单元格选中纯函数：复制文本/移动/滚动量 |
| schedulers.js | 67 | 无 DOM 工厂：clickGuard 防抖门 + rAF 合帧调度器 |
| **table-paint/**（6） | | 绘制管线（painter 有状态，其余纯函数） |
| painter.js | 415 | L2 绘制管线：分区顺序 + 5 形状脏区调度 + createPainter rAF 状态机；B1 后无转口，导出 = draw/drawRegion/createPainter |
| paint-body.js | 343 | 分区 1 单元格区 + 分区 3 固定列 + spanKeepRows 帧机制 |
| paint-gridlines.js | 158 | 分区 2 网格线（分段跳线） |
| paint-header.js | 295 | 分区 4 表头（check/文本/排序图标/列线） |
| paint-overlay.js | 254 | 分区 5 覆盖层（hover/选中描边/树箭头/编辑按钮/参考线）；B5 后描边几何/描边块单一事实源 = cellFrameOf（L99）+ strokeBodyFrame（L123） |
| paint-utils.js | 126 | 绘制层叶子工具：几何换算（viewportColX/cellRectAt/contentRightXOf 等）+ 背景色/裁剪；cellRectAt 唯一事实源（B1 起消费方直引） |
| **cell-paint/**（8） | | 单元格级取值与绘制 |
| cell-painters.js | 287 | 绘制适配器：列类型 render 产物 → canvas（drawCell 单入口分发，无 re-export） |
| cell-content.js | 154 | 单元格取值：prepareColumn/resolveCellContent/capMaxLinesOf |
| cell-text.js | 267 | 文本绘制原语：实测光学居中锚（模块级双缓存）/drawTextValue |
| cell-tooltip.js | 235 | tooltip 内容布局纯函数（resolveCellTooltip） |
| icon-image.js | 101 | 图片/图标加载与绘制（模块级 imageCache 上限 200） |
| item-painters.js | 412 | 横排条目绘制与命中矩形（check/tag/img/icon/link/text + 色板） |
| link-items.js | 107 | link 竖排条目绘制（两遍式平移对齐） |
| canvas-kind-painters.js | 305 | canvas 专属条目绘制：progress/button（pill+link） |
| **editing/**（3） | | 编辑三分：状态机 / 几何 / 规整互不中转 |
| editor.js | 285 | L2 编辑状态机：open/commit/cancel + blur 兜底 |
| editor-geometry.js | 114 | 编辑盒几何纯函数：editorRectOf/editorGridlineFlagsOf/editButtonRectOf/computeEditorStyle；paint/interaction 层直引本文件，不经 editor.js |
| editor-resolve.js | 169 | 编辑器类型/props/开值/提交值规整 + EDITOR_COMPONENTS 表单映射 |
| **geometry/**（4） | | 布局与行几何 |
| layout.js | 341 | 列宽求解/前缀和/可视窗口/命中定位/relayout 快照（22 字段） |
| row-geometry.js | 453 | 行几何双模式工厂（uniform/variable+Fenwick）+ 行高估高/精算算法（computeRowHeights/ensureRowMeasured） |
| row-geometry-controller.js | 452 | L2 行几何控制器：模式升级/扫描签名/精算缓存/进窗精算/锚定补偿；参数为 `deps`（14 getter，B2）；锚定补偿单一事实源 syncAnchoredLayout（L225，B6） |
| fenwick.js | 57 | Fenwick 树（前缀和/偏移定位） |
| **spans/**（3） | | 合并单元格索引（查询面/构建面分居） |
| spans.js | 229 | 查询面：buildSpans 入口 + regionAt/spanRectOf/resolveSpanCell 等 9 查询 |
| spans-method.js | 294 | spanMethod 构建面（registerRegion/applySpanMethod） |
| spans-auto.js | 189 | autoRowSpan 构建面（applyAutoRowSpan 分段扫描） |
| **shared/**（5） | | L4 共享原语（除 text-wrap→constants 外零内部依赖） |
| text-wrap.js | 313 | 文本折行/省略/估行 + wrapCache LRU |
| theme.js | 335 | 主题探针/快照（21+17 色）/测量缓存/主题 watcher |
| tree.js | 254 | 树平铺纯函数：childrenIndex/flatRows/toggleKey |
| constants.js | 63 | 绘制常量表（14 导出） |
| cell-identity.js | 16 | 格身份与行序号单一事实源（isSamePoint/recordNumberOf） |

横切枢纽（被多文件消费的查询面）：`spans.js`、`paint-utils.js`、`cell-identity.js`、`constants.js`、`text-wrap.js`。

## 2. 主流程阅读顺序

总纲（自顶向下）：**table-ex.vue**（壳：L70-97 import 全景 → L227-284 host 袋 → L286-452 12 步组装时序，步骤顺序敏感）→ **composables/**（事件编排入口，每个 composable 一个功能纵切）→ **interaction/**（决策纯函数）→ **geometry/**（layout 行列窗口 + row-geometry 行高双模式 + controller 缓存调度）→ **table-paint/painter.js** → 各 paint-* → **cell-paint/**；**spans/、editing/、shared/** 按需查阅。

关键运行链（行号 = 当前工作区实测）：

```
绘制链  use-paint-state.redraw L98 → syncPaintState L59（30 字段 host→paintState）
        → painter.draw L243 → paint L223（分区 ①paintCellRange ②paintGridlines
        ③paintFixedArea ④paintHeader ⑤paintOverlay）→ cell-painters.drawCell
        → cell-content.resolveCellContent → col._render（column-types compile 产物）
        overlay 描边 = cellFrameOf L99 + strokeBodyFrame L123（B5 单一事实源）

指针链  use-pointer.onPointerMove L228 → hitAt L35 → hit-test.hitTest L53
        （合并格归一 spans.resolveSpanCell 于壳出口）→ resolveCursor L129 /
        resolveTooltipTarget L178 →（80ms）cell-tooltip.resolveCellTooltip
        pointerdown → resolvePointerdown L147 → editor.commit | startResize

click链 use-cell-click.onClick L161（分支序固定：表头 resolveHeaderClick
        [click-resolve L56] → 树槽 resolveTreeToggle L142 → 编辑按钮
        isEditButtonHit → 条目 resolveItemClick L193 → check/选中
        resolveCellClick L96 → 开编辑 resolveCellClickOpen L212 + openEditorAt L276）

relayout use-relayout.onScroll L150 → rowGeometry.remeasureVisibleRows L372
        （精算缓存 + 锚定补偿 syncAnchoredLayout L225）→ recomputeViewWindows → redraw
        relayoutAndRedraw L58 → layout.relayout L296（11 字段袋，产 22 字段快照）
        → resolveForRelayout L307 → syncCanvasSize → remeasure → redraw

编辑链  openEditorAt L276 → editor-geometry.computeEditorStyle L67（17 字段袋）
        → editor.open L161 → applyCommit L208：editor-resolve.normalizeCommitValue L122
        → column.editor.validate → onCommit → emit update:cell-value

树链    resolveTreeToggle L142 [click-resolve] → use-tree-rows.applyTreeToggle L141
        → shared/tree.toggleKey L247 → host.relayout() → 锚定补偿回写 scrollTop → redraw
```

## 3. 注解与门禁约定

- **@host-reads / @host-writes / @host-calls**：composables 文件头单行前缀注解，声明该 composable 对 host 袋的消费面（10 个 composables 全覆盖；壳 table-ex.vue 是 host 提供方，不注解）。新增/变更 host 键消费时同步注解，并跑审计验证。
- **`node scripts/table-ex-structure-check.mjs`**（S1 门禁）：扫描 `src/components/table/ex/**` 全部 .js 的纯转发 re-export（豁免公共入口 index.js），命中输出清单并退出码 1——ex/ 内新增聚合文件禁止转口。
- **`node scripts/table-ex-host-audit.mjs`**（@host 审计）：比对 composables 文件头 @host-* 声明与正文 `host.<键>` 实际使用，未声明键缺失退出码 1。
- ex/ 文件移动/删除须同步 `demo/src/data/table-ex/self-checks/` 的 import（INDEX-table：canvas-pixel-assert-anchor-drift；自检断言只读冻结）。

## 4. 未收敛项与已知缺陷（agent 分析时注意）

- 参数形态 S8 未开专项（design 不做清单 N2）：>5 位置参函数约 21 个（drawButtonPill 13、drawButtonLink 12、drawCellClipped 12 等），触碰调用点时顺带收敛；清单见 02-problems.md。
- 四文件保留 400-600 行（N3）：table-ex.vue 474 / row-geometry-controller 452 / painter 415 / item-painters 412；row-geometry.js 拆分不做（N1）。
- 锚定补偿跨文件三变体不合并（N6，锚定策略各异非同源）：use-tree-rows.js:141 / use-table-instances.js:36 / row-geometry-controller.js:225（syncAnchoredLayout）。
- 已知缺陷：fenwick.rebuild 换 tree 不复算 power，行数跨 2 幂边界后 findRowAtOffset 步长失配（fenwick.js:53-55，未修复）。
- 陈旧注释：use-pointer.js 文件头第一段仍写"决策纯函数来自 interactions.js"——该文件已于 B4 删除，实际来自 hit-test/click-resolve（本次收尾核对发现，未修复，待后续清理）。
