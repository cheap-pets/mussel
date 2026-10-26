# canvas-table 优化方案评估与补充

> 评估对象：`agent-docs/plans/canvas-table-optimization/canvas-table-optimization.md`
> 评估基准：`src/components/canvas-table/` 当前工作区代码（11 文件 6585 行）
> 方法：全量源码复核 + demo `http://localhost:3000/data/canvas-table/` 前台实测
> （Playwright，`lastPaint.elapsed` / `PerformanceObserver('longtask')` /
> 原型劫持 `measureText`、`setTransform` 计数）。本文不改代码。

## 结论

方案主体正确，P0/P1/P2 的**技术判断**都成立（事实核对无误，除个别数量级偏乐观）。
但**优先级排序有一处明显错位**：方案把「relayout 全量估高扫描」定为 P2，实测它是
当前组件唯一的百毫秒级阻塞点（100k 行 variable 模式每次 relayout 120ms），且触发面
比方案描述广得多——容器 resize、fixedLeftColumns、placeholder、refreshTheme、
拖拽 up、树 toggle 全部命中。应按 P0 处理，并新增一个「扫描输入签名拆分」的改法
（方案只给了「分片异步」这一条更重的路）。

另外三项方案未覆盖的实测问题：

1. hover 每次变化绘制 **2 次**（prev/next 脏区在同行内完全重合，未去重）；
2. `preparedColumns` 把 placeholder 算进列准备依赖，切换占位文本即触发全量重扫；
3. `lastPaint.elapsed` **看不到 relayout 阶段耗时**，方案给的验证手段会漏掉最大瓶颈。

## 实测基线

环境：本机 Chrome（Playwright headless 前台页），demo 舞台默认 960×420（可视 13 行），
拖大后 32 行；数据 100k 行。

| 场景 | 滚动帧 `lastPaint` 中位数 | 备注 |
|---|---|---|
| 默认（uniform，13 行 × 9 列） | 0.6–0.9ms（max 1.5ms） | 帧间隔中位数 13.3ms（75Hz 封顶），绘制非瓶颈 |
| 窄列（uniform，27 行 × 3 列） | 0.43ms | |
| 多行文本（variable，3 行） | 0.8ms | |
| 条目/新列型（variable，4 行） | 0.5ms | |
| 长 CJK 文本注入（150 字符 × 2 列，uniform，15 行） | **9.1ms**，测 13140 次 `measureText`/帧 | 帧预算一半以上，P0-1 的唯一真实场景 |
| 短文本同场景（12 字符） | 0.6ms，720 次/帧 | 说明 P0-1 收益强依赖文本长度 |

| 触发动作（100k 行） | uniform | variable |
|---|---|---|
| 容器 resize（throttle 100ms 一拍） | 1–2ms | **116–124ms long task × N** |
| `fixedLeftColumns` 变更 | 1–2ms | **114–262ms** |
| `refreshTheme()` | 1–1.9ms | **115–120ms** |
| `records` 引用替换 | 91ms | 93ms（此项必要） |
| 拖满一次窗口（8 拍 resize） | 无 long task | 8 × ~120ms，累计 961ms |

| hover 单次移动（row 模式，32 行视口） | 耗时 | `measureText` 次数 |
|---|---|---|
| fixed=0 | 0.135ms | 20 |
| fixed=4 | 0.463ms | 178（8.9×） |
| fixed=8 | 0.673ms | 389（19×） |

`measureText` 微基准（14px，100/150 字符 CJK，maxWidth 144）：

| 实现 | 调用次数 | 单次耗时 |
|---|---|---|
| 线性回退（现状） | 143 | 198µs |
| 二分收缩 | 8 | 6.7µs（29×） |
| 二分 + 结果缓存命中 | 0 | 0.77µs（258×） |

## 逐条核验

### P0-1 ellipsize 线性回退 + 绕过测量缓存 —— 成立，需补三处

事实核对全部正确：`cell-painters.js:350-358` 线性回退；`drawItemText:650`、
`drawLinkEntry:741`、`drawTag:709`、`measureItem:620`、`drawArrayLines:425` 直连
`ctx.measureText`；`painter.js:114` 的表头路径走 `measureCached`。二分收缩在
「前缀宽度单调」下与线性结果完全等价（实测 8 次调用，方案估 7 次，一致）。

方案遗漏 / 需修正：

- **`drawButton`（L880/887）与 `drawProgress`（L825）也是未缓存 `measureText`**，
  方案只列了 4 个调用点。button 组的 `ellipsize` + 再一次 `measureText` 是双倍成本。
- **`ellipsize` 应返回宽度**，而不是只返回字符串：`drawLinkEntry`（L750）、
  `drawTag`（L711）、`drawButton`（L887）在截断后又 `measureText(display)` 一次。
  二分最后一次成功测量即为该宽度，可一并消除。
- **font 必须显式传入**：现状 `ellipsize` 依赖调用方已设 `ctx.font`。接入
  `state.measure(text, font)` 时必须把 `cellFontOf(theme)` / `tagFontOf(theme)`
  作为参数传入，否则缓存 key 与绘制字体不一致，截断宽度和实际绘制错位。
- **保留空串语义**：线性路径「一个字符都放不下 → `''`」，二分 `lo=0` 必须同样返回
  `''`，否则 `drawTextValue:401` 的 `if (!single) return` 失效。
- 风险补充：注入的 `state.measure` 走离屏 canvas，绘制走显示 canvas；两者在同
  font 串下宽度一致，但若将来给 ctx 设 `letterSpacing` 会不一致（当前未设）。

### P0-2 paintFixedArea 固定列全高重绘 —— 成立，量化比方案更细

事实正确：四个脏区入口（L711/L745/L776/L815）都调用无行区间的 `paintFixedArea`
（L401-419），clip 只省像素不省计算。方案「~25×」在有 8 个固定列、32 行视口时
实测 19×（`measureText` 20 → 389 次/次 hover 移动），量级吻合。

需修正的判断：

- **绝对收益是亚毫秒级**（13 行视口 0.06 → 0.375ms；不是帧率级问题）。修复值得做
  是因为成本极低且随「固定列数 × 视口行数」线性放大（大屏、多固定列、长文本组合
  会放大到毫秒级），不要把它写成「帧预算主要消耗点」。
- 实现约束确认：`ctx.fillRect(0, 0, fixedWidth, stickyHeight)` 在 clip 内会被裁到
  行带，因此「只画区间相交行」不破坏擦除语义；`bandToX` 不传的既有语义保持。
- 建议给 `paintFixedArea` 传 `rows` 后，四个入口按各自区间收窄
  （行带传 `{from,to}`、列带/调宽带传 `viewRowsRange`、单格传 `{row,row+1}`）。

### P1-1 drawImage 自拷贝平移 —— 现阶段无证据支持，保留为后备

实测 100k 行四种 demo 场景滚动帧 0.43–1.5ms，距 8ms 阈值 5× 以上；rAF 间隔中位数
13.3ms 说明瓶颈不在绘制侧。方案把启用条件写成「P0 落地后仍 > 8ms」是对的，
**建议把本文的基线数字写进方案**，避免后人误以为已有数据支撑启用。

补充：若将来真启用，方案漏了「横滚时固定列区不动、只有滚动区平移」与「overlay
层 hover 矩形随内容位移天然正确」之外的第三条——**调宽参考线（resizeGuideX）与
编辑浮层不参与 canvas 平移**，浮层是 DOM，平移期间需要额外跟随或临时隐藏。

### P1-2 单元格 render 缓存 —— 方向可行，收益判据要改

实测：一个自定义 `type.render` 列在滚动帧执行 13–14 次（= 可视行数），hover 帧
2 次（prev+next 各一次，见 N1）。即成本 O(可视格) 且每格一次函数调用，绝对耗时
远低于绘制。缓存价值的真实理由是 **每帧重建 items/attrs 的 GC 压力**，不是 CPU 峰值。

方案对 `events` 闭包的风险判断正确（壳传 stable `emit`，缓存后闭包仍指当次 emit）。
补充一个失效维度：`emitCellItemClick` / check 列点击路径也调 `resolveCellContent`
（`canvas-table.vue:903`、`:970`），缓存若只装在 painter 侧会出现「同一格两套结果」，
建议缓存挂在 `resolveCellContent` 入口而非 `drawCell` 内部。

### P2-1 估高全量扫描 —— 严重度评低了，应升 P0（本方案最大偏差）

实测 100k 行 variable 模式：13 列 120ms、3 列 58ms、1 列 40ms（每列每行约 70ns，
单列 400ns/行，主要是 `valueOf` + `columnLineCount` 的函数调用开销）；uniform 模式
同等条件 1–2ms。

**触发面比方案写的大**，根因在 `canvas-table.vue:502-506`：

```js
const wantVariable = rowGeometryMode.value === 'variable' || isVariableCandidate()
const scanDirty = wantVariable || lastScanRecords !== displayRows.value || lastScanColumns !== wiredColumns.value
```

`rowGeometryMode` 只升不降（设计如此），于是**一旦进入 variable，`wantVariable` 恒真、
`scanDirty` 恒真**，每次 `relayoutAndRedraw()` 都跑全量扫描。命中的调用方：
容器 sizechange（窗口/stage resize，100ms 一拍）、`fixedLeftColumns` watch、
`placeholder` 变化（经 preparedColumns）、`columns` 引用变化、`refreshTheme()`、
列宽拖拽 pointerup、树 toggle、records 替换。实测证据即上表 variable 列。

**方案只给了「分片异步」一条路（P2-1 原文），但真正的浪费不是「同步执行」而是
「不该执行」**：估高路径 `precise: false` 时字符串行数恒为 1、数组/条目行数为计数真值、
link 为 render 计数，**与列宽、字号、行高全部无关**。因此：

- 拆分扫描输入签名：估高维度 = `displayRows` 引用 + 列配置中影响计数的字段
  （`maxLines`/`maxItems`/`multiline`/`treeNode`/`type`）；精算维度 =
  `colWidths` + 高度相关主题字段（已有 `measuredHeightsSig`）。
- 仅估高维度变化时重扫；否则沿用现有 `heights`（`variableGeometry` 已有数组），
  只做 `applyMeasuredHeightCache` 混入精算值 + 必要时 `rebuild`。
- 预期：容器 resize / fixedLeftColumns / refreshTheme / 拖拽 up 从 120ms 回到 1–2ms
  量级；records 替换与列定义变化保持全量扫描（这两项本来必要）。
- 分片异步（方案原案）降级为「records 替换仍超预算时」的兜底，不再是首选。

附带发现（同一根因）：`preparedColumns` 依赖 `props.placeholder`（L180-188），
仅切换占位文本就重建全部列对象 → `wiredColumns` 引用变化 → 再吃一次全量扫描
（实测 uniform 100k 12–27ms，variable 会到 120ms）。建议 placeholder 不进列准备
依赖，改由绘制期 `content.text ?? col.placeholder ?? state.placeholder` 兜底。

另需注意：宽度签名变化会整体丢弃 `measuredRowHeights`（`applyMeasuredHeightCache:461-464`），
variable 模式下列宽变化后全部精算行高丢失 → `contentHeight` 回缩、滚动条缩短，
与 #15「单调不回缩」只对签名不变的重建成立。这与上文拆分正交，若要做严格单调，
需要按「宽度变化量」重算而非丢弃；当前评估**不建议在本轮处理**（属行为变更）。

### P2-2 缓存全清策略 —— 数字需订正，优先级维持 P2

方案写「快速长滚时每 ~7 帧全清」。实测 measure cache 与 wrap cache 上限 2000，
100k 行滚动每帧新增约 40–60 条（`measureText` 实测 336 次/帧含重复取样、wrap 新行
约 15–20 条），全清间隔约 **30–50 帧**，不是 7 帧。两段轮换建议本身仍成立，
但「实测尖刺」这条依据目前不充分，维持 P2、profile 后再定。

## 方案遗漏项

### N1 hover 双重重绘（建议随阶段 0 一起改）

`updateHover`（`canvas-table.vue:799-807`）对 `prev` 与 `next` 各调一次
`invalidate(...)`，每次 `immediate: true` 同步重绘。row / cross 模式下同行内横向
移动时两条脏带完全相同。实测：同行内换列 9 次，每次 `setTransform` 调用 **2 次**；
单行横移 12 步共 14 次重绘（去重后应为 7 次）。

修法：先构造脏区数组再按 region 去重（`prev.row === next.row` 合并行带、
`prev.col === next.col` 合并列带），或让 `invalidate` 接受 region 数组并合批。
与 P0-2 叠加时收益最明显（32 行视口 + 8 固定列：0.673ms/move → 约 0.34ms）。

### N2 每格对象分配（P2）

`paintCellRange` 每格新建 rect 对象（L313-318），`drawCell` 每格新建 options 对象；
`drawCellClipped`（L341-343）在 `state.itemHits` 恒存在时每格新建结果数组。视口
13 行 × 9 列 ≈ 117 组/帧（32 行 × 13 列 ≈ 416 组/帧）。可用「每格复用一个 rect +
按 (row,col) 复用 itemRects 数组」消除，纯 GC 收益，不动逻辑。

### N3 `ctx.font` 每格重设 —— 已评估，不建议动

`drawCell` 每格 `ctx.font = cellFontOf(theme)`（字符串模板拼接 + 赋值）。实测
`ctx.font` 赋值 0.2–0.25µs、字符串拼接 <0.05µs，169 格合计约 50µs，远低于
P0-1 的 9ms 量级。**记录为已排除**，避免后续重复评估。

### N4 `getBoundingClientRect` 每次 pointermove（P2）

`pointOf`（`canvas-table.vue:747-751`）每次 pointermove 读一次 canvas rect（实测
1 次/move，强制同步布局）。canvas 是 sticky、几何只在 relayout 时变，可在
`relayoutAndRedraw` 末尾缓存 rect、`onResize` 失效。收益 µs 级、风险为零，可选。

### N5 variable 模式每帧重精算可视行（P2）

`remeasureVisibleRows`（L583-630）滚动帧对可视窗口全部行调 `ensureRowMeasured`，
不判断该行是否已精算：逐列 `valueOf` + `wrapLines`（缓存命中）+ `updateHeight`
（返回 0）。实测树场景每帧仍 55–60 次 `measureText`（新暴露行）且老行也在做无用功。
可加「record 引用 + 宽度签名」的行级 measured 标记跳过；收益在天花板附近
（帧间隔已 13.3ms），但长文本表格里能省 CPU。

### N6 `withImageRelay` 每帧浅拷贝 state（P2）

`painter.createPainter.apply`（L940-953）每次绘制都 `{...state}` 生成新对象（~30 字段）
并包一层 `onImageLoad` 闭包，`invalidate(immediate)` 每次都走这条路。可与 N2 合并处理。

### C0 扫描/失效语义耦合（新增复杂度项，与 P2-1 升级配套）

现状把「模式已升级」当作「需要重扫」的充要条件，行为契约与缓存失效条件混写在一个
表达式里。抽 `createRowGeometryController`（C1）时应把三者显式化为 controller 字段：
`scanSignature`（估高维度）、`measureSignature`（精算维度）、`mode`。

### C2 镜像常量清单需扩充（方案 6 项 → 9 项）

方案已列 6 项，实测另有 3 组同值常量重复定义：

| 重复 | 位置 |
|---|---|
| `CHECK_SIZE`/`CHECK_RADIUS`/`CHECK_FONT_SIZE` | `painter.js:73-75` 与 `cell-painters.js:31-33`（值完全相同，注释互指） |
| `FALLBACK_PADDING` | `painter.js:86`、`cell-painters.js:54`、`interactions.js:23`（`CELL_PADDING_FALLBACK`） |
| `ELLIPSIS` 与 `DOTS` | `cell-painters.js:59-60` 同值两常量 + `text-wrap.js:23` 第三个 `DOTS` |

### C3 死代码清单需扩充（方案 3 项 → 8 项）

grep 确认「仅自检/零消费」的导出与字段：

| 项 | 位置 | 消费方 |
|---|---|---|
| `resolveResizeDirty` | interactions:296 | 仅 self-checks |
| `resolveHoverDirtyRects` | interactions:324 | 仅 self-checks |
| `buildFlatRows` 的 `parentKeys` | tree:102 | 仅 self-checks |
| `resolveEditorComponent` | editor:313 | 仅 self-checks |
| `getImageEntry` | cell-painters:72 | 仅 self-checks |
| `COL_FALLBACK` | layout:22 | 仅注释引用（已被 `TYPE_DEFAULT_WIDTHS` 取代） |
| `paintState.tree` | canvas-table.vue:344 | painter 从不读取 |
| `theme` 快照 `controlHeight` | theme.js:118 | 仅 self-checks 断言存在性 |

处置口径沿用方案：连同自检断言一起删，或标注 `self-check only`。

### C4 边界确认

四处 uniform 回退（`layout.resolveRowGeometry` / `painter.rowGeometryOf` /
`editor.computeEditorStyle` / `layout.rowAt`）确实存在，删除可行，但注意：

- `painter.rowGeometryOf` 的 WeakMap 兜底同时服务导出的 `cellRectAt`（自检与壳的
  `getCellRect` 都传真 layout、恒有 `rowGeometry`），删除后 `cellRectAt` 需加断言；
- `computeViewRows` / `rowAt` 的 `rowHeight` 分支被 `self-checks/layout.js` 直接以
  参数调用，删除必须同改自检夹具（方案已提，这里确认是硬约束）。

## 修正后的优先级与实施顺序

| 阶段 | 内容 | 依据 |
|---|---|---|
| **0（新增）** | ① 扫描输入签名拆分（只在估高维度变化时重扫）；② placeholder 剥离出 `preparedColumns` 依赖；③ hover 脏区去重（N1） | 三处都是行为不变的小改，把 100k 行 variable 模式下每次 relayout 的 120ms 降到 1–2ms 量级，收益远大于其余项之和 |
| 1 | P0-1（二分 + 缓存 + 返回宽度 + 覆盖 drawTag/drawButton/drawProgress/drawLinkEntry）；P0-2（`paintFixedArea` 行区间） | 低风险；P0-1 是「长文本 + 多列」场景的帧预算主因（实测 9.1ms/帧） |
| 2 | profile：短文本基线（已测）与长 CJK 基线（已测 9.1ms）对比 P0 落地前后；据此裁决 P1-1 / P1-2 | P1-1 当前无证据支持；P1-2 收益主要是 GC |
| 3 | C1 壳拆分（controller 内含阶段 0 的签名对象）；C2/C3/C4 清理（按本文扩充清单） | 阶段 0 行为基线稳定后 |
| 4 | P2-1 分片兜底（仅 records 替换仍超预算时）、P2-2 缓存策略、N2/N4/N5/N6 | 按 profile 结论 |

## 验证设施缺口

**`lastPaint.elapsed` 只覆盖 `paint()`，看不到 relayout 扫描耗时**——本方案最大瓶颈
（120ms）在现有调试面板上完全不可见。建议二选一：

1. 在 `getLayoutInfo()` 增加 `lastRelayout: { elapsed, scanCount, rebuild }`（壳侧
   `relayoutAndRedraw` 计时），demo 调试面板并列显示；
2. 验证时用 `PerformanceObserver({ entryTypes: ['longtask'] })` 替代（本文做法，
   无需改代码，但只能看到总量不能归因）。

自检面板当前 144 条断言全部 PASS（本次复核确认）。阶段 0/1 的回归口径建议增加
两条机器断言：`hover 单次移动的 setTransform 次数 ≤ 1`（N1）、
「100k 行 variable 模式 `fixedLeftColumns` 变更同步耗时 < 20ms」（P2-1）。

## 不建议做（已评估排除）

- `ctx.font` 每格重设优化（N3）：实测 50µs/帧量级，收益低于噪声。
- 滚动自拷贝平移（P1-1）：当前 0.4–1.5ms/帧，无证据。
- `trimItemHits` 优化：规模 = 可视行数（≤ 32），可忽略。
- `recomputeViewWindows` 每帧新建 layout 对象：与方案判断一致，GC 可忽略。
- 宽度变化后 rescale 精算行高以保证严格单调：属行为变更，本轮不做。
