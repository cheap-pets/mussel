# 修订回应（第 2 轮：检查点人工意见 + 交叉审改结论沿用）

输入：03-human-1.md（VERDICT: REVISE，三条人工意见）、06-amend-1.md（9 项实质改动已并入 02-design.md 前稿）。
判读基准：decisions.md「检查点」条目（人工 1 列级对齐、人工 2 A8 A 案、人工 3 问题 9/A11）。
产物：本文件 + 直接修改的 02-design.md（方案概述、问题 1/3/8 分项、新增问题 9 节、遵循约定、改动清单、接口、被拒绝备选、风险 R1/R6/R7 改写 + R8/R9 新增、测试计划 A1/A8 改写 + A11 新增、实施步骤重排、未解问题收敛）。

## 人工意见逐条回应

### 意见 1（列级垂直对齐）— 接受

> 单元格默认垂直居中对齐，但包含多行文本或多行链接列时，垂直 top 文字对齐；非多行列的内容，按在默认行高中居中的位置。

落实（02-design.md 问题 1 节全文改写）：
- **多行文本列与多行链接列整列垂直 top 对齐**：首行文字（行框）top = 内容区顶 + padding，后续行 + lineHeight；列内单行格同锚（decisions 检查点「整列」口径——36px 缺省行高下 top 锚 17 vs 居中 18.5）。删除 `multilineBlockTop`（块整体居中，cell-painters.js:413-415），三条多行路径（wrapLines :447 / 数组 :488 / link 竖排 :881）统一改 top 锚。
- **非多行列按内容区中心垂直居中** + 格线 0.5px 修正（检查点：格线修正口径不变，垂直 +0.5 / 居中列水平 −0.5）。
- 列分类谓词 `topAlignColumnsOf(columns, records)`（row-geometry.js 新增导出，复用 SINGLE_LINE_TYPES/isLinkColumn/valueOf，与估高同源）；壳 computed → paintState.topAlignCols → painter 按列注入 `topAlign`。
- 行高公式与估高/精算管线零改动：top 块底 = padding + n×lineHeight ≤ 行高（`rowHeightOf = max(rowHeight, padding×2 + lines×lineHeight)`，row-geometry.js:135-137），**永不越界 → 前稿「超高裁剪/条件 clip」整体取消**（R1/R7 随之改写，见下）。
- R4b 既有断言（数组路径与省略路径「对齐」）意图随口径反转，改写为列级口径断言（数组列 top 锚 53 vs 居中列 54，self-checks/painter.js:951-956），非静默保持。

「按在默认行高中居中的位置」与检查点「其余列按内容区中心垂直居中」在**超高行**（因同行多行列内容变高的行）上存在两种读法，已列「需用户确认」Q2，默认按检查点（实际行高内容区中心，与现状行为连续）。

### 意见 2（树排序选同级排序，即 A 案）— 接受

落实（02-design.md 问题 8 节全文改写）：
- **组件侧零改动**：排序维持父级受控契约（update:order-by → 父级排 records → prop 引用替换 → watch 重建）；树态排序箭头与表头命中判定本就无树态分支，维持现状即满足「树态排序箭头正常显示」。前稿 tree 抑制三处（painter/interactions/paintState.tree）全部取消。
- **demo 树场景数据源接排序产物**：抽取排序比较器 `applyOrder(list)`（与现 sortedRecords main-view.vue:713-726 逐字相同），新增 `sortedTreeRecords = computed(() => applyOrder(treeRecords))`，`stageRecords` `case 'tree'`（:791）改读之。`treeRecords` 保持 const 数组（computed 派生、非破坏性：orderBy 清空即恢复原序）。
- **同级子节点内排序、不跨节点**由 tree.js 既有重组语义天然保证：`buildChildrenIndex` 同父子级按出现序收集（tree.js:41-65）+ `buildFlatRows` DFS 按根序 + 子序展开（tree.js:107-134）+ Array.sort 稳定性 → 平铺整体排序后每级兄弟有序、父子结构不变。以 self-checks/tree.js 新增纯函数断言固化（兄弟有序 + 不跨节点）。
- 成本夹具改为**程序化设 orderBy** 触发真实管线（computed → prop → watch → relayout + 重绘，与表头点击同路径），applyOrder 拷贝单独计时（sortMs），nextTick 回读 getLayoutInfo 的 relayout/paint 耗时 → logEvent。替代前稿「treeRecords 改 ref + 赋值」方案（破坏性赋值、测量路径与真实路径不同构）。
- 实测数字由 verifier 回填 02-design.md 问题 8 节；机制预期 < 30ms/次（n=10003）。排序后滚动复位为既有 watch 行为（与默认场景排序一致，记为预期，R9）。

### 意见 3（新增问题 9：空白区末列右边框）— 接受

落实（02-design.md 新增「问题 9」节 + 改动清单/测试计划 A11/实施步骤同步）：
- 空白区判定 `blankTail = layout.stickyWidth > (layout.contentWidth || 0)`（两字段已有：layout.js:465 colsWidth / :470 容器宽，无需改 layout.js）。
- 表体 `paintColGridlines`（painter.js:382-395）与表头 `paintHeaderColLineRange`（:616-626）的末列 break 条件 `c >= n - 1` 改 `c >= n - 1 && !blankTail`——末列右缘 1px 线（含列头段），线位/颜色（borderColorSoft）/gridlines 模式门控全部沿用既有列线口径（「与既有列线同色同口径」，A11 原文）。
- 无空白区时 blankTail 恒 false → 现状维持（末列右缘不画线）。空白区行背景已由 bandToX 充满视口（paintCellRange :303-308），无线无额外背景。

## 关键事实回查（意见 1 落实依据，源码行号）

| 事实 | 位置 | 结论 |
|---|---|---|
| 多行文本列配置级判定 | cell-painters.js:168-180（prepareColumn：`_maxLines` 常量形态；`multiline` + lineClamp → `_resolveMaxLines` 行级闭包）；row-geometry.js:126（数组值分支，无配置标记） | 多行 = ①数组值（数据形态）②maxLines>1 / multiline（配置） |
| 多行链接列判定 | row-geometry.js:129（link 条目计数）、demo main-view.vue:540/550/575（多条目 link 字段值均为数组） | link 列多条目 ⇔ 字段值为数组（render 计数 = 数组长度） |
| 恒单行列清单 | row-geometry.js:29 `SINGLE_LINE_TYPES`（tag/button/check/img/image/progress/rec_no） | 这些列恒居中 |
| 现多行起排锚 | cell-painters.js:413-415 `multilineBlockTop = rect.y + max(padding, (h−block)/2)`，三处共用（:447/:488/:881） | 块整体垂直居中（R4b 先例） |
| 行高估高与 top 关系 | row-geometry.js:135-137 `rowHeightOf = max(rowHeight, padding×2 + lines×lineHeight)`；padding = theme.cellPadding（与 top 锚同一常数） | top 锚块底 = padding + n×lineHeight ≤ 行高恒成立 → 无裁剪 |
| 末列无线实现 | painter.js:386 / :620 两处 `if (c >= n - 1) break`；空白判定字段 layout.contentWidth/stickyWidth（layout.js:465/:470） | 问题 9 改动面 = 两处 break 条件 |
| 树排序数据流断点 | main-view.vue:791 `case 'tree': return treeRecords`（不接 sortedRecords） | A 案接线点唯一且已在方案中定位 |

## 审改结论沿用与被取代项（06-amend-1 九项实质改动处置）

沿用：#1（shadow +1px）、#2（paintTreeArrowAccent centerY 修正）、#3（resolveItemClick 透传 disabled）、#4（A1 断言改 ctx stub 精确口径）、#5（A3/A5/A7 断言事实修正）、#6（A6 borderless 载体）、#7（A6 夹具事实）、#9（G2 页面判据改整组一次执行）——全部保留于 02-design.md。

被人工意见/检查点取代（非回退审改结论，均有 checkpoint 依据）：
- **#8 / #19**（「树关后点击产生 update:order-by 但数据顺序不变」）：A 案下树场景数据源已接排序产物，树开/树关均展示排序序。A8 测试行已按新行为改写。
- **#14 之 G1-b 判据后半**（「多行首行锚改为格中心」）：列级 top 口径取代（首行锚 = box.y + padding + lineHeight/2），判据同步改写。
- **#17**（「:925 R4a/R4b 锚不变保持通过」）：top 口径下数组列锚改变（18→17 类偏移），R4a 保持、R4b 改写为列级口径断言。
- **#11**（treeRecords 改 ref 的两处 `.value` 同步）：其前提（改 ref）随 A 案改 computed 派生而消失，treeRecords 保持 const，:811/:816 无需改动。
- **#12 / R7**（多行编辑态首行位移）：列级 top 下画布首行顶 = 格顶 + padding（差上格线 1px），textarea 首行顶 = 格顶 + padding → 位移消失，R7 改写为一致性说明；问题 3 的 scss textarea「首行顶对齐」注释由「删半句」改为「恢复并更新表述」（#13 的处置随之调整，理由同）。

## 小口径决定（按检查点与探索事实自行裁定）

1. **多行列单行内容也 top**（整列）：decisions 检查点「整列垂直 top 对齐」明文，未再询问。
2. **top 锚 padding 基数 = theme.cellPadding**：与行高公式 `padding×2 + lines×lineHeight`（row-geometry.js:135-137）同源同常数，行框槽位锚（`box.y + padding + lineHeight/2`），不随字形墨迹度量浮动——「文字 top」取可稳定实现的行框语义。
3. **内容区顶 = box.y**（含格线 0.5/1px 修正口径）：与居中修正同一 box 构造，多行列 r≥1 行整体随格线修正 +1px，与非多行列修正方向一致。
4. **问题 9 线位与门控**：末列右缘内 1px（同既有列线式）、borderColorSoft、受 gridlines 模式门控（all/column 画、row/none 不画）——「与既有列线同色同口径」；空白区本身无线无背景（行背景已充满）。
5. **A 案接线形态**：computed 派生（sortedTreeRecords）非破坏性排序 + 成本按钮程序化设 orderBy 测真实管线（同表头点击路径）。
6. **topAlignCols 数据源取 props.records 全量**（非 displayRows）：树展开/收起不改变列分类（估高扫描只见展开行，用 displayRows 会随展开翻转分类）。

## 需用户确认

**Q1 多行文本列/多行链接列的判定谓词**（影响哪些列整列 top；demo 现有夹具下三种选项表现一致，差异出现在边界数据）：
- **选项 1（推荐，本文默认）— 配置级 + 数组值数据检测**：文本呈现列 `maxLines>1` 或 `multiline` 配置恒 top（数据集内稳定，无滚动翻转）；任意列（含 link）数据存在数组值即整列 top；全单值 link 列、纯单行文本列维持居中。实现 = `topAlignColumnsOf` 单函数。
- 选项 2 — 严格数据级：maxLines 列仅当实际折出多行才 top。不推荐：字符串估高为 1 行下界（row-geometry.js:100），进窗精算前列分类未知，滚动中会从居中跳 top。
- 选项 3 — link 类型级：`type === 'link'` 恒 top（含全单值列，单行格上移 1.5px）。最简但超出「多行链接列」字面。

**Q2 超高行中非多行列的垂直位置**（同一行因多行列内容变高时，其余单行列内容锚在哪）：
- **选项 1（推荐，本文默认）— 实际行高内容区中心**：decisions 检查点「其余列按内容区中心垂直居中」的口径；与现状行为连续（超高行其余列现也居中）。人工原文「按在默认行高中居中的位置」在行高 = 默认时两者等价，仅超高行有别。
- 选项 2 — 默认行高居中位：锚定行顶 + 默认行高/2（超高行中内容偏上、与多行首行近似同高）。若选此：切换点 = 居中锚基数一处引入 theme.rowHeight（壳/painter 单点），断言随调。

两问用户未答复时按推荐项实施（检查点口径与探索事实为准）；答复变更的切换点均单函数/单点，不影响其余设计。

## 不可行

无。三条人工意见均可落实，未标「不可行」项。

## 未解问题收敛

- 删除：原未解 1（A8 主句与禁排口径的张力）——检查点人工 2 A 案已裁决，A8 主句可满足。
- 新增：未解 1 = 本文件 Q1/Q2 待确认（默认口径与切换点见上）。
- 保留：表头文字居中 0.5px（后续任务）、check 条目光标、imageCache 共享上限、文档三处同步（均不受本轮修订影响）。
