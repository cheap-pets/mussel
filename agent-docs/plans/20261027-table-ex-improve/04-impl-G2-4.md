# 实施记录：G2-4（self-checks/painter.js）

模式：并发（波 2b / 步骤 G2-4）。白名单：`demo/src/data/table-ex/self-checks/painter.js`（仅此文件）。
依据：02-design.md「测试计划」A1/A3/A5/A6/A9 行与「改动清单」self-checks/painter.js 行、派发追加约束枚举；painter 侧实现形态以 04-impl-S4.md 为准（editorRectOf 恒等、rightInsetOf/veil/paintEditorButton/blankTail 均已合入）。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/table-ex/self-checks/painter.js | G2-4（问题 1/3/5/6/9 断言） | 净 +420/−37；检查条目 18 → 23（+5 新增），import 删 `EDITOR_GAP`、增 `editorButtonRectOf`/`CELL_LINE_HEIGHT_FALLBACK`/`requestIconImage`。见下 |

改动摘要：

- **模块头 docblock**：覆盖说明按新口径改写（EDITOR_GAP 内缩作废 → 整格内描边；列出新五组覆盖面）。
- **既有断言随新锚/新夹具同步（2 处）**：
  - itemHits 检查 link 首条目矩形 `y` 期望 `44` → `45`（G1-b 槽位锚：首行 lineY = 36+1+8+9 = 54，逐行矩形 y = lineY − lineHeight/2），注释同步；
  - `:73` 夹具采样坐标注释修正：备注列未定宽走 text 弹性基线 **160**（原注释 130 失真），colWidths [60,140,100,120,50,160]、Σ=630 > stickyWidth 600 → blankTail false（与既有 `assert(wideSum > W)` 一致，`:305` 末列无线断言不受影响，A11 终稿结论维持）。
- **A3 描边断言组改写**（原 :757-791）：删 EDITOR_GAP 引用与 4px 采样假设，改整格重叠新口径——行 1（r≥1，斑马带）五边逐点核对：左缘/底缘 = `blend(primary@0.45, blend(hoverBg, bgStripe))`，顶缘（与行线重叠）/右缘（与列线重叠）= `blend(primary@0.45, blend(hoverBg, borderColorSoft))` 三重混合，内邻 (61,90)/(130,73) 无描边，**外邻 (59,90) = 前列右缘列线叠 hover 带**（原「外邻为行带」预期作废）；行 0 顶缘（格内无行线）+ header 底边框（y=35）不被覆盖；非可编辑列 / editable=false / hoverMode=none 三态无描边保留。
- **新增 5 条检查**（追加约束枚举逐项）：
  1. **树箭头 accent 同槽位**（问题 1）：新造树夹具（treeNode 列 + flatInfo levels [0,0]/hasChildren [true,true] + 变高行 row 1 = 60px），无 hover 帧 `darkBoundsOf` 取常态三角（textColor）bbox centerY，hover 帧新增 `colorBoundsOf`（主色邻近色判定，逐通道容差 60）取 accent 三角 bbox centerY；row 0（54）与 row 1（90，改前 accent heightAt/2 = 102 错位 12px）两态各断言「绝对槽位 ±1px + 与常态同 y ±1px」。
  2. **veil**（问题 6）：tag+link 条目夹具，`editingCell {row:0,col:1}`——veil 格无墨迹（darkBounds null）+ 行背景照画 + 与对照帧（editingCell null）区域差异；非 veil 格（同行 tag、下行 link）照常绘制；命中组断言 veil 格**显式清空为 `[]`**（非 absent）、tag 组 2 条、link 组 10 条照常收集。
  3. **rightInset 注入 + painter 路径槽位锚**（问题 1/9）：新增 `makeRecordingCtx` ctx 桩记录 fillText；3 列全定宽（Σ=330）center 对齐夹具——无空白（stickyWidth=contentWidth=330）末列锚 x = 265、非末列扣 1px（129.5）；blankTail（600>330）末列同扣 1px（264.5）；gridlines 'row' 门控归 0（265/130）；painter 路径垂直槽位锚 row 0 y=54 恰一次、row 1 y=90。
  4. **paintEditorButton 调用路径**（问题 5）：`editorButtonRectOf` 区矩形断言（388,42,24,24，centerY = 36+1+8+9 = 54）；每次运行唯一 SVG 串 + 先行断言 `requestIconImage(...).status === 'loading'` 固定「加载中」前提；加载中帧与无 editorButton 对照帧按钮区 24×24 逐点相等（不半绘制）；hoverMode=none 帧与无 hover 帧整幅逐点相等（paintOverlay 整体抑制含编辑按钮）；加载像素与点击回调归浏览器（与设计 A5 行口径一致）。
  5. **blankTail 末列线**（问题 9）：窄列夹具（Σ=350 < 600）末列右缘 x=349 表体段（y=100/200）与表头段（y=4）均 `borderColorSoft` 1px；gridlines 'row' 两段均不画；无空白默认夹具（Σ=630>600）末列右缘 (599,100)/(599,4) 无线（现状维持）。
- **R4a/R4b（原 :925）**：逐字未改（终稿改动清单「逐字不改」：painter 路径行顶恒 +1，row 0 槽位锚 54 = 内容区中心，两路径同 54）。
- **未写 tree 排序断言**（追加约束明示：终稿测试计划 A8 行无 painter 项，问题 8 组件侧零改动）。

断言清单计数：**新增检查条目 5**（约 41 条 assert）；**改写 2 组**（A3 描边组 13 条 assert 按整格口径重算；itemHits link 矩形 y 值 1 条随槽位锚更新）；**删除 0 条检查**（无检查被移除；`EDITOR_GAP` 具名导入删除，旧 4 条 4px 口径断言并入 A3 组改写）。

## 偏离

无。两处边界内说明（非方案偏离）：

1. `:73` 夹具注释修正（130 → 160）：设计 A11 行括注「默认夹具 Σ=600」与实际 relayout 结果（memo 弹性基线 160、Σ=630）不符，但其结论（blankTail 为 false、既有 `:305` 断言不需改写）经直调验证成立；该注释是本文件采样坐标依据，按实际值修正，不改任何断言行。
2. itemHits link 矩形 y 44 → 45：改动清单 painter.js 行未逐字列出，但该断言在本组白名单文件内、随 G1-b 槽位锚必然失效（否则 A9 回归红），与「描边断言改写」同属锚口径同步范围；期望值经直调验证（208,45）。

## 自检

| 判据 | 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/table-ex/self-checks/painter.js` | **0 error / 0 warning**（初跑 1 warning：colorBoundsOf complexity 12 → 抽 `isPixelNear` 谓词后归 0） |
| 直调走查（确定性期望值对真实模块执行） | /tmp esbuild 打包（.vue/.scss stub、alias @→src）+ node 运行复刻 harness：默认夹具 colWidths/blankTail、A3 格矩形、editorButtonRectOf 区矩形、link 条目矩形（10 条/首条 208,45/高 18）、rightInset 四态 center 锚（265/129.5/264.5/265+130）、槽位锚 y 54/90、窄夹具 contentWidth 350 与线位 x=349 | **21 passed / 0 failed**（临时文件已清理，未触碰仓库） |
| 白名单 | `git status`：本组仅 painter.js 自检文件改动（其余在途改动属并发他组/前序波次，未触碰） | PASS |

像素类断言（描边混色链、树箭头包围盒、veil 墨迹、blankTail 线、编辑按钮加载中）需浏览器 canvas，按派发不做页面级验证，归 V 集成验证；其几何窗口与混色链基底（colorPixel/blendColor 既有基线证明的工具 + 本次坐标）已静态核对并在走查 harness 中验证几何部分。

## 遗留

- 页面级运行（新断言通过 + 未改断言不回归）待 G2 各组全部落地后由 V 步执行；当前 self-checks/editor.js 等他组文件若未收口，整包仍不可 boot（设计内中间态）。
- link 悬停色断言不在本组追加约束枚举内（A7 → G2-3 cell-painters 直调 + G2-6 theme）；painter 侧 hoverItem 注入门控已由 04-impl-S4.md harness 验证，本文件未重复覆盖。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（沿用各组环境备注；本地 node_modules 缺 eslint-config-standard）。
- 编辑按钮「加载中」断言依赖 data URL Image 异步 onload（同步帧内恒 loading）；若浏览器实现变化需复核该前提（与设计 A5「SVG 串须唯一」同源，已按唯一串落地）。
