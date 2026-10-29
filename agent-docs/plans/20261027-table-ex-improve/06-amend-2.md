# 设计审改（第 2 轮：人工修订后的重审核对，不计修订次数）

VERDICT: OBJECT

实质改动 22 项、非实质 6 项；异议 3 条（3 条均为争议，需用户裁决）。

对象：`agent-docs/plans/20261027-canvas-table-improve/02-design.md`（已直接修改）
判读基准：decisions.md（含「检查点-Q1/Q2」两条用户答复）+ 00-task.md A1–A11 + 03-human-1.md 三条人工意见 + 追加约束（Q1=选项 1、Q2=首行槽位锚）。

## 上次回应核对（06-amend-1 九项实质改动 + 人工意见）

| 项 | 结论 | 证据 |
|---|---|---|
| #1 shadow `+1px` | 关闭 | 02-design.md 问题 2 保留；另补 hairline 覆盖区间 `[headHeight, headHeight+2)` 与 A2 判据（见台账 1） |
| #2 paintTreeArrowAccent centerY | 关闭（并升级） | 现改为与 cell-painters 同常量 `ROW_TOP_INSET`，见台账 6 |
| #3 resolveItemClick 透传 disabled | 关闭 | 问题 7 + 接口节；另补 report 函数与 `=== true` 归一（台账 9） |
| #4 A1 断言改 ctx stub | 关闭 | A1 行自检段为 ctx stub 精确断言 |
| #5 A3/A5/A7 断言事实修正 | 关闭 | A3 五条边期望值、A5 可比性、A7 两路径（台账 8/10/11） |
| #6 A6 borderless 载体 | 关闭 | A6 行 |
| #7 A6 夹具事实 | 关闭 | A6 行 |
| #9 G2 页面判据整组执行 | 关闭 | 实施步骤 G2 判据 |
| #8/#19 树关后不排序 | **被 decisions 检查点-人工2（A 案）取代** | decisions:14；A8 行已按「树开/树关均排序序」改写 |
| #14 后半「多行首行锚改格中心」 | **被 Q2 槽位锚取代** | decisions:18；问题 1 全部锚式与判据已重写 |
| #17 R4a/R4b 保持通过 | 关闭（但原文字有误，已纠正） | 见台账 5：值恒为 54，不是 53 |
| #11 treeRecords `.value` | 关闭（前提消失） | 问题 8 保持 const 数组 |
| #12/R7 多行编辑态首行 | 关闭（重写为 ROW_TOP_INSET 口径，且恒差 1px） | R7 |
| #13 textarea 注释 | 关闭（改为「首行文字」表述） | 问题 3 |
| 人工意见 1（列级 top） | **已落实，但与 decisions 内部另一条冲突** → 异议 2 | 问题 1「与 decisions 检查点-人工1 的冲突」 |
| 人工意见 2（A8 A 案） | 已落实 | 问题 8 |
| 人工意见 3（问题 9/A11） | 已落实 | 问题 9 + A11 |

## 检查项结论

1. 覆盖：A1–A11 均有设计与可执行手段；A8 原缺页面侧数据读取通道（`getTreeExpandedKeys` 不含行序）→ 已补 `window.__ctStage`（台账 14）；新增/改写测试文件全在改动清单与 G2 白名单内。
2. 事实一致：改正 14 处与源码不符的路径/符号/行号/几何事实（台账 2/5/7/12/13/16/17/18/19/20/22/23/24/25）。
3. 约定一致：分层、模块隔离、单一事实源、镜像常量收拢均符合；`ROW_TOP_INSET` 落 constants.js 以免 editor↔cell-painters 交叉依赖。
4. 影响面：补 veil 的 itemHits 清空、onPointerLeave 清理、hoverItem 求值位置、cursor 覆盖顺序、`--row-height` 覆盖后果、textarea 超高行编辑态差异。
5. 可实施：G1→S4/S5→G2→V 有序；中间态（含 S4 前的水平锚回退）已逐条写明。
6. 风险与回滚：R1–R11 均有对策；R10 纠正为「锚与 gridlines 解耦」后新增覆盖行高的说明。
7. 范围：改动全在 `src/components/canvas-table/**`、`demo/src/data/canvas-table/**`；文档差异在未解问题 5。
8. 并行组：G1-a/b/c/d 与 G2-1..8 文件集合两两不相交；S4 依赖 G1-a/b/c/d、S5 依赖 S4 与 G1（顺序成立）；G2 各组仅依赖 S5 后的 API；共享文件（cell-painters/painter/canvas-table.vue）都在 G1/S 阶段，未落入并行组。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | 问题 2 方案 / A2 | 「阴影条覆盖 [headHeight, headHeight+2)、header 区域零阴影像素」→ 明确 hairline 覆盖区间 + 模糊项向上溢出 α<0.02；A2 改为「DOM offsetTop 判据 + header 内三点与未滚动帧逐点相等 + 36/37 出现 hairline」，不再强断言 `y=35` 为零阴影 | `--mu-shadow-float` 的 `0 1px 2px/0 2px 4px`（root.scss:62-66）有模糊半径，改后 35 行仍会有极淡溢出；原判据必假红 | 是 |
| 2 | 问题 1 全节 | 「非多行列 box 中心 + 多行列 top 锚」两套锚 → **单一槽位锚 `rect.y + ROW_TOP_INSET + padding + lineHeight/2`**（所有列、所有行同式），并给出残差逐情形值与「0.5px 为算术必然、Q2 下不消除」 | 追加约束 Q2 语义 = 首行行框槽位，与多行列首行同式；两套锚在 Q2 下无区分度，且「垂直 +0.5 修正」与「与多行首行同锚」互斥（padding+lineHeight/2 = 18 vs 内容区中心 18.5） | 是 |
| 3 | 问题 1 锚点口径 | `topInset = gridlines 含 row ? 1 : 0` → **常量 `ROW_TOP_INSET = 1`，与 gridlines 解耦** | 旧式使 `gridlines` 切到 none/column 时全表内容上移 1px（改前这些模式也是 18），是本轮不该引入的跳变；且旧式下 r=0 还需特判 | 是 |
| 4 | 接口 / 改动清单 | `gridInset:{top,right}` → `rightInset: 0\|1` + 模块常量 `ROW_TOP_INSET`；`editorButtonRectOf` 去 `topGridline`、改读 `ROW_TOP_INSET` | 同上；editor.js 不可 import cell-painters，故常量入 constants.js（与「镜像常量收拢」一致） | 是 |
| 5 | 改动清单 self-checks/painter / R1 | 「:925 R4a 期望 54→53、R4b 改写为 53 vs 54」→ **逐字不改（54）**；cell-painters 侧 :661/:684/:720/:851 由块居中改为槽位值 [18,36]/[18,36,54]/[18,36]/[18,36,54,72]，:667 保持 18 | ROW_TOP_INSET=1 时 painter 路径 row 0 锚 = 36+1+8+9 = 54 = 内容区中心，R4a/R4b 无需改；原「53」出自 r=0 取 top=0 的错误推导 | 是 |
| 6 | 问题 1 paintTreeArrowAccent / S4 判据 | 「按内容区中心修正，r≥1 时 +0.5px」→ 「与 cell-painters 同常量同式 `rowY + ROW_TOP_INSET + cellPadding + cellLineHeight/2`」 | painter.js:714 原式 `+heightAt/2` 与文字锚在超高行分叉；同式后无分叉 | 是 |
| 7 | 问题 6 veil | 「`paintBodyRow` 跳过 drawCell」→ 「`drawCellClipped`（painter.js:329，滚动/固定两 pass 共同入口）跳过 drawCell，**并显式清空该格 itemHits 组**」 | 跳过绘制后收集逻辑不执行，旧条目矩形残留 → 浮层下仍可点中 link/button，veil 语义破坏 | 是 |
| 8 | A3 描边断言 | 「(cellX,midY)=主色叠行带、内邻=纯行带」→ 五条边分别给三重混合期望 + 内邻/外邻 + row 0 单独一条 | 顶/右缘像素同时是本格行线/列线（painter.js:375-395），按「纯带色」必假红 | 是 |
| 9 | 问题 7 itemHits disabled | 补 `reportHitRect`/`drawLinkItems` 的 report 均带 `disabled`（`isTruthyAttr` 谓词）、`findHitItem` 用 `=== true` 归一 | link 竖排逐行回报路径（cell-painters.js:882-889）不覆盖则 disabled 链断开 | 是 |
| 10 | A5 自检 | 「未 onload 前与无 hover 帧像素一致」→ 「与同 hover 态的无 editorButton 列帧像素一致」 | hover 高亮本身改变该区像素，原比较对象不可比 | 是 |
| 11 | 问题 7 接线 / A7 | 补 hoverItem 必须在 `updateHover` 之外求值（`:627-640` 同格早退）、`syncPaintState` 按 hoverMode=none 归一、`onPointerLeave` 清理、cursor 覆盖顺序 | 同格内条目间移动不触发 updateHover；离开画布不清理会永久残留 hover 色 | 是 |
| 12 | 问题 7 hover 取色 | `readVar(probe,'--mu-{name}-color-4')` → `getComputedStyle(probe).getPropertyValue(...).trim()` + `raw \|\| colors[name].color` 回退 | theme.js:34-37 `readVar` 是「赋 color 后读计算值」，变量缺失时返回继承色（合法色串），无法判「未定义」→ 自定义主题下 hover 变黑 | 是 |
| 13 | 问题 8 成本夹具 | 「applyOrder(treeRecords) 计时 → 设 orderBy → nextTick → 读 lastRelayout」→ 加复位、两次 tick、**以舞台数据已排序为有效性判据**，并注明不可用 `lastRelayout` 引用判新 | `getLayoutInfo` 每次 `{...lastRelayout}` 展开（canvas-table.vue:1054），引用判据恒真；`orderBy` 已是 asc 时不重算 | 是 |
| 14 | 问题 8 / A8 / 改动清单 | 新增 `window.__ctStage = () => ({records, treeProps})`；A8 断言改用它读行序 | 既有调试句柄只有 `getTreeExpandedKeys()`（key 数组，无行序），A8「同级有序/不跨节点」页面侧不可验证 | 是 |
| 15 | 问题 8 applyOrder | `applyOrder(list)` → `applyOrder(list, order = orderBy.value)` | 夹具第 1 步复位 orderBy 后计时会变成空排序（恒 0ms） | 是 |
| 16 | 问题 3 scss | 补 `border-radius: 0`（.mu-input 基础 4px） | form/input.scss:181 边框 + root.scss:166 `box-sizing:border-box`；圆角使边框四角内缩，与「与格边框重叠」不符 | 是 |
| 17 | 问题 4 自检 / 涉及 | 「link 断言组 :169-217、:714-777」→ :196-220、:108、:709-777 且 textarea 数组开值改由 text 列承接 | 实测行号（self-checks/editor.js）；link 改不可编辑后原 link 用例会失去 normalize* 覆盖 | 是 |
| 18 | R7 / 问题 3 | 「相差上格线 1px（r=0 行一致）」→ 「相差 `ROW_TOP_INSET`（恒 1px，含 r=0）」 | ROW_TOP_INSET 对所有行取 1，r=0 不再特殊 | 否 |
| 19 | R10 | 删「gridlines none/column 时整体上移 1px」，改为「无此变化」；补 `--row-height`=48 时偏上 6.5px | 台账 3 的连带；demo:14 有 48px 覆盖开关 | 是 |
| 20 | A1 前置 / 未解问题 6 | 新增「行高覆盖开关须关闭」「行高覆盖下锚不随行高变」两条 | 同上 | 是 |
| 21 | 问题 5 onClick 插入点 | 「树槽判定之前」→ 「`!col` 早退之后、树槽之前」 | canvas-table.vue:765-796 的实际顺序 | 是 |
| 22 | 多处行号 | editor.js:92/:98/:117；canvas-table.vue:642/:765/:658-661/:809/:870；interactions.js:351-359；cell-painters.js:752/:844/:882-889；painter.js:329/:584-587/:615-626/:1110-1116；tree.js:41-64/:107-136；demo :583-593；`computeEditorStyle` 调用 :885-899 | 逐处 Grep 核对 | 否 |
| 23 | A9 | 「面板显示模块数 9」→ DOM 去重校验；总数改为「运行时实际值即基线，不预设」 | main-view.vue:228 只渲染 `passed/total`，无模块计数 | 是 |
| 24 | 接口/改动清单 | 新增 `requestIconImage` 返回缓存条目、SVG 串须每次运行唯一 | imageCache 为模块级 Map（cell-painters.js:70），固定串二次运行命中 loaded，`loading` 断言假红 | 否 |
| 25 | A11 | 补「既有 :305 末列无线断言用默认夹具（Σ=600=W），问题 9 后仍成立」，复用窄列夹具（:800-808） | 避免实施者误改既有绿断言 | 否 |
| 26 | 问题 1 / A1 前置 / 未解 6 | **新增**「`--row-height` 被覆盖（demo 48px 开关）时槽位锚不变、内容偏上 6.5px」及其两解（槽位锚 vs `rowHeight` 锚） | demo main-view.vue:14 有 48px 覆盖开关；槽位锚只依赖 padding/lineHeight，与行高无关——不写清会让 A1 在开关打开时被判失败 | 是 |
| 27 | 问题 3 风险 | 改写「textarea 撑满整格、文本顶起排」并对超高行的 input/switch 居中差异作明确取舍说明 | 编辑态文本对齐与画布 top 起排的固有差异，须写清避免实施者「顺手修」越界 | 否 |
| 28 | 实施步骤依赖串 | 补「G1-a/b/c/d 与 G2-1..8 文件集合两两不相交；共享文件全在 G1/S 阶段」 | 回应「并行组文件白名单」核对项，便于实施者直接照单并行 | 否 |

## 异议

1. **争议 — 00-task A1 的两条主句在 Q2 槽位锚下不能字面成立（需用户裁决以哪句为准）**
   位置：`02-design.md` 问题 1「A1 判据的残差」/ 未解问题 1；基准 `00-task.md:26`、`03-human-1.md:3`、decisions 检查点-人工1 与 Q2。
   问题：A1 写「单行文本视觉中心 = 内容区（不含边线）几何中心」+「其余列按内容区中心垂直居中」。Q2 的槽位锚 `格顶+18` 与 r≥1 真实内容区中心 `格顶+18.5` 恒差 0.5px（算术必然：`padding + lineHeight/2 = h/2`），**不消除**；超高行中所有列贴行顶，与内容区中心相差可达十几 px。两条主句因此无法逐像素通过。
   证据：`--cell-padding:8` / `--cell-line-height:18` / `--row-height:36`（canvas-table.scss:4-6）；槽位锚 = `1 + 8 + 9 = 18`，r≥1 真实内容区中心 = `1 + 35/2 = 18.5` → 差 0.5px；decisions:18「默认行高时与内容区几何中心差 ≤0.5px，A1 断言公式随此口径收敛」。
   建议修法：本设计已按 decisions Q2 落为「垂直残差 0（r=0 或 gridlines 不含 row）/≤0.5px（r≥1 且含 row）+ 超高行只验跨列同高」，**verifier 据此判 A1**；若用户要求严格「= 内容区中心」，则须改锚为 `rect.y + ROW_TOP_INSET + (rowHeight − ROW_TOP_INSET)/2`（默认同为 18，超高行仍不居中 → 仍不能完全满足「其余列按内容区中心」），或回到 decisions 检查点-人工1 的分列锚（放弃 Q2 的跨列严格对齐）。

2. **争议 — decisions 内部两条口径互斥（检查点-人工1「垂直 +0.5 修正不变」vs 检查点-Q2 槽位锚）**
   位置：decisions:13 与 decisions:18；`02-design.md` 问题 1「与 decisions 检查点-人工1 的冲突」。
   问题：人工1 要求「其余列按内容区中心垂直居中，格线修正口径（垂直 +0.5）不变」= 非多行列锚 18.5；Q2 与用户答复 = 槽位锚 18。两者差 0.5px，不能同时满足。
   证据：两段均在 decisions.md，且 Q2 是后出的用户直接答复（`run.log:6` 记录用户答 Q2）。
   建议修法：本设计取 Q2（后出、更具体、且为答疑直接结论）并在文中标注；建议用户在 decisions.md 中把「格线修正口径（垂直 +0.5）不变」限定为「仅行线占用扣除口径不变」，以消除互斥。

3. **争议 — Q1 选定的 `topAlignColumnsOf` 在 Q2 槽位锚下无任何绘制作用（保留与否需用户定）**
   位置：`02-design.md` 问题 1「注意（Q1 与 Q2 的交互）」、R8、改动清单 row-geometry / canvas-table.vue。
   问题：所有列锚式相同 → `topAlign` true/false 输出逐值相等，分类不产生任何绘制差异 —— Q1 的谓词变成「算出 `Boolean[]` → 经 paintState 透传 → 参数在 drawCell 内不被使用」的空链路（一个语义空洞的死参数，后续维护者容易误以为切它有效）。
   证据：Q2 槽位锚与列分类无关（问题 1 公式）；decisions:17 仍要求 Q1 谓词。
   建议修法：二选一——(a) **保留**（按 decisions Q1 原样实现 `topAlignColumnsOf` + paintState 透传，作为后续切换点，不作为任何断言判据）；(b) **简化**：删 `topAlignColumnsOf` 与 `topAlignCols`/`topAlign` 通道（组件、painter、row-geometry 各减一块），A1 只验统一锚。当前设计取 (a)，实施按 (b) 亦可，但须先由用户拍板（否则可能出现「实现了但永远不生效」的死代码）。

## 附：本轮未改动但需 verifier 注意

- A9 的运行时断言总数不预设：静态 147 与上轮 144 的差异按运行时为准（decisions 未解#1 已给口径）。
- 表头文字 `centerY = headHeight/2` 未修（未解问题 2），A1 不覆盖表头。
- demo 的「行高覆盖（48px）」开关会让内容偏上 6.5px（Q2 预期），A1 验收须在关闭状态执行。
