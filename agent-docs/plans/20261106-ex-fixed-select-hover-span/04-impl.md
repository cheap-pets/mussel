# 实施记录

按 02-design.md 实施步骤串行落地（整体粒度，片 1 → 片 2 → 终验）。TDD 关，但设计步骤自带红/绿判据，均按判据执行并验证。

## 改动文件

| 文件 | 设计步骤 | 改动 |
|---|---|---|
| `src/components/table/ex/table-paint/paint-overlay.js` | 步骤 2（缺陷 1） | `paintCellSelection`：strokeRect 外包 `withClip`，`clipX0 = selected.col < layout.fixedCount ? 0 : layout.fixedWidth`，clip 矩形 `[clipX0, headHeight, stickyWidth - clipX0, stickyHeight - headHeight]`（paint-overlay.js:188-201） |
| `src/components/table/ex/table-paint/paint-overlay.js` | 步骤 4（缺陷 2） | `paintHoverHighlight` 统一取 `cellRect = spanRectOf(...)`（rowValid && colValid）；`paintHoverRow`/`paintHoverCol` 增 `cellRect` 参——行带 y/height、列带 x/width 取 cellRect，null 回退原式；宽/高 cap（contentRightXOf/contentBottomYOf）与带语义不变；cell 模式 fill 复用 cellRect（paint-overlay.js:55-114） |
| `src/components/table/ex/composables/use-pointer.js` | 步骤 4（缺陷 2 脏区侧） | 新增 `colBandRegionsOf`（column/cross 列带失效区间 = `regionAt(spans, cell.row, cell.col)` 的 `[colFrom, colTo)`，无区域回退 `[col, col+1)`，col<0 跳过，按区间去重）；`hoverRegions` 增第 4 参 `spans`；唯一调用点 `updateHover` 传 `ctx.spans.value`；import 追加 `regionAt`（use-pointer.js:7、90-114、150） |
| `demo/src/data/table-ex/self-checks/painter.js` | 步骤 1（断言 A/B）+ 步骤 3（断言 D/E/F） | 新增 5 个独立检查项（A、B、D、E、F）追加到 `checks` 末尾；新增 `buildSpans` import 与 spans 夹具（`SPANS_SPAN_METHOD`：行 0 status rowspan=3、行 3 amount colspan=2 覆盖 check 列 col 4；`makeSpans` 以 `fixedCount: FIXED_COLS` 构建）（painter.js:31、91-105、1420-1545 附近） |

## 偏离

- 无设计偏离。设计接口/伪代码逐字落地；采样坐标按设计断言原文（colorBoundsOf 参数序 `(canvas, x0, x1, y0, y1, cssColor)` 与工具实现一致）。
- 说明（非偏离）：stub 验证中发现选中描边高度为 35px（行 0 topInset=0，`height − 1`），实现记录此前推演"34"有误；自检断言用区域断言（`colorBoundsOf`）不依赖该值，无影响。
- 说明（非偏离）：步骤判据"断言 A 红 / D 红 / E 红"的像素级红绿需浏览器运行自检面板；本环境子 agent 无 playwright mcp，红/绿改以 stub ctx 绘制调用序列 + 几何参数断言验证（等价判据，见「自检」），像素级判定留终验。

## 自检

### 步骤 1（断言 A/B 红/绿判据，stub 层）

脚本：`C:\Users\scrol\AppData\Local\Temp\mussel-verify-ex-span\verify-selection.mjs`（vite ssrLoadModule 加载真实模块 + stub ctx 记录绘制调用）。

实施前（现状，红判据）：

```
A-1 strokeRect=[-49.5,36.5,98,35] clip包裹=false（现状期望 false=红）
A-2 strokeRect=[20.5,36.5,98,35] clip包裹=false
B strokeRect=[0.5,36.5,58,35] 存在（描边可见，判据绿）
```

A 红：描边矩形 x∈[−50,49]（scrollLeft=250）/ x∈[20,119]（scrollLeft=180），无 clip → 顶/底横线与右/左竖线的 x<58 段直接落固定列区 [0,58)，`colorBoundsOf(0,58,36,252, primaryColor)` 必非 null。

### 步骤 2（修复后绿判据 + 回归）

```
A-1 strokeRect=[-49.5,36.5,98,35] 被 clip [60,36,540,216] 包裹（绿）
A-2 strokeRect=[20.5,36.5,98,35] 被 clip [60,36,540,216] 包裹（绿）
B strokeRect=[0.5,36.5,58,35] 被 clip [0,36,600,216] 包裹（绿）
回归 1 无 selectedCell 路径无 save/clip（绘制调用 0 条）
回归 2 hover 行带 fillRect=[0,72,600,36]（x=0 整行带不变）
回归 3 fixedCount=0 clip x0=0（全表体区，与 paintHoverOverlay 同口径）
```

A-2 推演：clip x0=60 裁掉描边 x<60 段（断言 A 前半 null），[60,119] 段保留（断言 A 后半非 null，未过度裁剪）。既有自检断言涉及面：`makeState` 不传 `selectedCell` → `paintCellSelection` 早退（回归 1 证明零调用），既有 hover/表头/网格线断言不受影响。

### 步骤 3（断言 D/E/F 红/绿判据，stub 层）

脚本：`verify-hover.mjs`。夹具区域自检：`rowspan [0,3)x[2,3)、colspan [3,4)x[3,5) 登记正确`。

实施前（现状，红判据）：

```
FAIL: D fillRect 期望 [0,36,600,108]，实际 [0,36,600,36]      ← 行带仅物理行 0
FAIL: E fillRect 期望 [300,36,170,216]，实际 [300,36,120,216]  ← 列带仅锚列
F fillRect=[200,36,100,108]（判据成立）                        ← cell 模式现状回归绿
FAIL: hoverRegions 列带应扩展为 [3,5)，实际 [3,4]
FAIL: hover 移出列带应扩展为 [3,5)，实际 [{"cols":[3,4]}]
```

### 步骤 4（修复后绿判据 + 回归）

```
D fillRect=[0,36,600,108]（判据成立）
E fillRect=[300,36,170,216]（判据成立）
F fillRect=[200,36,100,108]（判据成立）
hoverRegions column 列带 [3,5)（区域扩展，绿）
hoverRegions 移出列带 [3,5)（prev 扩展，绿）
回归4 无 spans row/column/cell fillRect=[0,72,600,36]/[300,36,120,216]/[300,72,120,36]（退化原式 = 既有断言 519/529-531 几何等价物）
回归5 有 spans 普通格 row/column fillRect=[0,180,600,36]/[300,36,120,216]（区域外格退化原式）
回归7 无 spans 列带 [3,4)（单列回退）
回归8 col=-1 空白延伸区无列带（R5 语义不变）
冒烟 spans+row/column/cell/selected、no-spans 全管线 drawRegion 不抛错、窗口统计正常（rows=0+8）
```

行带脏区回归（hover 跨区域行）未单独跑：依赖链 `prepareSpansRegion`（painter.js:319-348）本轮未改动，其对 `{rows}` 的区域并集扩展为既有行为，设计风险节已佐证。

### lint / build

- `npx eslint`（3 个改动文件）：仅 2 处 `spaced-comment`（painter.js:1256/1266，`//（...` 注释）——**既有代码**（不在本轮 diff 中，HEAD a4460ce 已存在），非本轮引入，按范围克制不处理；本轮新增代码 0 错误。
- `npm run build`：通过（330 modules，dist/mussel.ex.js / .min.js / .css 全部产出）。
- 像素级混色断言（`blendColor(hoverBg, bgNormal/bgStripe)`）与残影动态行为须浏览器运行自检面板（demo 自检 onMounted 自动跑，`http://localhost:3000/data/table-ex/`）——本环境无 playwright mcp，留终验。

## 遗留

1. **终验待执行（环境阻塞）**：浏览器像素级验证未在本轮完成——子 agent 无 playwright mcp 工具。需终验方（或人工）执行：① 自检面板全绿（含新增断言 A/B/D/E/F）；② `fixed` 场景选中 col 2 + `scrollLeft=80` 后固定区描边条带无 primaryColor（禁整块固定区断言，col 1 为 link 列会假阳性）；③ `spans` 场景 row/column/cell 三模式合并区域 hover + 移出无残影；④ 无固定列无合并默认场景目测回归。
2. 设计「未解问题 1」（hover 编辑描边左段压固定列上沿）按设计不处理，维持既有边缘行为。
3. demo 服务（3000 端口）为 watch 构建，src 改动已自动重建；终验直接访问即可，无需重新打包。
4. 临时 stub 验证脚本在项目外（`C:\Users\scrol\AppData\Local\Temp\mussel-verify-ex-span\`），不进入工作区与提交。
