# 设计：canvas-table 改进（问题 1–8 + 检查点补充问题 9）

基线 `mussel-table` @ `3d41296`。输入：00-task.md、decisions.md、01-explore.md、01-explore-补-1.md、03-human-1.md（检查点人工意见）、06-amend-1.md（交叉审改）、06-amend-2.md（第 2 轮重审）。
decisions.md 各口径（link 恢复不可编辑、EDITOR_GAP 作废、**列级 top 对齐**、**树排序 A 案**、**问题 9 末列右边框**、**A1 判据终版（检查点-A1判据）**、**列分类通道删除（检查点-通道）**）均作为已确认约束执行，本文不另行论证。Q2 的落点 = **全文唯一垂直锚公式**（首行行框槽位，见问题 1），A1、自检断言、水平锚、树箭头 accent、编辑按钮 centerY 全部收敛到该式。

## 终版口径落地（decisions 检查点-A1判据 / 检查点-通道）

| 口径 | 落地 |
|---|---|
| **A1 判据终版**：非多行列按**默认行高区域居中** = Q2 槽位锚 `行顶 + ROW_TOP_INSET + padding + lineHeight/2`（默认行高 36 下 = 格顶+18 = 整格中线） | 问题 1「A1 判据的残差」：**垂直残差 0（r=0 或格线不含 row）/ ≤0.5px（r≥1 且含 row）**，超高行只验**跨列首行同高**；取代 00-task A1「= 内容区（不含边线）几何中心」的逐像素读法（06-amend-2 异议 1、2 销项），verifier 按本公式判 A1 |
| **「行线占用扣除口径」不变，+0.5 不作为独立锚偏移**：人工 1「格线修正口径（垂直 +0.5 / 居中列水平 −0.5）不变」限定为「行线占用扣除口径不变」 | ROW_TOP_INSET = 1 行顶扣除与水平 rightInset 列线扣除（占用扣除语义，参与锚公式基数）保留；**垂直 +0.5 独立锚偏移不实现**（非多行列锚 = 格顶+18，非 18.5）；水平居中 −0.5 即列线占用扣除作用于 center 锚的结果（精确、非叠加偏移） |
| **删除 topAlignColumnsOf / topAlignCols / topAlign 通道**（组件、painter、row-geometry 相应精简） | 统一锚式下列分类无绘制差异（死代码），**全链路不实现**（row-geometry 导出、paintState 字段、drawCell 参数、壳 computed 一并不做）；[检查点-Q1] 谓词答复（选项 1）留档 decisions 备查，日后需要按列差异对齐时再加回（06-amend-2 异议 3 销项）。**A1 只验统一锚** |

Q2 槽位锚的落地形态不变：cell-painters 全部垂直锚、painter 树箭头 accent、editor 编辑按钮 centerY 收敛到同一式（全文唯一垂直锚公式见问题 1）。

## 方案概述

9 项问题（清单 1–8 + 检查点补充 9）落为四类改动，全部限定在 `src/components/canvas-table/**` 与 `demo/src/data/canvas-table/**`：

1. **几何修正**（问题 1/2/9）：**垂直锚统一为首行行框槽位**（decisions 检查点-Q2 + 检查点-A1判据：非多行列按默认行高区域居中，即同一槽位锚）——`slotCenterY = 格顶 + ROW_TOP_INSET(1) + padding + lineHeight/2`，所有列（多行列首行、列内单行格、items/progress/button/树箭头/编辑按钮）同式；默认行高下与真实内容区几何中心之差 **0（r=0 或 gridlines 不含 row）/ 0.5px（r≥1 且 gridlines 含 row）**（垂直锚值与改前单行锚逐值相同，属沿用现状偏差而非新增偏移）；超高行（行高被多行列内容撑大）中所有列内容均贴行顶起排，与内容区中心差可远大于 0.5px（Q2 的直接结果，见 R10）。水平居中锚按内容区水平中心修正（居中列 −0.5px，精确）；**多行文本列与多行链接列整列垂直 top 对齐**（统一锚式下所有列首行同锚，多行列与非多行列的 top 对齐是其直接结果；首行文字 top = 内容区顶 + padding，行高公式不变、无裁剪）；顶部滚动阴影 DOM 锚点从 table 顶移到 header 下沿；表格宽度超出列宽总和（存在空白区）时末列右缘补画 1px 列线（含列头）。
2. **编辑覆盖形态**（问题 3/4/6）：`EDITOR_GAP=4` 内缩口径作废，hover 描边与编辑浮层矩形 = 整格矩形（与格线重叠）；不可编辑类型清单补 `link/button/progress`（推翻 20261025「link 可编辑」人工决定，按 decisions）；编辑容器背景移除 + 画布侧「编辑格内容跳绘（veil）」解决开关/无边框形态的白色底块。
3. **新增能力**（问题 5）：列定义 `editorButton: { icon, onClick }`——hover 时格内最右侧垂直居中绘制图标按钮，点击回调由用户定义。图标走**已验证先例路线**：SVG 字符串（currentColor 替换着色）→ data URL → 复用 `requestImage` 加载缓存 → `drawImage`。
4. **交互与排序**（问题 7/8）：条目级 hover 通道（link 变浅色 + 下划线、button pill 反转、cursor pointer）；主题快照扩 `--mu-{semantic}-color-4` hover 色；**树排序 A 案**：组件侧不做树禁排（排序仍父级受控契约），demo 树场景数据源接排序产物（同级子节点内排序、不跨节点，由 tree.js DFS 重组语义天然保证），附成本测量夹具实测回填。

## 分项方案（问题 1–8）

### 问题 1：垂直/水平居中修正（首行槽位锚 + 内容区水平中心）与多行列整列 top 对齐

**事实**（01-explore + 回查源码）：
- 行线画在下一行矩形顶部 1px（r≥1，painter.js:374-379），列线画在本列右缘 1px（非末列，painter.js:382-395）。内容区（本文判据） = `[rect.y+ROW_TOP_INSET, rect.y+h) × [rect.x, rect.x+w−rightInset)`。现绘制锚点 `rect.y + h/2` 与**真实内容区**几何中心的偏差 = **垂直 0.5px（r≥1 偏上；r=0 为 0）、水平 0.5px（居中列偏右）**。问题 1 的目标口径（decisions 检查点-人工1 + Q2 + 检查点-A1判据）：垂直改按**首行行框槽位**（与多行列首行同式），水平改按内容区水平中心。**数值结果：row 线模式下单行垂直锚与改前逐值相等（r=0、r≥1 均为 y+18）**——Q2 修正的是多行块（块居中 → 首行槽位）与超高行（贴顶起排），不改变默认行高单行的垂直位置；水平居中列 −0.5px。
- **现多行起排锚**：`multilineBlockTop = rect.y + max(padding, (h − blockHeight)/2)`（cell-painters.js:413-415）——块整体垂直居中；三处共用（wrapLines :447、数组 :488、link 竖排 :881）。
- **行高估高与 top 的关系**：`rowHeightOf = max(rowHeight, padding×2 + lines×lineHeight)`（row-geometry.js:135-137，padding = `theme.cellPadding`，lineHeight = `--cell-line-height`）。槽位锚（首行行框顶 = 内容区顶 + padding）下块底 = padding + n×lineHeight ≤ padding×2 + n×lineHeight ≤ 行高 → **块永不越出格底，无需裁剪**（估高/精算一致时恒成立）。

**方案**（decisions 检查点-人工1 + **Q2：统一垂直锚 = 首行行框槽位**；文字 top = 内容区顶 + padding；水平 = 内容区水平中心）：

统一公式（全文唯一口径；cell-painters / painter / editor 三处同式，硬件像素不参与）：

```
ROW_TOP_INSET = 1                              // 常量，与 gridlines 无关（理由见下条）
anchorBaseY   = rect.y + ROW_TOP_INSET         // = box.y
slotCenterY   = anchorBaseY + padding + lineHeight / 2   // 首行行框中心；多行后续行 += lineHeight
水平居中锚 x   = rect.x + (rect.width - rightInset) / 2   // 内容区水平几何中心（精确）
rightInset    = (非末列 || blankTail) && gridlines 含 column ? 1 : 0
// 不使用 rect.height：超高行不参与锚点计算（这正是 Q2 的语义）
```

- **锚点口径（公式的唯一输入）**：`ROW_TOP_INSET = 1`，**常量、与 `gridlines` 模式无关、对所有行（含 r=0）取同一值**。三条理由：
  1. **数值正确**：默认行高下锚 = `rect.y+1+8+9 = rect.y+18`，恰为整格中线；r=0 格内无行线 → 精确居中；r≥1 格内顶有 1px 行线 → 相对真实内容区偏上 0.5px（Q2 已接受）。
  2. **零回归**：与改前单行锚 `rect.y+h/2` 逐值相同，所有 `gridlines` 模式下单行垂直位置都不变。
  3. **不得依赖 `gridlines`**：若写成 `gridlines 含 row ? 1 : 0`，则用户把 `gridlines` 切到 `none`/`column` 时全部单元格内容会整体上移 1px（改前这些模式也是 18），是本轮不该引入的视觉跳变，且 `gridlines` 是渲染 prop，切一次就跳一次。故该常量与模式解耦。
- **A1 判据的残差（终版判据本身，逐情形给值；decisions 检查点-A1判据）**：真实内容区 = 格矩形内**实际有墨线的部分之外**。槽位锚恒为 `rect.y+18`。
  - `gridlines` 含 row（all/row）+ r≥1：格内顶部有 1px 行线 → 中心 `rect.y+18.5` → **残差 +0.5px（偏上）**；
  - `gridlines` 含 row + r=0：格内无行线（表头底边框在矩形外）→ 中心 `rect.y+18` → **残差 0**；
  - `gridlines` 不含 row（none/column）：所有行格内无行线 → 中心 `rect.y+18` → **残差 0**。

  **+0.5px 是「所有列首行同锚」的算术必然（`padding + lineHeight/2 = h/2`），终版口径下不消除、也不作为独立锚偏移**（检查点-A1判据：人工 1 的「格线修正口径（垂直 +0.5 …）不变」限定为「**行线占用扣除口径不变**」——ROW_TOP_INSET = 1 的行顶扣除保留，垂直 +0.5 偏移不叠加到锚上）。**问题 1 因此只消除水平 0.5px（精确，即列线占用扣除作用于 center 锚）**；A1 判据 = **垂直残差 0（r=0 或格线不含 row）/ ≤0.5px（r≥1 且含 row）**，超高行只验**跨列首行同高**（取代 00-task A1「= 内容区几何中心」逐像素读法，verifier 按此判）。
- **锚点与改前的关系**：`slotCenterY = 格顶 + ROW_TOP_INSET + padding + lineHeight/2 = 格顶 + 18`，与改前单行锚 `rect.y + h/2 = 格顶 + 18` **逐值相等** → **所有 `gridlines` 模式下单行垂直位置零变化、无回归**；变化只在（a）多行块由「整块居中」改为「首行槽位起排」、（b）超高行所有列贴行顶、（c）水平居中列 −0.5px。
- **与 decisions 检查点-人工1 的口径关系（已收敛，无冲突）**：该条写「其余列按内容区中心垂直居中；**格线修正口径（垂直 +0.5 …）不变**」——经 decisions 检查点-A1判据 限定，「格线修正口径不变」指「**行线占用扣除口径不变**」（ROW_TOP_INSET = 1 的行顶扣除、水平 rightInset 列线扣除），**+0.5 不作为独立锚偏移**：非多行列锚 = 槽位锚 `格顶 + 18`（= 默认行高 36 的区域居中位），非 `格顶 + 18.5`。原 06-amend-2.md 异议 2 的二选一随该限定销项。
- **`--row-height` 被覆盖时（demo 有 48px 夹具开关）**：槽位锚 = `1 + padding + lineHeight/2 = 18` **不随行高变化**，而该行内容区中心 = `1 + (48−1)/2 = 24.5` → 内容明显偏上（差 6.5px）。**这是「按默认行高区域居中」的必然结果**（锚只依赖 padding/lineHeight，与行高无关；`--row-height` 变化不改 padding/lineHeight）。A1 的「垂直居中」判据**只在 `--row-height` 为默认值（36）时成立**；demo 的行高覆盖开关属交互演示，不参与 A1 断言（verifier 须在关闭该开关的默认状态下验收 A1）。终版口径（检查点-A1判据「非多行列，按默认行高区域居中」）确认为槽位锚，**不引入 rowHeight 锚**；原「行高覆盖下也应垂直居中」的备选销项。
- **超高行**（同行多行列内容把 h 撑大于 rowHeight）：**所有列**（含原本居中的非多行列）同用槽位锚——内容贴行顶、与多行列首行同高；此时与内容区中心的偏移 = h/2 − (ROW_TOP_INSET + padding + lineHeight/2)，可远大于 0.5px（Q2 选项 2，取代原设计默认项 1；见 R10）。**A1 对超高行只验「跨列首行同高」**（decisions 检查点-A1判据，取代 00-task A1「其余列按内容区中心」在超高行的字面读法；原 06-amend-2.md 异议 1 销项）。**锚式不引入 `theme.rowHeight`**（Q2 的落点 = 首行行框槽位，与行高无关；decisions Q2 括注的「居中锚基数引入 theme.rowHeight」是前稿选项 2 的表述，按本轮追加约束的定义不采用）。
- `drawCell` 新增入参 `rightInset: 0|1`（painter 注入；缺省 0，自检直调兼容；**无 topAlign 参数**——列分类通道已按 decisions 检查点-通道 删除，统一锚式下无列差异）；行顶 1px 为**模块内常量** `ROW_TOP_INSET = 1`（不需要调用方传，杜绝 painter 与 cell-painters 口径分叉）。**注入表达式（drawCellClipped）**：`rightInset = ((colIndex < colWidths.length - 1) || blankTail) && isGridlineMode(state.gridlines ?? 'all', 'column') ? 1 : 0`（`blankTail` 与问题 9 同一个 `layout.stickyWidth > (layout.contentWidth || 0)`——问题 9 生效时末列右缘也有 1px 线，属占用本格矩形，须一并扣除）。函数内构造 `box = { ...rect, y: rect.y + ROW_TOP_INSET, height: rect.height - ROW_TOP_INSET }`，**宽度不减**（padding 8 ≫ 1px 格线，截断/折行无可观察差异；且保持与估高 `contentWidthOf`（row-geometry.js:52）同式，不破坏「行高公式 = 绘制占位」约定）；`rightInset` 只参与水平居中锚。`box` 向下贯穿全部子绘制（树箭头、items、progress、button、文本）。
- **垂直锚（所有列同式）**：所有 `rect.y + rect.height / 2` 改为 `rect.y + ROW_TOP_INSET + padding + lineHeight / 2`（cell-painters.js:469、:541、:611、:928、:986）→ 单行省略、树箭头、横排 items、progress、button 全部落到首行槽位（**默认行高下数值 18，与改前逐值相等，与 gridlines 模式无关**；垂直锚恒为整数，分数像素仅来自水平 −0.5px）。实现落点（逐函数，防漏改）：
  - `drawCell` 内把 `box` 与 `box.centerY = box.y + padding + lineHeight/2`（box.y = rect.y + ROW_TOP_INSET）一并算出，向下传；
  - `drawTreeAffordance`（:541 箭头、以及 x 缩进基线）用 `box.y`/`centerY`；
  - `drawItems`（:611 `centerY`）用 `centerY`；其 `contentHeight` 传 `box.height`（img 最大高用）；**`reportHitRect` 仍传整格 `rect` 的 y/height**（横向条目命中区保持整格语义）→ 该函数需同时持有 `box`（绘制）与 `rect`（命中），两个参数都要传；**`drawLinkItems` 的条目命中矩形是逐行的**（`{ y: lineY − lineHeight/2, height: lineHeight }`，cell-painters.js:882-889），随 lineY 自动跟随新锚，**不要改成整格矩形**（否则多行链接的逐条点击语义丢失）；
  - `drawProgress`（:928）/`drawButton`（:986）用 `centerY`；
  - `drawTextValue`（:469 单行）/`drawArrayLines`（:488）/`drawLinkItems`（:881）首行 y 用 `centerY`，后续 `+= lineHeight`；
  - `textAnchorX`/`itemsStartX` 增 `rightInset`（水平锚，见下条）。
- **多行锚**（数组值 / `maxLines>1` / `multiline` / link 竖排）：删除 `multilineBlockTop`（cell-painters.js:413）；三条路径（wrapLines :447、数组 :488、link 竖排 :881）首行 fillText y = `box.y + padding + lineHeight / 2`（「文字 top」= 行框 top：box.y + padding；行框槽位锚不随字形墨迹度量浮动），后续行 `+ lineHeight`。**列内单行格与其它列同锚（逐值相等）**——「整列 top 对齐」由统一锚式直接保证，不依赖列分类（列分类通道已删除，decisions 检查点-通道）。**不引入 clip**：行高公式 `max(rowHeight, padding×2 + lines×lineHeight)` 保证 top 块底 = padding + n×lineHeight ≤ 行高，估高/精算一致时恒不越界（估高/精算过渡帧行为与现状一致，现状亦无裁剪）。
- painter.js `paintTreeArrowAccent`（painter.js:714）另起一套 `centerY = viewportRowY(...) + heightAt(row) / 2`，hover 主色三角与常态三角同形不同源——须改为同一槽位式 `centerY = viewportRowY(layout, hover.row) + ROW_TOP_INSET + cellPadding + cellLineHeight / 2`（与 drawCellClipped 逐字同式；theme 快照含 cellPadding/cellLineHeight，theme.js:116-117，缺省回退 CELL_PADDING_FALLBACK / CELL_LINE_HEIGHT_FALLBACK）。**若不同源**：底色三角（drawCell 路径，锚 18）与主色三角（当前 `rowY + heightAt/2`，超高行远大于 18）在超高行错位，hover 时可见双层边。改后两者同式，与文字、编辑按钮区逐值一致。
- 水平锚：`textAnchorX`（cell-painters.js:399）新增 `rightInset` 参数，center 分支改 `rect.x + (rect.width - rightInset) / 2`（非末列 −0.5px；调用点传 `rightInset`）；`itemsStartX`（:668）新增 `rightInset`，center 分支改 `rect.x + (rect.width - rightInset - offset) / 2`（条目组在内容区宽内居中）。left/right 锚不动（padding 8 ≫ 1px 格线，文字不会压线）。多行列水平锚同此，不随 Q2 变化。
- **列分类通道：不实现**（decisions 检查点-通道）。统一锚式下 `topAlignColumnsOf → paintState.topAlignCols → drawCell.topAlign` 全链路不产生任何绘制差异（死代码），整链删除——row-geometry.js 无新增导出、paintState 无 topAlignCols 字段、drawCell 无 topAlign 参数、壳无 topAlignCols computed。[检查点-Q1] 谓词答复留档 decisions 备查（选项 1：配置级 `maxLines>1`/`multiline` + 任意列数组值检测、`SINGLE_LINE_TYPES` 恒 false、数据源取 `props.records` 全量而非 displayRows），日后需要按列差异对齐时按该答复加回。测试计划不以「top 列 vs 居中列」锚差为判据，**A1 只验统一锚**。
- 行高公式（row-geometry.js:135 `rowHeightOf`）与估高/精算管线**均不改**：锚定口径变化不动行高，无布局跳动、无 Fenwick/滚动锚定影响。
- 表头文字居中（painter.js:537）不在 A1 范围，不动（见未解问题 1）。
- **与人工意见 1 字面的对齐（逐项核对，供 verifier）**：03-human-1 意见 1「非多行列的内容，按在默认行高中居中的位置」——本设计的锚 = `格顶 + ROW_TOP_INSET + padding + lineHeight/2 = 格顶 + 18`，默认行高 36 的中线亦为 `格顶 + 18`，**两者逐值相等**；多行列首行行框顶 = `格顶 + ROW_TOP_INSET + padding = 格顶 + 9`、中心同样 18 → 「同一 row 内多行列与非多行列 top 文本行对齐」（Q2 用户自答）成立。**00-task A1 转写的「其余列按内容区中心垂直居中」只在超高行与该字面不同**（超高行默认行高中线仍是 18，内容区中心则随行高下移）→ 终版口径已裁决：非多行列「按默认行高区域居中」= 槽位锚，超高行按「与多行列首行同高」验（decisions 检查点-A1判据）。
- 垂直锚终版 = Q2 槽位锚（decisions 检查点-Q2 + 检查点-A1判据）；Q1 判定谓词（选项 1）**留档 decisions 备查、不实现**（decisions 检查点-通道，06-amend-2 异议 3 销项）。无待确认项。

**涉及文件/函数**：cell-painters.js（drawCell 增 rightInset、ROW_TOP_INSET 与 box 构造；垂直锚统一首行槽位——单行/树箭头/items/progress/button；多行三路径首行同式；删 multilineBlockTop；textAnchorX/itemsStartX center 基准）；painter.js（drawCellClipped 计算 rightInset 注入、paintTreeArrowAccent centerY 首行槽位同式）。**row-geometry.js 零改动**（列分类通道删除，decisions 检查点-通道）。

**风险**：超高行所有列内容贴行顶（Q2 口径本身，见 R10）；所有 gridlines 模式下单行垂直位置与改前一致（ROW_TOP_INSET 与模式解耦）；水平 −0.5px 为分数像素锚（DPR1 亚像素抗锯齿，属修正预期）；**R4a/R4b 断言数值全部不变**（row 线模式垂直锚与改前逐值相等，painter 路径 row 0 仍为 54）；cell-painters 直调路径同样含这 1px（常量内建），单行锚仍为 18（`:667` 不需改）；多行路径因删除块居中而改变，见改动清单。

### 问题 2：顶部滚动阴影位置

**方案**：`canvas-table.scss:73-75` `.mu-canvas-table__header-shadow` 的 `top: 0` → `top: calc(var(--head-row-height, 36px) + 1px)`。`--head-row-height` 已在 `.mu-canvas-table` 根声明（scss:8）、与探针 `readPx('--head-row-height')`（theme.js:115）同源，用户覆盖变量时两者同步。`--mu-shadow-float` 首项为 `0 0 0 1px`（root.scss:62-66），0 高度条以其为轴向外扩 1px：若 `top` 取 `headHeight`，hairline 上沿正好压住 header 底边框（画在 `headHeight−1`，painter.js:682），A2「不覆盖 header」不成立；`+1px` 后 hairline（spread）覆盖 `[headHeight, headHeight+2)`，**完整强度的 hairline 不再落在 header 区域**（`[0, headHeight)`）；`0 1px 2px / 0 2px 4px` 两项的模糊会向上溢出约 2px、alpha < 0.02 的极淡暗影，视觉不可辨（A2 判据见测试计划，不按「零像素」判）。

**涉及**：canvas-table.scss 一处。**风险**：模糊项恒定存在（无对策必要，改前同样有）；`--head-row-height` 被用户覆盖时 `calc` 同步跟随，无需额外接线。

### 问题 3：hover 边框/编辑输入框与单元格重叠

**方案**（decisions：EDITOR_GAP 口径作废）：
- editor.js：删除 `EDITOR_GAP`（:92）与 `gridlineShows`（:98）；`editorRectOf(rect)`（:117）改为恒等映射 `{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }`（保留导出：hover 描边与浮层定位的单一事实源不变，painter→editor 单向依赖例外沿用）；`computeEditorStyle`（:397）删除 `gridlines`/`theme` 参数与 topGridline/rightGridline 计算，矩形 = 整格。首行顶线/末列右缘特判随参数一并删除。
- painter.js `paintHoverEditorStroke`（:770）：`editorRectOf(cellRectAt(...))` 无参调用，`strokeRect(rect.left + 0.5, rect.top + 0.5, w − 1, h − 1)` 1px 描边落在格缘内侧：顶边覆盖本格首个像素行（r≥1 即与画在本格内的顶行线重叠；r=0 时表头底边框在其上方相邻）、右边覆盖本格右缘（非末列即与右列线重叠，末列在 blankTail 时同）、左边与底边落在格内首/末像素（相邻于前列右线与下行顶线，视觉连续）。
- canvas-table.scss：`.mu-input` 左缘补偿基数 5px（EDITOR_GAP 4 + 边框 1）→ 1px（仅边框）：`:129` `padding: 0 0 0 calc(var(--cell-padding, 8px) - 1px)`；`:144` textarea 四边 `calc(var(--cell-padding, 8px) - 1px)`；**新增 `border-radius: 0`（.mu-input 基础规则是 4px，圆角会使四角内缩、边框在角落偏离格缘，与「边框与格边框重叠」不符；同时避免圆角处透出行底色）**；:121-125 注释同步。输入框文本左缘 = 格左 + 边框 1 + (padding − 1) = 格左 + padding，与画布文字左缘仍精确一致。textarea 上方注释（scss:136-140）「首行顶 = 格顶 + padding」半句随之**成立并更新表述**：Q2 统一槽位下**任意列**首行文字顶 = 内容区顶 + padding = 格顶 + 上格线 1 + padding，textarea 首行顶 = 格顶 + 边框 1 + (padding − 1) = 格顶 + padding → 二者恒相差 `ROW_TOP_INSET`（1px，所有行、所有 gridlines 模式都成立），注释改记此口径（原「多行首行」措辞改为「首行文字」）。

**涉及**：editor.js、painter.js、canvas-table.scss、canvas-table.vue（computeEditorStyle 调用点 :885-899 删除 `gridlines: props.gridlines` 与 `theme: themeWatcher?.snapshot` 两行）、self-checks（见测试计划）。

**风险**：编辑输入框自身边框与格线完全重叠后，「编辑态边框」视觉上消失、仅剩 focus 光环与内容差异提示——这是需求原文要求的行为；_mu-input focus 光环保留（--borderless 白名单不触 box-shadow 的既有规则），编辑态可辨识。另：编辑态文本位置与画布的对应关系——**textarea** 撑满整格、文本从顶部起排，与画布多行列首行 top 起排一致（差上格线 1px，见 R7）；**单行 input** 的文字由控件自身垂直居中（容器 flex `align-items:center` + input 撑满），在默认行高下与画布单行锚（18）一致，但在**超高行**（同行多行列撑高）中画布内容贴行顶而 input 文字居中，进出编辑态会出现位置跳变。这是「画布 top 起排 vs 原生控件居中」的固有差异，非本次可无损消除（如需一致须给 input 设显式 padding-top 并按行高计算，超出需求 3 范围）；**switch** 同理在超高行居中显示。A3/A6 不对此断言。

### 问题 4：展示型列类型不可编辑

**方案**（decisions：link 恢复不可编辑，推翻 20261025 人工 2 意见 2）：
- editor.js:63 `NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check', 'link', 'button', 'progress']`；:59-62 注释改记「link 20261027 起恢复不可编辑（用户清单 4，decisions [S1]）；button/progress 为 canvas 专属展示类型一并排除」。
- `resolveEditorType`（:184）：`text/link` 分支收窄为 `text`（link 列被 isCellEditable 拦截，分支成死代码，删除；`resolveTextLikeEditorType` 本身保留供 text 列）。textarea 数组开值 caption 拼接（normalizeEditorOpenValue/normalizeTextareaCommitValue）为通用逻辑，保留不动。
- demo main-view.vue:**583-593**：items 场景链接列摘除 `editable: true, editor: true`（decisions 已定）。
- 自检改写要点（self-checks/editor.js）：computeEditorStyle 断言组按**整格矩形**重算期望值（fixed row1/col0/scrollTop 8 → `[0,64,100,36]`；scrolled row0/col2/scrollLeft 250 → `[50,36,80,36]`；变高行 row1 h=100 → `[100,72,200,100]`；heightAt=0 → height 0），并**删除**「EDITOR_GAP 导出值 = 4」「三类型同矩形因 gap 相同」「gridlines none 无扣除」「theme: undefined 同矩形」四条已失去语义的断言（三类型同矩形仍成立但理由变为「矩形恒等」，可保留断言改注释）；:197-217 的 `assert(!NON_EDITABLE_TYPES.includes('link'))` 与 `link 列可编辑` 反转为断言 link/button/progress 均在清单且 `isCellEditable` 为 false；:108 块名与断言中「text/link 形态判定」改为仅 text（link 分支已删，直调 `resolveEditorType({type:'link'})` 现回退 'input'，如保留该断言须改为断言回退值）；**:709-777** 的 textarea 数组开值 caption 拼接覆盖改由 text 列 + 对象数组承接**（原用 link 列，link 已不可编辑，直接删会丢失 normalizeEditorOpenValue/normalizeTextareaCommitValue 的覆盖——这两函数是通用逻辑，保留不动）。

**涉及**：editor.js、demo main-view.vue、self-checks/editor.js（:196-220 只读判定块中 link 相关断言反转、:108 块头/断言中的 text/link 表述收窄为 text、:709-777 textarea 数组开值块改用 text 列 + 对象数组承接）。

**风险**：无（收紧行为；button/progress 现网未配 editor，无回归面）。

### 问题 5：列定义自定义编辑按钮（仅图标、仅一个、hover 显示）

**契约**：`column.editorButton = { icon: String, onClick: Function }`。
- `icon`：SVG 标记字符串（推荐 `import x from '~icons/outline/*.svg'` 产物——demo 构建通路已验证，demo/src/common/app.js:4-8 先例；`outline/pencil.svg` 已确认存在，node_modules/@tabler/icons/icons/outline/）或图片 URL/data-URL。仅支持一个按钮、仅图标，无 caption/disabled 配置（需求边界）。**SVG 串经 `pluginSvg`（svgo 优化）后可能被压成单行且属性顺序变化，`/currentColor/gi` 替换对 `stroke="currentColor"` 与 `fill="currentColor"` 两种写法都生效**（filled 图标是 fill 型）。
- `onClick ({ record, recordIndex, column })`：壳在点击命中按钮区时同步调用；payload 惯例对齐 `cell-item-click`（canvas-table.vue:808-811：`const raw = col._raw ?? col`，column 传原始列引用）——注意 `update:cell-value` 的 column 是**内部列**（editor.js:641 `context = { column, ... }` 存的是壳传入的已准备列，含 `_raw`；commit 于 :680 原样回传），不可按该事件取值。命中为局部交互（对齐树箭头槽先例）：不选中行、不发 cell-click、不开编辑。

**绘制**（hover 时，随 hover 脏区重绘）：
- painter.js `paintHoverOverlay`（:791）末尾新增 `paintEditorButton(ctx, state, hover)`：hover 格所在列有 `editorButton.icon` 时，经 `editorButtonRectOf` 取区矩形，`requestIconImage(icon, theme.textColor, () => state.onImageLoad?.(hover.row, hover.col))` 取图（onLoad 经 withImageRelay 转为 invalidateCell，painter.js:1110-1116），`status === 'loaded'` 才 `ctx.drawImage`（16×16 居中于 24×24 区）。**非首次请求（缓存命中）时 requestImage 不重挂 onLoad**（cell-painters.js:78-100 既有语义：onLoad 仅在建条目录入），此时图标已 loaded、当帧直接可绘，无需回调。`hoverMode 'none'` 时随 paintHoverOverlay 一并抑制。
- `requestIconImage(icon, color, onLoad)`（cell-painters.js 新增导出，**返回 requestImage 的缓存条目**）：SVG 串（含 `<svg`）→ `/currentColor/gi` 替换为着色串（tabler outline 图标 `stroke="currentColor"`；img 上下文的 currentColor 不可靠，必须替换）→ `'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(...)` → 委托既有 `requestImage`（cell-painters.js:78，缓存/onload 管线单一事实源；缓存键含着色串，色变自然分键）；非 SVG 串按图片 src 直通。着色 = `theme.textColor`。**`requestImage` 现为模块私有**（未导出），故必须在 cell-painters 内新增此包装函数而不是在 painter 里直接 import。
- 区矩形 `editorButtonRectOf(rect, { padding, lineHeight })`（editor.js 新增导出，painter 与壳共用单一事实源）：`{ x: rect.x + rect.width − padding − 24, y: centerY − 12, width: 24, height: 24 }`，`centerY = rect.y + ROW_TOP_INSET + padding + lineHeight / 2`（与问题 1 文字锚**逐值相同**，Q2；`ROW_TOP_INSET` 自 constants.js 引入，editor.js 不依赖 cell-painters/painter）。因此按钮区中心与文字首行中心、树箭头中心共线，A1 的 0.5px 关系（相对内容区中心）对三者一致。常量 `EDITOR_BUTTON_AREA = 24`、`EDITOR_BUTTON_ICON_SIZE = 16`、`CELL_LINE_HEIGHT_FALLBACK = 18` 入 constants.js（跨模块镜像常量收拢惯例；后者为 --cell-line-height 镜像，editor.js 不可 import theme.js）。
- 绘制顺序：hover 高亮 → 编辑描边 → 树箭头主色 → 编辑按钮（最上层）。

**命中/光标**（壳）：
- `onClick`（canvas-table.vue:765）：现行顺序为 clickGuard → hitAt → 表头 → `record == null` 早退 → `!col` 早退（beyondCols 只选中行）→ 树槽 → `finishCellClick`。**编辑按钮判定插在「树槽判定之前、`!col` 早退之后」**（需要 `col` 与 `record` 均有效）：命中按钮区则调 `editorButton.onClick({ record, recordIndex: hit.rowIndex, column: col._raw ?? col })` → return（不选中行、不发 cell-click、不开编辑）。命中判定内联半开区间（与 interactions.isItemRectHit 同口径，避免新增跨模块导出）：`hit.x >= r.x && hit.x < r.x + r.width && hit.y >= r.y && hit.y < r.y + r.height`。
- `onPointerMove`（:642）：resolveCursor 结果后，指针在按钮区内 → `cursor.value = 'pointer'`（覆盖 resolveCursor 的 text/default）。
- 壳内私有 `editorButtonRectAt(hit)`：`cellRectAt(layout, row, col)` + `editorButtonRectOf(cell, { padding: snapshot.cellPadding, lineHeight: snapshot.cellLineHeight })`。

**涉及**：constants.js、editor.js、cell-painters.js、painter.js、canvas-table.vue、demo main-view.vue（备注列挂 pencil 图标夹具 + 事件日志）。

**备选路线**（补探索约束）：Path2D + DOMParser 解析 SVG path（平台标准但仓库零先例、outline 图标须换算 stroke 语义）与 `tabler-nodes-*.json` 数据源（tree-shaking 未验证、2.19MB 体积风险）均不采；`createImageBitmap`（浏览器支持未验证）不采。**若实施中发现 drawImage 路线受阻**（如 SVG data URL 在目标浏览器加载失败），回退验证步骤：先在 demo 页面控制台以夹具 SVG 实测 `new Image()` + data URL onload（本路线的唯一未验点），再考虑 Path2D 备选并按补探索「未验证」项补实测记录。

**风险**：图标 16px 在 36px 行内偏小可后调常量；按钮区与窄格文本重叠为 hover 态可接受表达；见 R5。

### 问题 6：布尔开关白色背景 + 同类核查

**根因**：`.mu-canvas-table__editor` 恒有 `background: var(--mu-bg-normal)`（scss:119）铺满编辑矩形；switch 40×20 不铺满 → 白块。borderless 形态（editor.border:false）同类：容器背景未被 `--borderless` 白名单清除（scss:155-158）。

**方案**（配合问题 3 后编辑矩形 = 整格，白块问题会加剧，一并治本）：
- **画布侧 veil**：paintState 新增 `editingCell: { row, col } | null`；`drawCellClipped`（painter.js:329，滚动区与固定区两个 pass 的共同入口）对命中格**跳过 `drawCell` 调用**（行背景照画），**并且必须显式清空该格命中组（`if (state.itemHits) setItemHitGroup(state.itemHits, row, colIndex, [])`）**——跳过 drawCell 后原收集逻辑不执行，若不显式清空，该格会残留上一次绘制的条目矩形，导致浮层下方仍可点中 link/button（veil 语义被破坏）。行背景带与格线不受影响。编辑期间画布内容不再与浮层叠影，容器即无遮蔽义务。
- **容器背景移除**：scss 删除 `.mu-canvas-table__editor` 的 `background` 声明。input/select/date/textarea 自带 `.mu-input` 底色（form/input.scss:3）覆盖整格；switch 与 borderless 输入浮在已清内容的行背景上（斑马/选中/hover 底色透出，真正「融入单元格」）。
- 壳接线（**顺序敏感，按此实现**）；壳内 `editingCellRef` 局部变量承载行列（editor 控制器不加字段）：
  1. `openEditorAt` 成功返回后：若 `editingCellRef` 非空（同一 tick 内先 commit 再开新格），**先 `invalidate({ cell: editingCellRef })` 恢复旧格内容**；再 `editingCellRef = { row, col }`、`paintState.editingCell = editingCellRef`、`invalidate({ cell })`。
  2. `watch(() => editor.state.editing)`：**仅当 `newValue == null` 时**执行「`invalidate({ cell: editingCellRef })` → `editingCellRef = null` → `paintState.editingCell = null`」。不可写成「任何变化都清除」——commit 与 open 落在同一 tick 时 watcher 只 flush 一次（old=A,new=B，两者均非 null），写成无条件清除会把新格的 veil 抹掉。editor 控制器的 `editing` 不含 row/col，故行列只能由本壳的 `editingCellRef` 承载。
  3. 卸载路径：`onUnmounted` 调 `editor.destroy()` → `state.editing = null` 会触发上述 watch（flush 前组件已卸载，`invalidate` 里 `painter` 尚未 dispose，属无害的空重绘）；无需额外分支，但 watch 回调内需 `if (!painter) return` 之类的空值防护（与 `invalidate` 现有 `painter?.` 写法一致，无新增风险）。

**同类核查结论**：MuInput/MuSelect/MuDateInput 的底色属输入控件设计底色、随浮层整格覆盖，非「多余背景」，保留；唯一同类问题即 borderless 容器背景，随容器背景移除一并消除。

**涉及**：painter.js（drawCellClipped veil 分支 + state 契约）、canvas-table.vue、canvas-table.scss。

**风险**：veil 期间编辑格 itemHits 为空 → 该格条目点击无命中，编辑期属预期；见 R4。**另一副作用**：编辑期间该格不绘制内容，若行高因外部数据变化重算（`recordsVersion` 等），veil 格会短暂显示空白、取消编辑后由 `invalidate({cell})` 恢复——与现状「编辑浮层遮住整格」等效，可接受。

### 问题 7：按钮/链接 hover 样式与光标

**DOM 基准**（link.scss / tag.scss）：链接 hover = 语义色变浅（`--mu-{semantic}-color-4`）+ 下划线；12 彩色 hover 同色仅下划线；disabled 无 pointer 事件；`.mu-tag` cursor default。canvas button pill 无 DOM 孪生（tag 同构轻量按钮）。

**方案**：
- **快照扩谱系**（decisions 未解#6 由设计者定：精确复刻 DOM hover 表达）：theme.js `readColors` 每色新增 `hover` 字段（**快照固定字段数不变，colors 内部扩展**——`snapshotsEqual` 的「20 固定字段」计数断言不受影响，需改的只有 colorsEqual 与 colors 形态断言）——语义 5 色取 `--mu-{name}-color-4`（root.scss:23-25 已定义 0–9 谱系）；12 彩色 `hover = color`（同色）。**取色方式必须用 `getComputedStyle(probe).getPropertyValue('--mu-{name}-color-4').trim()`（同 readFont:47），不能用 readVar**：`readVar` 是「赋 color 后读计算色」，变量不存在时该声明在计算值阶段失效、返回的是 probe 的继承色（一个合法颜色串），无法区分「未定义」与「定义为黑」→ 自定义主题裁剪该变量时 hover 会变成黑色。用原始串读取则未定义为 `''`，据此回退：`hover = raw || colors[name].color`。
- `colorsEqual`（theme.js:217）补 `hover` 逐色比较（否则换肤不触发重绘）。`--mu-{name}-color-4` 只在 `.mu-root` 定义、`.mu-dark` 未复写该谱系（root.scss 全文核验）→ 暗色下 hover 与明色取值相同，colorsEqual 的 hover 比较不影响明暗切换，仅对自定义主题生效；如需暗色专用 hover 属后续主题调整。
- **条目级 hover 通道**：壳新增 `hoverItem` 状态 `{ row, col, kind, index, disabled } | null`——`onPointerMove` 经既有 `resolveItemClick({ hit, itemHits })` 求值（itemHits 已含 link/button 矩形）；既有 `findHitItem`（interactions.js:351-359）只回落 `{ kind, index, row, col }`，须一并透传 `disabled: entry.disabled === true`（entry 即 itemHits 条目，`disabled` 已是布尔值，见下条；`=== true` 保证缺字段时得 false），否则 `hoverItem.disabled` 恒 undefined → disabled 链接/按钮仍变色、光标仍 pointer（A7 对应断言必假阳）。**接线位置（易踩坑，按此实现）**：hoverItem 的求值与失效必须写在 `onPointerMove` 内、`updateHover(hit)` **之外**——`updateHover`（canvas-table.vue:627-640）在 `isSameHover(prev,next)` 时提前 return，同格内从一个 link 移到另一个 link（或移出条目）不会触发它，若把 hoverItem 逻辑塞进 updateHover 就会漏掉这一整类变化。具体：先算 `nextHoverItem`（`hoverMode === 'none'` → null），与当前值比较（row/col/kind/index/disabled 全等则跳过），有变化则 `paintState.hoverItem = nextHoverItem` 后对 `[prevHoverItem, nextHoverItem]` 的 `{row,col}` 去重逐格 `invalidate({ cell })`（同格只重绘一次）；`hoverMode === 'none'` 时 hoverItem 恒 null（与编辑按钮同受总开关抑制）。`paintState.hoverItem` → `drawCellClipped` 仅在 hover 格传入 `{ kind, index, disabled }`。**`syncPaintState` 里须做总开关归一**：`paintState.hoverItem = props.hoverMode === 'none' ? null : hoverItem.value`——条目 hover 色是在表体 pass（`drawCell`）里画的，不受 `paintOverlay` 的 hoverMode 门控约束；若只在 pointermove 时清，用户拖动 hoverMode 下拉到 none 后（指针不动）条目仍保持 hover 色。
- **itemHits 条目增 `disabled` 字段**：`reportHitRect`（cell-painters.js:680，link/tag）与 `drawButton` 的 onItemRect（:1004）回报时携带 `disabled` **布尔值**（`reportHitRect` 现签名不含 item 之外的信息，需从其 `item` 参数读 `item.attrs?.disabled`；`drawLinkItems` 内的 `report` 函数（cell-painters.js:882-889，逐行回报）同样要带上——否则 link 竖排行的每条 link 都无 disabled 数据），谓词 = 既有 `isTruthyAttr`（cell-painters.js:752：`attrs.disabled != null && attrs.disabled !== false`；button 读 `button.disabled`）。与点击侧 `isDisabledAttr`（canvas-table.vue:870）同口径——三处（取色/命中/点击）判据必须一致，否则 disabled 条目在不同通道行为分裂。
- **link 悬停绘制**（cell-painters）：`linkHoverColorOf(item, theme)`——disabled → textColorMuted；语义色名 → `colors[name].hover ?? colors[name].color`；彩色/未知名 → `colors[name].color ?? primaryColor`（同色）。悬停时文字色换 hover 色，并在文字下方画 1px 下划线 `fillRect(x, underlineY, textWidth, 1)`，`underlineY = anchorY + Math.round(fontSize * 0.35) + 2`（`anchorY` = 该行的 middle 基线 y；fontSize 14 → +7px，落在行框内）。
  **两条 link 绘制路径都要带 hover 参数**（否则 A7 只覆盖一半）：
  - 竖排行：`drawLinkItems`（cell-painters.js:870-905）——每行 `drawLinkEntry` 传 `hover = hoverItem && hoverItem.index === i`，由 `drawLinkEntry`（:844）内部画下划线（它才知道 `x`/`width`/`y`）；
  - items 横排行：`drawItemText`（:734-748）——同样在拿到 `x`/`text`/`width` 后画线；
  - `drawLinkEntry` 与 `drawItemText` 共用 `linkUnderlineY(anchorY, fontSize)` 单函数（避免两处公式漂移）。
- **button 悬停绘制**：`drawButtonPill` 命中且非 disabled 时**反转**——底 `colored?.color ?? theme.primaryColor`、边框同底色、文字 `theme.bgNormal`（无需 alpha 工具，cell-painters 不得 import theme.js 的隔离约定下唯一可用的强反馈表达；深浅主题均可读）。
- **光标**：`onPointerMove` 中 hoverItem kind ∈ { link, button } 且非 disabled → `pointer`（tag 按 DOM 基准保持 default；check 条目无命中回报，本次不扩，见未解问题 2）。cursor 判定保持在壳（interactions.resolveCursor 签名不动，itemHits 是壳侧数据）。
  **覆盖顺序**：`resolveCursor` 的结果先赋给 `cursor.value`，随后按 hoverItem / 编辑按钮区覆盖为 `pointer`；**`col-resize` 与表头 pointer 不得被覆盖**（条目命中只可能发生在表体，但实现上仍应先判 `hit.resizeCol < 0 && !hit.isHeader`，避免列宽手柄区被条目覆盖）。
  **离开画布必须清理**：`onPointerLeave`（canvas-table.vue:658-661）现只调 `updateHover(null)`；须**追加清除 hoverItem 与其格重绘**（`paintState.hoverItem = null` + 对旧 `{row,col}` `invalidate({ cell })`），否则鼠标移出画布后该 link/button 仍保持 hover 色与下划线（区域不再重绘，永久残留），A7「移出后恢复」必失败。

**涉及**：theme.js、interactions.js（findHitItem/resolveItemClick 透传 disabled）、cell-painters.js、painter.js（hoverItem 透传）、canvas-table.vue、self-checks。

**风险**：下划线 y 为近似值（em 度量差异 ≤1px）；hover 色谱系变量若被自定义主题裁剪，回退 `?? color` 同色不破相。

### 问题 8：树排序 A 案——同级子节点内排序 + 成本量化

**口径**（decisions 检查点-人工2，A 案）：实现树排序——同级子节点内排序、不跨节点；demo 树场景数据源接排序产物；**组件侧不做树禁排**（前稿 tree 抑制三处取消）；树态排序箭头正常显示；成本实测作 A8 附件。

**组件方案**：**零改动**。排序仍是父级受控契约（`update:order-by` → 父级排 records → prop 引用替换 → 组件 watch 重建，探索报告机制不变）；树态排序箭头与表头命中判定维持现状（`drawHeaderCell` 按 `col.sortable` 画箭头 painter.js:539、`isSortableHeader` interactions.js:112 均无树态分支——本就不需要）。

**同级语义保证**（机制事实，tree.js）：父级对平铺数组整体排序后，`buildChildrenIndex` 同父子级按出现序收集（tree.js:41-64）、`buildFlatRows` DFS 按根序 + 子序展开（tree.js:107-136，子级逆序压栈、pop 出出现序，:85-91）→ 每级兄弟节点继承排序序、跨节点不混排。排序稳定性（ES2019+ Array.sort 稳定）保证同 key 兄弟保持原相对序。该保证以 self-checks/tree.js 纯函数断言固化（排序后重组：兄弟有序 + 父子结构不变）。

**demo 接线**（main-view.vue）：
- 抽取排序比较器为共享纯函数 `applyOrder(list, order = orderBy.value)`（`order` 为空原样返回 same ref，否则拷贝 + 按 `field:asc|desc` 排序，比较逻辑与现 `sortedRecords` :713-726 逐字相同）；`sortedRecords = computed(() => applyOrder(records.value))` 改用之（行为不变）。**显式 `order` 参数是成本夹具所必需**：夹具第 1 步会把 `orderBy` 复位为 `''`，若 `applyOrder` 只读 ref，则计时的是一次空排序（恒 0ms）。
- 新增 `sortedTreeRecords = computed(() => applyOrder(treeRecords))`；`stageRecords` `case 'tree'` 改 `return sortedTreeRecords.value`（:791）。`treeRecords` 保持 const 数组（无需 ref——排序经 computed 派生，**`applyOrder` 必须返回拷贝**，非破坏性：orderBy 清空即恢复原序；交叉审改 #11 的两处 `.value` 改造前提消失，`debugFlatRowsLength` :811/:816 直接引用维持不变，它仍按**未排序**原数组算平铺行数——**行数统计与排序无关（排序不改集合），故该调试值与实际平铺行数一致，无需改**）。
- 树开/树关均消费同一排序产物：树关后平铺展示排序序（与树开一致）；排序不改变 expandedKeys（展开态保持，flatRows 按 keys 重组）。
- 每次排序 records 引用替换 → 组件 watch（canvas-table.vue:1098-1103）滚动复位 + relayout + 整幅重绘——与默认场景排序行为一致，记为预期行为（A8 浏览器断言注明）。
- **调试夹具**：新增 `window.__ctStage = () => ({ records: stageRecords.value, treeProps: treePropsBind.value })`（与既有 `window.__canvasTable` 并列；后者是组件实例，不含舞台数据）。展开态仍走 `getTreeExpandedKeys()`。A8 的浏览器断言依赖它读排序后舞台数组——无此夹具则「同级有序、不跨节点」在页面层不可验证（`getTreeExpandedKeys` 只有 key 列表）。

**成本测量夹具**（A8 附件实测来源）：夹具控制「树排序成本测量」按钮（**async**）：
1. **先复位**：`orderBy.value = ''` → `await nextTick()`（否则若当前已是 `name:asc`，computed 不重算、prop 不变、不触发 watch，`lastRelayout` 会是旧值 → 读到上次数字）；
2. `const t0 = performance.now(); applyOrder(treeRecords, 'name:asc'); const sortMs = performance.now() - t0`（纯排序+拷贝耗时；**显式传 order**，与 ref 状态无关）；
3. `orderBy.value = 'name:asc'` → `await nextTick()` → `await nextTick()`（computed → 父组件重渲染 → 子组件 props 更新 → watch 内同步 relayout+redraw；两次 tick 覆盖跨 tick 情况）；
4. **有效性判据（先于读数字）**：用 `window.__ctStage().records` 检查舞台数据确实已排好序（抽样相邻项 `localeCompare` 非递减）——只有排序真的生效，`lastRelayout/lastPaint` 才是本次的产物；未生效则 logEvent 附 `stale: true` 并中止（不得记 0）。
5. 回读 `getLayoutInfo().lastRelayout.elapsed` / `.lastPaint.elapsed` → `logEvent('树排序成本', { sortMs, relayoutMs, paintMs })`。
注意：**不要用 `getLayoutInfo().lastRelayout === before.lastRelayout` 判新**——该函数每次 `{...lastRelayout}` 展开，引用恒不同，判据必假。（`__canvasTable` 与 `canvasTableRef.value` 同源，两者皆可。）

**成本量化结论**（A8 附件，机制数字 + 夹具实测回填，verifier 执行）：成本链 = 排序 O(n log n) + childrenIndex 重建 O(n) + flatRows DFS O(n) + relayout（估高全量重扫 O(n×cols) + Fenwick O(n) 重建）+ 整幅重绘 O(viewport)。n = 10003（demo 树场景 2000 根 + 8000 叶 + 3 深层）：排序比较 ≈ 1.33×10⁵ 次，纯排序预期 1–3ms；relayout + 重绘量级 5–20ms；单次排序总成本机制预期 **< 30ms**（非「过高」）。实测数字由夹具回填本节；若显著超出（>100ms）仅作记录与后续优化输入（A 案已定，不构成方案开关）。

**涉及**：demo main-view.vue（applyOrder/sortedTreeRecords/stageRecords/成本按钮）、self-checks/tree.js（同级排序重组断言）。组件源码零改动。

**风险**：见 R9（滚动复位）、R6（实测回填口径）。

### 问题 9（检查点补充）：空白区存在时末列右侧边框

**口径**（decisions 检查点-人工3 / A11）：表格宽度 > 列宽总和（存在空白区）时，末列（含列头）右侧绘制 1px 列边框，与既有列线同色同口径；无空白区时维持现状（末列右缘不画线）。

**事实**（painter.js 回查）：末列无线由两处 `if (c >= n - 1) break` 实现——表体 `paintColGridlines`（:382-395，线画在 `viewportColX(c) + colWidths[c] - 1`，y ∈ [headHeight, stickyHeight)）与表头 `paintHeaderColLineRange`（:615-626，break 在 :620，线由 `paintHeaderColLine`(:584-587) 画在 `viewportColX(c)+w−1`，y ∈ [0, headHeight−1)）；空白区判定所需字段已有：`layout.contentWidth`（= ΣcolWidths，layout.js:465 colsWidth）与 `layout.stickyWidth`（= 视口宽，layout.js:470）。空白区行背景已由 bandToX 扩展充满至视口右缘（paintCellRange :303-308），无需新增背景。

**方案**：
- 两处 break 条件改 `if (c >= n - 1 && !blankTail) break`，`blankTail = layout.stickyWidth > (layout.contentWidth || 0)`（三处消费点——drawCellClipped / paintColGridlines / paintHeaderColLineRange——均用这一表达式就地求值，不入 state；纯 layout 派生，避免新增 paintState 字段）。
- 线位/颜色/门控全部沿用既有列线口径：x = 末列右缘内 1px（同式 `viewportColX(n−1) + colWidths[n−1] − 1`）、色 = `theme.borderColorSoft`（表头段同）、受 `gridlines` 模式门控（all/column 画，row/none 不画——「与既有列线同口径」）；空白区本身不画任何线、不加背景。
- **与问题 1 的耦合**：该线画在末列矩形右缘内 1px，属「占用本格矩形」——`rightInset` 的表达式因此含 `|| blankTail`（见问题 1），末列居中内容随之下移 0.5px；`blankTail` 需在 drawCellClipped 与两处 gridline 绘制里用同一个派生式（`layout.stickyWidth > (layout.contentWidth || 0)`），不得各写一份不同口径。
- 边界：空白存在 ⇔ ΣcolWidths < 视口宽 ⇒ 无横向滚动（scrollLeft 恒 0），末列必在可视列区间内，两绘制循环可达；固定列场景末列为末个滚动列，滚动区 pass 正常绘制（fixedCount = n 的全固定极端形态由固定区 pass 覆盖，同式）。列宽拖拽使 Σ ≥ 视口宽后 blankTail 即时变 false，末列线消失（现状恢复），与行背景带收缩同帧。

**涉及**：painter.js（paintColGridlines、paintHeaderColLineRange 各一行条件 + 就地 blankTail）。

**风险**：无独立风险（1px 线，颜色/位置复用既有常量与公式；回滚 = 还原两处 break 条件）。

## 遵循约定与复用

提取自 01-explore.md「现有约定」与补探索：
- 分层：壳（canvas-table.vue 持状态/事件/DOM）+ 纯函数模块 + 有状态模块；决策纯函数化、emit/回调执行在壳（问题 5/7 的命中与回调全在壳；问题 8 排序执行在 demo 父级）。
- 模块隔离：editor.js ↛ layout/theme/cell-painters；cell-painters ↛ theme/layout（按钮 hover 反转因此不用 withAlpha）；例外沿用 painter→editor（editorRectOf/editorButtonRectOf）、painter→cell-painters（drawCell/drawTreeArrow/requestIconImage 新增）单向依赖。
- 单一事实源：hover 描边 = 编辑浮层矩形（editorRectOf）；编辑按钮区 = editorButtonRectOf（painter 绘制与壳命中共用，centerY 取问题 1 同一槽位式）；图标加载缓存 = requestImage；镜像常量收拢 constants.js（含 `CELL_LINE_HEIGHT_FALLBACK`）；**垂直锚 = 首行槽位单式**（cell-painters 全部绘制路径 + painter.paintTreeArrowAccent + editor.editorButtonRectOf 同参同式：ROW_TOP_INSET / cellPadding / cellLineHeight；四处 anchor = 文字基线锚，共用同一 `slotCenterY`，水平居中统一 `rect.x + (rect.width − rightInset)/2`）。
- 坐标口径：格线占用本格矩形的行顶 1px / 列右缘 1px（**末列在 blankTail 时同样占 1px**）；格线模式判定谓词（painter.isGridlineMode / editor 侧已删）。垂直锚定 = `rect.y + ROW_TOP_INSET + padding + lineHeight/2`（常量、与 gridlines 无关、所有行同式），与真实内容区中心差 0（无 row 线或 r=0）/0.5px（有 row 线且 r≥1）。
- 脏区重绘：hover/条目悬停/veil 均走既有 region 形状（cell/rows），壳侧 invalidate 恒 immediate。
- 性能优化不回退：text-wrap 共享缓存、hover 脏区去重、paintFixedArea 行区间收敛、估高扫描签名跳过均不动；新增开销仅限 hover 态（条目悬停单格重绘、编辑按钮 drawImage）。
- 主题色/尺寸经探针快照（问题 7 扩 colors[].hover）；canvas 侧禁硬编码色值（下划线/反转色全取快照字段）。
- 树排序同级语义依赖 tree.js 既有重组不变量（childrenIndex 收集序 + DFS），以 self-checks/tree.js 断言固化，不改 tree.js 本身。
- 自检：断言按源码模块对应放 `demo/src/data/canvas-table/self-checks/<module>.js`，像素断言 getImageData 数暗像素（withCanvas/assertPixel/darkBoundsOf 惯例）；运行时面板 `runChecks` 聚合。
- eslint 基线 0/0；纯 JS、BEM、`--mu-*` 变量。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
|---|---|---|
| src/components/canvas-table/constants.js | 新增 `ROW_TOP_INSET = 1`（行顶内容内缩，与 gridlines 无关）、`EDITOR_BUTTON_AREA = 24`、`EDITOR_BUTTON_ICON_SIZE = 16`、`CELL_LINE_HEIGHT_FALLBACK = 18` | 问题 1（ROW_TOP_INSET 被 cell-painters/painter/editor 三处共用，editor 不可 import cell-painters）+ 问题 5 跨模块常量收拢；lineHeight 回退供 editor.js（不可 import theme.js）与 painter 槽位锚共用。cell-painters 既有本地 `FALLBACK_LINE_HEIGHT`（:57）与 row-geometry 的 `LINE_HEIGHT_FALLBACK` 保持不动（值一致），避免 G1-a/G1-b 交叉依赖 |
| src/components/canvas-table/editor.js | 新增 import `{ CELL_PADDING_FALLBACK, CELL_LINE_HEIGHT_FALLBACK, ROW_TOP_INSET } from './constants'`（现无 constants 依赖）；NON_EDITABLE_TYPES 补 link/button/progress；删 EDITOR_GAP/gridlineShows；editorRectOf 恒等矩形（**删 topGridline/rightGridline 参数**）；computeEditorStyle 删 gridlines/theme 参；resolveEditorType 删 link 分支；新增 editorButtonRectOf（centerY = 首行槽位式） | 问题 3/4/5 |
| src/components/canvas-table/cell-painters.js | drawCell 增 rightInset/hoverItem 参与 box 构造；新增 import `ROW_TOP_INSET`（constants.js）作为垂直锚基数；**全部垂直锚统一为 box.y + padding + lineHeight/2**（单行/树箭头/items/progress/button/多行首行同式）；center 水平基准扣 right inset；多行后续行 +lineHeight；删 multilineBlockTop（**不增 withCellClip**）；requestIconImage 导出；linkHoverColorOf + link 悬停下划线；drawButtonPill 悬停反转；itemHits 条目 disabled 字段；模块头注释同步 | 问题 1/5/7 |
| src/components/canvas-table/painter.js | 新增 import `CELL_LINE_HEIGHT_FALLBACK`、`ROW_TOP_INSET`（现仅 CELL_PADDING_FALLBACK 等；**cell-painters 用自身既有本地 `FALLBACK_LINE_HEIGHT`，值同为 18**）；drawCellClipped 注入 rightInset（非末列或 blankTail，受 gridlines 列线门控）/hoverItem；paintTreeArrowAccent 用 ROW_TOP_INSET 常量；paintTreeArrowAccent centerY 改首行槽位式（与 cell-painters 同源常数）；paintHoverEditorStroke 整格描边（editorRectOf 无参）；paintEditorButton；drawCellClipped veil（editingCell，跳过内容 + 显式清空 itemHits）；paintColGridlines/paintHeaderColLineRange 增 blankTail 末列线；state 契约注释（hoverItem/editingCell、itemHits 条目含 disabled） | 问题 1/3/5/6/9 |
| src/components/canvas-table/interactions.js | findHitItem/resolveItemClick 透传 disabled（问题 8 树禁排改动取消，签名维持现状） | 问题 7 |
| src/components/canvas-table/theme.js | readColors 每色增 hover（语义 −4 / 彩色同色）；colorsEqual 补 hover | 问题 7 |
| src/components/canvas-table/canvas-table.vue | paintState 增 hoverItem/editingCell（syncPaintState，hoverItem 在 hoverMode=none 时归一为 null；**无 tree 字段、无 topAlignCols 字段**）；onPointerMove 内（updateHover 之外）算/失效 hoverItem、onPointerLeave 清理、光标覆盖；onClick 编辑按钮命中（!col 早退之后、树槽之前）；openEditorAt/编辑关闭 watch 的 veil 接线（仅 null 时清）；computeEditorStyle 调用删参 | 问题 1/3/5/6/7 |
| src/components/canvas-table/canvas-table.scss | header-shadow top → calc(var(--head-row-height, 36px) + 1px)；__editor 删 background 并改注释（原「格矩形四周内缩 EDITOR_GAP 4px」「背景遮蔽 canvas 内容防叠影」两句随问题 3/6 作废，改记「矩形 = 整格；内容遮蔽由画布侧 veil 承担」）；padding 补偿基数 5→1px（input/textarea）、`border-radius: 0`（方角贴格格缘）及注释（textarea「首行顶对齐」注释按 Q2 统一槽位更新为「首行文字顶」表述） | 问题 2/3/6 |
| demo/src/data/canvas-table/main-view.vue | 链接列摘除 editor 配置；memo 列 editorButton 夹具（~icons/outline/pencil.svg + logEvent）；抽取 applyOrder + sortedTreeRecords computed + stageRecords case 'tree' 接排序产物 + 「树排序成本测量」按钮（程序化 orderBy 触发真实管线）+ `window.__ctStage` 调试夹具（A8 页面断言数据源） | 问题 4/5/8（A 案接线 + A8 量化与可验证性） |
| demo/src/data/canvas-table/self-checks/editor.js | 改写：NON_EDITABLE（link/button/progress 反转）、editorRectOf 恒等、computeEditorStyle 整格矩形期望值、textarea 数组开值改由 text 列承接（:709-777）、:108 的 text/link 表述收窄；新增 editorButtonRectOf（right-align + centerY = ROW_TOP_INSET + padding + lineHeight/2）断言 | A3/A4/A5 断言同步 |
| demo/src/data/canvas-table/self-checks/cell-painters.js | **夹具 `THEME_COLORS` 每色补 `hover` 字段**（现仅 color/translucent；不补则 `colors[name].hover` 恒 undefined → link 悬停色断言读到普通色，测试恒假）；改写锚点断言组：**:661 [21,39]→[18,36]**、**:684 [22,40,58]→[18,36,54]**、**:720 [21,39]→[18,36]**、**:851 [17,35,53,71]→[18,36,54,72]**（h=88 → 旧块顶 max(8,(88−72)/2)=8 → 17；新槽位 18）、**:667 单行锚 18 不变**；新增：水平 rightInset（1 → x=79.5，0 → x=80）；垂直锚 18（ROW_TOP_INSET 内建，所有调用同值）、requestIconImage/linkHoverColorOf/按钮反转断言 | A1/A5/A7 |
| demo/src/data/canvas-table/self-checks/painter.js | 新增树夹具（treeNode 列 + flatInfo + variable rowGeometry，见 A1/A3 行）；改写：描边贴缘断言（:757-791，删 EDITOR_GAP 具名导入与 4px 采样假设，改为采样格缘 x/y 与 x+1/y+1 两侧）；**:925 R4a/R4b 逐字不改**（painter 路径注入 行顶内缩（常量 1），row 0 槽位锚 = 36+1+8+9 = 54 = 内容区中心，与现状一致；R4b 两路径同为 54）；新增：**树箭头 hover 主色三角与常态三角同 y** 的像素断言——**painter 自检现无树夹具**（`makeState` 无 flatInfo/树列，见 :85-125），需新造：columns 加一条 `{ field: 'name', treeNode: true, width: 140 }` + `flatInfo: { levels: [0, 0], hasChildren: [true, false] }` + `layout.rowGeometry = createVariableRowGeometry({ initialHeights: [36, 60] })`（row 1 高 60，与 36 差 24，足以放大改前错位）：① 无 hover 绘制，`darkBoundsOf` 取树列箭头槽矩形内常态三角（textColor，lum<150）的 bbox.centerY；② 同 state 加 `hover:{row,col}`，取同槽内主色三角（primaryColor 邻近色判定）bbox.centerY；③ 两者差 ≤1px（改前差 = 该行 h 与 36 的偏移量的一半，远超容差）、veil、link 悬停色、编辑按钮绘制调用（像素归浏览器）、blankTail 末列线（有/无空白两态 + gridlines row 模式不画）、**blankTail 时末列右缘 1px 计入 rightInset（水平居中锚随之下移 0.5px）** | A1/A3/A5/A6/A9（问题 9） |
| demo/src/data/canvas-table/self-checks/interactions.js | resolveItemClick 返回含 disabled（true/false 两态；树态抑制断言取消——问题 8 零改动） | A7 |
| demo/src/data/canvas-table/self-checks/theme.js | 新增：colors[].hover 字段断言（语义色非空且不等于 color、彩色 hover === color、未定义变量回退 color）；colorsEqual（现 snapshotsEqual:419 块）补 hover 维度（单色 hover 变化判不等）；**既有「colors.17 色 color+translucent 双形态」块（:303）的字段集合断言需放开为含 hover**（若写成枚举键名会误红） | A7 |
| demo/src/data/canvas-table/self-checks/tree.js | 新增：平铺数组排序 → buildChildrenIndex + buildFlatRows 重组后兄弟有序、父子结构不变（不跨节点） | A8 |

不改动：layout.js（contentWidth/stickyWidth 已有所需字段）、**row-geometry.js（整文件——列分类通道删除后无问题 1 改动，行高公式与估高/精算管线本就不动）**、self-checks/row-geometry.js（既有断言不改）、text-wrap.js、tree.js、use-tree-rows.js、row-geometry-controller.js、use-column-resize.js、DOM 参照样式（link.scss/tag.scss）。

## 接口 / 数据结构

```js
// constants.js（新增）
export const EDITOR_BUTTON_AREA = 24     // 编辑按钮命中/绘制区（镜像 CHECK/SORT 18~16 规格邻域取整）
export const EDITOR_BUTTON_ICON_SIZE = 16
export const CELL_LINE_HEIGHT_FALLBACK = 18   // --cell-line-height 镜像（editor.js 不可 import theme.js）
export const ROW_TOP_INSET = 1                // 行顶内容内缩 1px（常量，与 gridlines 无关；cell-painters/painter/editor 共用）

// editor.js
export const NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check', 'link', 'button', 'progress']
export function editorRectOf (rect)            // → { left: rect.x, top: rect.y, width: rect.width, height: rect.height }
export function editorButtonRectOf (rect, { padding = CELL_PADDING_FALLBACK,
  lineHeight = CELL_LINE_HEIGHT_FALLBACK } = {})
// → { x: rect.x + rect.width − padding − 24, y: centerY − 12, width/height: EDITOR_BUTTON_AREA }
//   centerY = rect.y + ROW_TOP_INSET + padding + lineHeight / 2   // 与问题 1 文字锚逐值相同（Q2）
export function computeEditorStyle ({ colIndex, rowIndex, colLefts, colWidths, headHeight, scrollTop,
  scrollLeft, fixedCount, rowGeometry, editorType, border })   // 删 gridlines/theme；矩形 = 整格；bordered 逻辑不变
export function resolveEditorType (column, { rawValue, record })  // text 分支不再含 link

// row-geometry.js：零改动（topAlignColumnsOf 通道已删除，decisions 检查点-通道；
//   [检查点-Q1] 谓词答复留档 decisions 备查：选项 1 = 配置级 maxLines>1/multiline
//   + 任意列数组值检测、SINGLE_LINE_TYPES 恒 false、数据源 props.records 全量）

// cell-painters.js
export function requestIconImage (icon, color, onLoad) // → 缓存条目 { image, status }（透传 requestImage 返回值，自检可断言同参复用同一条目）
// icon 含 '<svg' → currentColor→color 替换 + data URL；否则视为 src；→ requestImage 条目（复用 imageCache）
export function drawCell (ctx, { col, record, recordNumber, emit, rect, theme, onImageLoad, row, flatInfo,
  expandedKeys, recordKey, measure, wrapCache, onItemRect, placeholder,
  rightInset = 0,   // 0|1 新增：本格右缘列线占用（painter 注入，缺省 0）
  hoverItem })      // { kind, index, disabled } | null 新增：仅 hover 格由 painter 注入（条目悬停着色）
// 锚点口径（唯一公式，所有列同式，无列分类参数——检查点-通道）：
//   centerY = rect.y + ROW_TOP_INSET + padding + lineHeight/2   // 模块常量 = 1，与 gridlines 无关
//     （单行/树箭头/横排 items/progress/button/多行首行同式；不使用 rect.height）
//   多行后续行 += lineHeight
//   水平居中 x = rect.x + (rect.width − rightInset) / 2（items 再减 offset）
//   rightInset 含 blankTail 时末列也扣 1px（与问题 9 同源）
// itemHits 条目：{ kind, index, rect, disabled }（新增 disabled；rect 仍为整格矩形）

// painter.js paintState 契约扩展
// - hoverItem: { row, col, kind, index, disabled } | null   条目悬停（drawCellClipped 按 hover 格注入；hoverMode none 时恒 null）
// - editingCell: { row, col } | null    veil：编辑中格跳绘内容
// （无 tree 字段——问题 8 组件侧零改动；无 topAlignCols 字段——列分类通道删除，检查点-通道）
// paintTreeArrowAccent：centerY = viewportRowY(layout, row) + ROW_TOP_INSET + cellPadding + cellLineHeight / 2（同槽位式）
// drawCellClipped 注入（行顶 1px 为 cell-painters 内常量 ROW_TOP_INSET，不经 state）：
//   rightInset = (非末列 || blankTail) && gridlines 含 column ? 1 : 0
// paintColGridlines / paintHeaderColLineRange：break 条件改 `c >= n - 1 && !blankTail`
//   （blankTail = layout.stickyWidth > (layout.contentWidth || 0)，就地求值；问题 9 末列线）

// theme.js
// colors[name] = { color, translucent, hover }   // 语义色 hover = --mu-{name}-color-4；彩色 hover = color

// interactions.js（签名维持现状，仅返回形状扩展）
export function resolveItemClick ({ hit, itemHits })     // 返回 { kind, index, row, col, disabled }（新增 disabled）
// isSortableHeader / resolveCursor / resolveHeaderClick 不动（问题 8 树禁排取消）

// demo main-view.vue（问题 8 A 案接线）
// function applyOrder (list, order = orderBy.value)  // 排序比较器抽取（sortedRecords 原逻辑；显式 order 供成本夹具）
// const sortedRecords = computed(() => applyOrder(records.value))
// const sortedTreeRecords = computed(() => applyOrder(treeRecords))
// stageRecords case 'tree': return sortedTreeRecords.value
// onMeasureTreeSort (): 复位 orderBy → applyOrder 计时（显式传 'name:asc'）→ 设 orderBy → 两 tick → 校验舞台已排序 → 读 getLayoutInfo → logEvent
// window.__ctStage = () => ({ records, treeProps })   // 舞台数据快照（A8 排序断言/成本夹具数据源）

// 列定义（用户 API，问题 5）
// column.editorButton = { icon: String(SVG 标记 | 图片 URL), onClick: ({ record, recordIndex, column }) => void }
```

## 被拒绝的备选

1. **图标绘制走 Path2D + DOMParser 解析 SVG path**：平台 API 标准但仓库零先例（补探索：全仓库 0 命中），outline 图标为 stroke 型须自实现 viewBox 缩放与 lineWidth 换算，复杂度高于 drawImage；且补探索明示优先已有先例路线。改为 drawImage + requestImage（`drawCellImage`/`requestImage` 完整先例：缓存、crossOrigin、onload → invalidateCell 联动）。`createImageBitmap`（Firefox/Safari 支持未验证）与 `tabler-nodes-*.json` 具名导入（tree-shaking 未验证、整文件 2.19MB 风险）均不采。
2. **问题 1 在 painter 侧直接缩减格矩形（含宽度 −1px）**：宽度缩减会使绘制折行宽与估高 `contentWidthOf` 失配 1px，「行高公式 = 绘制占位」强耦合被破坏（探索报告风险节明示）。改为仅缩 y/height（垂直自动修正）+ center 锚公式补偿水平，宽度不动。
3. **问题 1 多行列分类用严格数据级判定**（maxLines 列仅当实际折出多行才 top，逐格看真实行数）：字符串估高为 1 行下界（row-geometry.js:99-100），进窗精算前行数未知 → 列分类随滚动/精算回填翻转（先居中后跳 top），且同列异格锚不一致。改为配置级（maxLines>1/multiline）+ 数组值数据检测（真值可静态判定）；该口径为 decisions 检查点-Q1 选定项（选项 1）。**注：列分类通道已整体删除（见末条），本条留存「数据级判定被拒」的理由备查，供日后按留档答复加回通道时参照。**
4. **问题 1 超高行非多行列按实际行高内容区居中**（前稿默认项，即「其余列按内容区中心垂直居中」的字面解）：与人工原文「非多行列内容按在默认行高中居中的位置」及跨列 top 对齐诉求不一致；decisions 检查点-Q2 改取选项 2（统一首行槽位，超高行内容偏上）。
5. **问题 6 给编辑容器传行底色**（选中/斑马/hover 组合色传入 computeEditorStyle）：组合态枚举复杂且半透明 hover 混色仍色差。改为 veil（编辑格内容跳绘）+ 容器透明，任何行底色天然透出。
6. **问题 7 hover 表达用下划线替代色变**（不动主题快照）：与 DOM 版 hover 表达（色变 + 下划线）不一致。改为扩快照 `colors[].hover` 精确复刻。
7. **问题 5 图标名查 `icons` 注册表**（src/index.js:65 导出 map）：canvas-table 对 icons 模块新增硬耦合，且注册表条目依赖使用方 installIcons 完整性。改为 icon 值直接给 SVG 串/URL，demo 用已验证 `~icons` import 通路供串。
8. **问题 8 组件内实现树排序**：排序为父级受控契约（orderBy prop 仅显示意图，探索报告明示契约变更风险）；A 案所需「同级内排序」由父级平铺排序 + tree.js DFS 重组天然达成，组件无需感知树排序。改为 demo 接线（applyOrder/sortedTreeRecords）。
9. **问题 8 成本夹具用 treeRecords 改 ref + 赋值测量**（前稿方案）：破坏性赋值（原序不可恢复）且测量路径与用户真实路径（computed → prop → watch）不同构。改为程序化设 orderBy 触发真实管线 + applyOrder 拷贝单独计时。
10. **问题 9 在空白区补画满网格/背景**（末列右侧再画虚拟列或延伸行线）：超出需求（「最后一列增加单元格右侧边框」）；行背景已充满视口（bandToX），空白区无线是现状合理表达。改为仅末列右缘 1px 线（两处 break 条件加 blankTail）。
11. **问题 1 保留列分类通道（topAlignColumnsOf → paintState.topAlignCols → drawCell topAlign）**：统一槽位锚下 true/false 输出逐值相等，属「算出分类 → 透传 → 参数不被使用」的死链路（06-amend-2 异议 3，语义空洞、易被误认为切换有效）。decisions 检查点-通道 裁决删除；[检查点-Q1] 谓词答复（选项 1）留档 decisions 备查，日后需要按列差异对齐时按该答复加回。

## 风险与回滚

- **R1 多行锚定口径反转（统一首行槽位）**：多行三路径由「块整体居中」改为「首行槽位锚 + 逐行顺排」，估高/行高公式全程不动 → 无布局跳动、无越界裁剪（行高公式 `max(rowHeight, padding×2 + lines×lineHeight)` 保证 top 块底 = padding + n×lineHeight ≤ 行高，**不引入 withCellClip**）。回滚点 = drawTextValue/drawArrayLines/drawLinkItems 三处首行锚 + multilineBlockTop 恢复，行高公式与估高管线零连带。R4b 既有断言（self-checks/painter.js:951-956「数组路径与省略路径对齐」）**数值与文本均不变**（painter 路径行顶恒 +1（ROW_TOP_INSET），两路径同为槽位 54）。**cell-painters 直调自检**的单行锚仍为 18（`:667` 不改），多行锚由块居中改为槽位起排（:661/:684/:720/:851 改写）。
- **R2 描边/浮层矩形断言面**：问题 3 推翻 20261025 固化的像素断言（self-checks/painter.js:757-791、self-checks/editor.js:422-514、:516-550），断言改写与实现必须同批落地，否则 A9 红。实施步骤将两者绑在同一并行组后的集体验证。
- **R3 veil 时序**：编辑开启（invalidate cell）与关闭（invalidate cell）任一遗漏 → 编辑格内容残缺/残空。两处接线集中在 canvas-table.vue（openEditorAt + editing watch），自检以像素断言（编辑格无文字像素/关闭后恢复）覆盖。
- **R4 itemHits 形状扩展**（+disabled）为向后兼容 additive；消费方 resolveItemClick/自检按 kind/index 不受影响。
- **R5 图标异步首绘**：首次 hover 到图标显示隔一次 onload → invalidateCell（img 列同款行为）；SVG data URL 无跨域问题。若目标浏览器 SVG data URL 加载异常（唯一未验点），按问题 5 备选验证步骤处置。
- **R6 树排序成本结论回填**：机制预期 < 30ms/次（n=10003，问题 8 节成本链）；实测数字经 demo 夹具回填（verifier）。A 案已定，实测若显著超出（>100ms）仅作记录与后续优化输入（估高扫描签名跳过已保证同引用不重扫；排序产物必为新数组、每次排序一次 O(n×cols) 重扫为固有成本），不构成方案开关。
- **R7 编辑态首行一致性**：画布任意列首行行框顶 = 格顶 + ROW_TOP_INSET + padding（恒为格顶 + 9）；textarea 首行顶 = 格顶 + 边框 1 + (padding − 1) = 格顶 + padding（格顶 + 8）→ **两者恒差 1px（所有行、所有 gridlines 模式）**；进出编辑态无 lineHeight 级跳变。scss textarea「首行顶对齐」注释恢复并更新表述（见问题 3）。**Q2 统一槽位下非多行列单行文本首行顶同此式（内容区顶 + padding）**，与 textarea 首行顶的一致性对整个表格成立，非仅多行列。
- **R11 hoverItem 与滚动/数据替换的陈旧性**：hoverItem 只在 pointermove 时求值；若指针不动而内容滚动或 records 替换，`hoverItem.index` 可能与新渲染的条目错位（旧行号落在新行上）。**与现状 hover 高亮的陈旧性同类**（hover 也是 pointermove 才更新），不新增缺陷面；实现上可在 `onScroll` 已有节流回调里顺手把 `hoverItem` 置 null（代价极小，建议做，非必须）。
- **R9 树排序滚动复位**：排序产物为新数组 → records 引用替换触发组件 watch（canvas-table.vue:1098-1103）滚动复位 + relayout + 整幅重绘，与默认场景排序行为一致，记为预期行为（非缺陷）；A8 浏览器断言按此预期编写。
- **R10 Q2 槽位锚的可见偏移**：①**无**（所有 `gridlines` 模式下默认行高单行锚均为 18，与改前逐值相同——ROW_TOP_INSET 与模式解耦）；②超高行（行高被多行列内容撑大）中**所有列**——含单行文本、tag/check/img items、progress 轨道、button pill、树箭头、编辑按钮——贴行顶起排（与多行首行对齐），与内容区中心的偏移可远大于 0.5px（默认行高下 r=0 为 0、r≥1 为 0.5px）。②是终版口径（decisions 检查点-Q2「同一 row 内 A、B 列 top 文本行对齐」+ 检查点-A1判据「按默认行高区域居中」）的直接结果，不是缺陷。A1 断言按此写：默认行高下垂直残差 0（r=0 或 gridlines 不含 row）/0.5px（r≥1 且含 row）；超高行只断言**跨列首行同高**（不设与内容区中心的差）。
- 回滚单元小：问题 2（scss 一行）、问题 4（清单一行 + demo 夹具）、问题 8（demo 三处接线 + 断言，组件零改动）、问题 9（painter 两处 break 条件 + rightInset 的 `|| blankTail` 项）可独立回退；问题 1（ROW_TOP_INSET + 7 处垂直锚 + 2 处水平锚）与问题 3 涉及断言联动需整组回退；问题 5/6/7 各自独立（veil 与容器背景两处绑定）。

## 测试计划（A1–A11）

自检断言全部落 `demo/src/data/canvas-table/self-checks/`（惯例：模块对应、withCanvas/assertPixel/darkBoundsOf）；运行验证走 http://localhost:3000/data/canvas-table/（等 watch 重编译）。

| 验收 | 手段 | 检查方式 |
|---|---|---|
| A1 垂直槽位锚 + 水平内容区中心 + 多行列整列 top | 自检（主）+ 浏览器 | **前置：demo「行高覆盖」开关必须关闭（默认 36px）——该开关为 48px 时槽位锚不变、内容偏上 6.5px 属终版口径预期（检查点-A1判据「按默认行高区域居中」），见问题 1**。**判据公式（与问题 1 单一公式逐项对应，即 A1 终版判据——decisions 检查点-A1判据，verifier 按此判、不按 00-task「= 内容区几何中心」字面读法；self-check 夹具 theme = cellPadding 8 / cellLineHeight 18）**：垂直 `y = box.y + 8 + 9`，水平居中 `x = box.x + (box.width − rightInset) / 2`。自检（精确，ctx stub 记录 fillText，无容差）：① 单行 rect `{0,0,160,36}`、**`align: 'center'`**、`rightInset:0` → **y = 18**（= 改前 `rect.y+h/2`，零回归）、x = 80；`rightInset:1` → y 仍 18、**x = 79.5**（内容区水平中心，精确）；**同 fixture 改 `align:'left'` 应 x = 8（不受 rightInset 影响，防误改 left 分支）**；② 多行首行 y 同式、与行高无关：height 60 → [18,36]、height 80 → [18,36,54]、link 竖排 height 88 四行 → [18,36,54,72]（**首行恒为 `rect.y + 1 + 8 + 9 = 18`**），后续行 +18；③ :667 单行锚 18（**不变**）。**残差关系显式写入断言注释**：`rect{0,0,W,36}` 直调 → 锚 18，按 A1「不含边线」算的 r≥1 情形内容区中心 18.5 → **偏上 0.5px**（唯一残差，终版判据授权 ≤0.5px）；**painter 路径 row 0** → 锚 54 = 真实内容区中心 54 → **残差 0**；`gridlines` 为 none/column 时所有行格内无行线 → 锚 18 与中心 18 → **残差 0**。像素（辅助，容差 ±2px，同 :945 先例）：r≥1 行墨迹中心与内容区中心之差 ≤2px——只能作粗回归，精确判据在 ctx stub。浏览器（**判据以差值为准，绝对值只作粗界**）：① 跨列 top 对齐（Q2 核心）——multiline 场景同一行内，多行列（「maxLines=3」等）首行墨迹 top 与「名称」列单行墨迹 top 之差 ≤3px，抽样 row 0/1/2；② 列内一致——multiline 场景「maxLines=3」列内 row 2（记录 id=3，值 '短文本' 单行）与 row 0（LONG_TEXT 折 3 行）各自首行墨迹 top 相对各自格内容区顶的偏移差 ≤3px（**注意 row 2 的 long10 列仍是多行，故该行整体为超高行**）；③ 首行贴顶粗界——多行列首行墨迹 top − 格内容区顶 − cellPadding ∈ [−2, +5]（baseline middle 下字形上缘内缩，故不取等号）；④ 默认行高居中回归——**default 场景**（行高 36 的行，row 0/1）单行墨迹中心与格真实内容区中心之差 ≤2px（残差 r=0 为 0、r≥1 为 0.5px；墨迹 bbox 噪声远大于 0.5px，本条只作粗回归）；**超高行（multiline 场景中被子列多行撑高的行）不适用本条**——该处所有列内容按终版口径贴行顶，与内容区中心相差可达十几 px，属预期（R10 ②；超高行按 decisions 检查点-A1判据 只验跨列首行同高，00-task「其余列按内容区中心」字面读法已被取代） |
| A2 阴影位置 | 浏览器 | 默认场景滚动 >0.5px 后，三项：① **DOM 位置**——`.mu-canvas-table__header-shadow` 的 `offsetTop`（offsetParent = `__overlay`）== `getLayoutInfo().headHeight + 1`（**不可与 `getCellRect(0,0).y` 比较**——后者 = headHeight − scrollTop，滚动后必然不等）；② **header 内部无阴影**——采样 y ∈ {10, 20, 30}（避开表头文字）的像素与「未滚动帧」逐点相等（阴影出现前该区为 bgFill）；③ **hairline 落在 header 之下**——y = headHeight 与 headHeight+1（36、37）的像素与未滚动帧不同（`0 0 0 1px` spread 使 0 高度条覆盖 [headHeight, headHeight+2)）。**y = headHeight−1（35，header 底边框行）不强断言**：`--mu-shadow-float` 的 `0 1px 2px / 0 2px 4px` 两项有模糊半径，会在 36 之上留下 ≤2px、alpha < 0.02 的极淡溢出（改前 top:0 时该行被完整 hairline 覆盖，改后只剩溢出），像素比对会落入噪声区；判据以 ①②③ 为准（`+1px` 的目的正是把完整 hairline 从 35 移到 36） |
| A3 描边/浮层覆盖 | 自检 + 浏览器 | 自检：editor——editorRectOf 恒等（四值 = 格矩形）、computeEditorStyle 矩形 = 整格（fixed 夹具 row1/col0、scrollTop 8 → `[0,64,100,36]`；scrolled 夹具 row0/col2、scrollLeft 250 → `left = 300−250 = 50`、`top = 36 + 0 = 36`、`width = 80`、`height = 36`；变高行 row1 h=100 → `[100,72,200,100]`；heightAt=0 → height 0 保持）；painter——描边 = 整格矩形 1px 内描边，**必须按 5 条边分开给期望值**（gridlines 默认 all、hoverMode row、行 1 便于覆盖行线重叠）：
  - 左缘 `(cellX, midY)`：`blend(primary@0.45, blend(hoverBg, bgNormal))`；
  - 顶缘 `(midX, cellY)`（r≥1）：`blend(primary@0.45, blend(hoverBg, borderColorSoft))`——顶像素行同时是本格顶行线，三重混合；
  - 右缘 `(cellX+w−1, midY)`：同为三重混合（本格右缘列线）；末列且 blankTail 时同样成立；
  - 底缘 `(midX, cellY+h−1)`：`blend(primary@0.45, blend(hoverBg, bgNormal))`（行线画在下一行顶 `cellY+h`，在本格外）；
  - 内邻 `(cellX+1, midY)` / `(midX, cellY+1)`：无描边像素（= hover 带色；**采样点须避开该格文字/条目墨迹**，否则会读到内容像素造成假红）；
  - 外邻 `(cellX−1, midY)`：前一列右缘列线叠 hover 带 = `blend(hoverBg, borderColorSoft)`（painter.js:382-395 线画在前列右缘）；**原断言「(cellX−1) 为行带」不成立**。
  row 0 另断言一次「顶缘不与 header 底边框重叠」：`(midX, cellY)` = `blend(primary@0.45, blend(hoverBg, bgNormal))`（格内无行线）、`(midX, cellY−1)` = `borderColorSoft`（header 底边框，未被描边覆盖）。改写 :757-791（删 EDITOR_GAP 引用）。浏览器：hover 备注列格描边贴格线（截图可选）；点击开编辑：`.mu-canvas-table__editor` getBoundingClientRect 与 `getCellRect(row,col)` 四边相等（`left/top/width/height` 全等，容差 0.5px）；**input/textarea 的 computed `border-radius` 为 `0px`**；input 内文字左缘 = 格左 + cellPadding |
| A4 展示型不可编辑 | 自检 + 浏览器 | 自检：editor——link/button/progress 配 editor 仍 isCellEditable false、open 返回 false；NON_EDITABLE_TYPES 数组断言。浏览器：items 场景点击链接/按钮/进度/标签格，DOM 无 `.mu-canvas-table__editor` 出现（夹具已摘 link 编辑配置，此处仅冒烟；排除清单判定以自检为准） |
| A5 自定义编辑按钮 | 自检 + 浏览器 | 自检（同步可断言部分）：editor——editorButtonRectOf 几何（right-align：x = 格右 − padding − 24；**centerY = 格顶 + ROW_TOP_INSET + padding + lineHeight/2，与 A1 同一槽位式**，显式断言该式而非 rect.height/2）；cell-painters——requestIconImage：`currentColor`→色值替换、data URL 前缀、**同参二次调用返回同一缓存条目**（函数返回条目对象，`requestIconImage(a,c,f) === requestIconImage(a,c,f)`）、返回条目 `status === 'loading'` 且 `image.crossOrigin === 'anonymous'`、非 SVG 串按 src 直通（`getImageEntry(该串)` 可查到）。**SVG 串须每次运行唯一**（如拼入 `Date.now()` 或随机 fill 值）——imageCache 是模块级 Map，跨检查持存，固定串会让第二次运行直接命中 loaded 条目，`loading` 断言假红；painter——**图标未 onload 前不半绘制**：构造两帧同一 hover 态（同一 row/col、同为 editorButton 列），一帧列配置 `editorButton.icon` 且图标首次加载（status loading），另一帧列无 `editorButton`；断言两帧按钮区 24×24 像素逐点相等（证明未 onload 时该区未画任何东西、也未抛错）。**不可与「无 hover 帧」比较**（hover 高亮本身会改变该区像素）。hoverMode none 时 paintOverlay 整体不调 paintHoverOverlay（painter.js:813）。图标像素不能进自检：`runChecks` 同步（self-checks/index.js:39-57）、`new Image()` onload 异步（既有 img 断言同口径，cell-painters.js:15-19 头注）→ 归浏览器。下划线断言需给 recordingCtx 增记 fillRect（现仅记 fillText/fill，cell-painters.js:106-128）。浏览器：默认场景 hover 备注列格 → 等首次 onload（invalidateCell 触发重绘；hover 后轮询按钮区至出现非背景像素，超时 1s 判失败）→ 右缘铅笔图标、垂直位置 = 格内容区中心 ±1px（槽位中心较其高 0.5px，在容差内）；移出格图标消失；点击图标 → 事件日志「editorButton 点击」且不打开编辑器、不改变选中行；图标上 cursor=pointer |
| A6 开关无白色背景 | 浏览器 | 默认场景（striped 开）点击「启用」列格（bool 渲染「是/否」文本，veil 可观测）：`.mu-canvas-table__editor` computed backgroundColor 为 rgba(0,0,0,0)；**编辑格画布区域（内缩 2px 避开 hover 描边 1px 与格线）无文字墨迹像素**（veil，getImageData：区域内不得有 lum<150 且 alpha>40 的像素）；开关控件可见、行底色透出；Esc 关闭后该格文字恢复。borderless 形态：switch 恒 `bordered=false`（editor.js computeEditorStyle），「启用」列本身即 borderless 容器验证载体；`editor.border:false` 的 input 形态 demo 无夹具（全仓无 `border: false` 列），不新增夹具，按问题 6「同类核查结论」作代码层结论 |
| A7 hover 样式/光标 | 自检 + 浏览器 | 自检：theme——colors 语义色 hover 求值非空且 ≠ color、彩色 hover === color、colorsEqual 对 hover 差异敏感；cell-painters——linkHoverColorOf 各分支（语义色取 hover、彩色同色、disabled→muted、未知名→primary）、**hover 条目 fillStyle = hover 色 且 recordingCtx 记录到 1 次 fillRect 下划线**（recordingCtx 需增记 fillRect，见 A5 行）、**两条 link 路径各断言一次**（`drawLinkItems` 竖排第 i 条与 `drawItemText` 横排）、drawButtonPill 反转三色断言、disabled 不悬停（fillStyle 仍为常态色）；interactions——resolveItemClick 对 disabled 条目返回 `disabled === true`、对正常条目 `disabled === false`。浏览器：items 场景悬停链接文字色变浅 + 下划线（悬停前后该区像素差异）、cursor=pointer；悬停按钮 pill 反转、cursor=pointer；禁用链接/按钮 cursor=default 无色变；tag 无 pointer；**移出画布后链接恢复常态色、下划线消失**（对应 onPointerLeave 清理）；`hoverMode` 切到 none 后（不移动指针）条目 hover 色立刻消失 |
| A8 树排序 A 案 + 成本结论 | 自检 + 浏览器 | 自检：tree——平铺数组按 name 排序 → buildChildrenIndex + buildFlatRows 重组：各级兄弟节点有序（抽样根级与二级；**比较口径必须与 applyOrder 一致**（`applyOrder` 对字符串值走 `localeCompare`、对非字符串走 `va > vb` 数值/序比较；name 为字符串 → `localeCompare`），**勿自创 `a < b`**）、父子结构不变（子节点仍在原父下，不跨节点）；排序稳定性：同 key 兄弟保持原相对序。浏览器：树场景（树开，展开态）点击「名称（树形列）」表头 → 箭头方向随 asc/desc/无 三态切换；事件日志 update:order-by + 数据重排：经新增调试夹具 **`window.__ctStage = () => ({ records: stageRecords.value, treeProps: treePropsBind.value })`**（main-view.vue，G2-1 文件内；展开态由既有 `window.__canvasTable.getTreeExpandedKeys()` 取，两者不重复）读当前舞台数据，断言：① 按 `pid` 分组的兄弟序列在数组中按 name 升序（desc 再验、第三次点击清空后与原 treeRecords 顺序逐项相等，比较口径同 applyOrder）；② 不跨节点——每条的父 key 仍指向同一条已存在记录（或 null 根），父子集合与排序前一致。**不用 `getTreeExpandedKeys()` 判序**（该接口只返回展开 key 数组，不含行序）；树关（treeOn false）后平铺行同为排序序；排序后滚动位置复位为预期行为（R9）。点击「树排序成本测量」→ 事件日志读 sortMs/relayoutMs/paintMs；**判据为三者均为有限数字、且事件日志无 `stale: true`**（夹具内含「复位 orderBy + 两 tick 等待 + 校验舞台已排序」逻辑，见问题 8 成本测量夹具节；读到 stale 即夹具失败，不得以 0 记。**不要以 `lastRelayout` 对象引用是否变化判新**——`getLayoutInfo()` 每次展开返回新对象，该判据恒真），实测数字回填本设计问题 8 节结论（verifier 执行） |
| A9 自检全过 | 浏览器 | 自检面板 `passed === total`（`failed === 0`）；**总数取运行时实际值记为实施后基线**，不预设数字（静态清点 147 与上轮记录 144 的口径差异由 verifier 以运行时为准）。**断言文件白名单校验**：9 个 self-checks 模块文件全部存在且被 `self-checks/index.js` 导入（新增 tree 断言写进既有文件，不新建文件；self-checks/row-geometry.js 本次不改——列分类通道删除后无对应新断言，既有断言照旧）。**面板不显示模块数**（main-view.vue:228 只渲染 `passed/total`），故模块覆盖以面板 DOM 校验：`[...new Set([...document.querySelectorAll('.ct-check-item__module')].map(e => e.textContent.replace(/[\[\]]/g, '')))]` 应恰为 9 项（text-wrap/row-geometry/tree/theme/layout/cell-painters/painter/interactions/editor） |
| A10 lint/构建 | 命令 | `npx eslint src/components/canvas-table/ demo/src/data/canvas-table/` 0 error 0 warning；`npm run build` 成功（构建产物 `dist/` 与 demo 的 watch 重编译均以命令输出为准，不以页面表现代替） |
| A11 末列右边框（空白区） | 自检 + 浏览器 | 自检：painter——**复用既有窄列夹具**（self-checks/painter.js:800-808 的 4 列全定宽、Σ=350 < W=600、fixedCount=1，已断言 `stickyWidth === 600` 与 `Σ === 350`）构造空白区：末列右缘 x = colLefts[n−1] + width − 1 处表体段 [headHeight, stickyHeight) 与表头段 [0, headHeight−1) 均有 1px 墨迹、色值 = borderColorSoft 快照；Σ = stickyWidth（无空白，用既有默认夹具：`COLUMNS` Σ=60+140+100+120+50+130=600 = W=600，`blankTail` 为 false）：同 x 无墨迹（现状维持）；gridlines 'row' 模式：末列线不画（同列线门控）。**既有 :305 `assertPixelNot(599, 100, borderColorSoft, '末列右缘应无边框')` 用的是默认夹具**（`COLUMNS` 宽 60+140+100+120+50+130 = 600 = W，`blankTail` 为 false）→ **该断言在问题 9 落地后仍成立，不需改写**（A11 新增用例另用窄列夹具验证有空白时的相反行为）。浏览器：widths 场景（窄列有空白）→ 末列右缘竖线与既有列线同色（采样像素对比快照 borderColorSoft）、表头段同样有线；拖宽浏览器窗口至无空白 → 线消失；默认场景（列宽充满）→ 末列右缘无线（现状） |

## 实施步骤

（依赖：G1-a/b/c 三组文件集合两两不相交、组间无代码依赖，可并行；S4 依赖 G1-a/b/c 的全部导出；S5 依赖 S4（paintState 形状）+ G1-*；G2-1..7 文件集合两两不相交、各自只依赖 S5 后的最终 API，可并行；V 为集成验证。**共享文件全部落在 G1/S 阶段**：cell-painters(G1-b)、painter(S4)、canvas-table.vue(S5)、constants/editor(G1-a)、theme/interactions/scss(G1-c)；G2 只碰 demo 下 7 个互不相同的文件。**row-geometry.js 与 self-checks/row-geometry.js 均不在改动集**——列分类通道删除，G1-d/G2-7 原组随之取消。）

- **G1-a**：constants.js、editor.js
  完成判据：两文件无语法/自洽错误，`editorRectOf`/`editorButtonRectOf`/`computeEditorStyle` 单文件可 import（**不跑全量 eslint、不跑 demo 页面**）。已知中间态：① self-checks/editor.js:27 与 self-checks/painter.js:20 具名导入 `EDITOR_GAP` 将失效（由 G2-2/G2-4 收口）；② painter.js:791 `paintHoverEditorStroke` 仍传 `{topGridline, rightGridline}`，新签名 `editorRectOf(rect)` 忽略之（由 S4 改调用）——不构成编译错误；③ canvas-table.scss 的 -5px 补偿与 shadow 位置属 G1-c。依赖：无。
- **G1-b**：cell-painters.js
  完成判据（**只验本文件可独立调用的性质，不改 self-checks**——断言改写归 G2-3）：垂直锚 = `rect.y + 1 + padding + lineHeight/2`，与 gridlines 取值无关（单行/树箭头/items/progress/button/多行首行为同一表达式，经 drawCell 直调观察 fillText y）；rect h=36 时单行 y = 18、height 60 的两行 y = [18,36]、height 88 的四行 y = [18,36,54,72]（首行恒 18，不随行高变）；水平 center 锚随 `rightInset` 变化、left/right 锚不变；requestIconImage/linkHoverColorOf 可独立调用；eslint 单文件通过。依赖：无（rightInset/hoverItem 契约按本文「接口」节）。
  **中间态预期**（三处，均为 G2 前不可验收的原因）：
  1. self-checks/cell-painters.js 的 :661/:684/:720/:851 断言暂时红（:667 单行锚 18 不变，仍绿），等待 G2-3 改写；
  2. **painter.js 尚未注入 rightInset（S4 才做）→ `drawCell` 用缺省 0，居中列水平锚临时为 80（改前值）**；S4 落地后变 79.5。垂直锚不受影响（常量内建）。此期间不得做水平锚的像素对比验收；
  3. 页面级验证不在本组执行（G1-a 删 EDITOR_GAP 已使 self-checks 具名导入断裂，整包不可 boot）。
- **G1-c**：theme.js、interactions.js（仅问题 7：findHitItem/resolveItemClick 透传 disabled，**无 tree 抑制**——问题 8 取消）、canvas-table.scss
  完成判据：readColors 新字段 + colorsEqual；disabled 透传纯函数；阴影/编辑样式 CSS 落地；eslint 通过。依赖：无。
- **S4**：painter.js（依赖 G1-a/b/c：editorRectOf/editorButtonRectOf/requestIconImage/drawCell 新参）
  完成判据：drawCellClipped 注入 rightInset（非末列或 blankTail，受列线门控）/hoverItem、paintHoverEditorStroke 改无参 `editorRectOf(cellRectAt(...))`/paintEditorButton（paintHoverOverlay 末尾）/veil（含显式清空 itemHits）完成；paintColGridlines/paintHeaderColLineRange blankTail 末列线落地；**paintTreeArrowAccent centerY 与 cell-painters 同槽位式逐值相等（r≥1 与 row 0 两态各断言一次，无 0.5px 错位）**；模块头 state 契约注释同步。**无 drawHeaderCell 树态改动**（问题 8 零改动）。
- **S5**：canvas-table.vue（依赖 S4 及 G1 全部）
  完成判据：paintState 两新字段（hoverItem/editingCell，**无 tree 字段、无 topAlignCols 字段**）接线、onPointerMove/onClick 新命中路径、veil 开关接线、computeEditorStyle 调用删参；eslint 通过。
- **G2**（并行组，依赖 S5 后的最终 API；文件白名单各组独立）：
  - G2-1 demo/src/data/canvas-table/main-view.vue（链接列夹具、editorButton 夹具、applyOrder 抽取 + sortedTreeRecords + stageRecords case 'tree' 接线 + 树排序成本按钮 + `window.__ctStage`）
  - G2-2 self-checks/editor.js
  - G2-3 self-checks/cell-painters.js
  - G2-4 self-checks/painter.js
  - G2-5 self-checks/interactions.js
  - G2-6 self-checks/theme.js
  - G2-7 self-checks/tree.js（平铺排序同级重组断言）
  完成判据（各组）：**编辑可并行，页面级验证必须整组落地后一次执行**——demo 页面 boot 依赖 self-checks 全部模块 import 可解析（G1-a 删 EDITOR_GAP 后，self-checks/editor.js:27、self-checks/painter.js:20 的具名导入在各自文件改写前会使整包构建失败），逐组分别跑「页面运行通过」不可执行；页面判据 = 新断言通过 + 未改断言不回归（等 watch 重编译后自检面板）。
- **V（集成验证）**：`npx eslint src/components/canvas-table/ demo/src/data/canvas-table/` → 0/0；`npm run build` 成功；浏览器执行测试计划 A1–A11 全表（实施阶段自验 + verifier 复验；A8 成本数字回填本设计问题 8 节）。

## 未解问题

（原未解 1「A1 主句与 Q2 口径的张力」、原未解 6「`--row-height` 覆盖时的锚口径」已随 decisions 检查点-A1判据 销项——A1 终版判据与锚口径收敛记录见问题 1「A1 判据的残差」与 R10，verifier 按 A1 行公式判。）

1. **表头文字垂直居中**未按表头底边框 1px 修正（centerY = headHeight/2，理论内容区中心为 (headHeight−1)/2，差 0.5px）；A1 限于单元格，如需表头同口径属后续任务。
2. **check 条目光标**：DOM 版 check 方框 cursor:pointer（column-types/style.scss:2），canvas check 条目无 itemHits 回报故无 pointer；问题 7 范围为按钮/链接，本次不扩（如需：reportHitRect 增 check 回报 + 光标白名单，改动面小）。
3. **imageCache 与图标共用 200 条上限**：主题/着色变化产生新缓存键，极端多图标列 + 频繁换肤会触发整清重载（img 列同款策略）；可接受，如需独立上限另议。
4. **文档三处同步**（skills/mussel-ui、docs/quick-reference_*、docs-site）：问题 4/5 变更列定义 API 与可编辑类型口径，按 AGENTS.md 应同步；但 00-task 约束改动范围不含文档目录且「未经用户确认，不更新文档」——实施完成后由用户确认再另任务同步，本设计不含文档改动。
