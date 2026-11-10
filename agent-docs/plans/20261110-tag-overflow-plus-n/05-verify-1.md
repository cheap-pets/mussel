# 验证报告 1（整体，第 1 轮）

VERDICT: PASS

验证者：verifier（独立实例）。未读取 04-impl.md，未采信实施者自检；全部结论基于自行运行的命令与 playwright DOM 断言。
日期：2026-11-10。环境：dev 工作区（基线 634e947 + 上一任务未提交改动叠加）、demo serve :3000 探活 200。

## 上轮问题核对

首轮，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npx eslint --ext .js,.vue src demo/src` | exit 0 | 0 errors, 2 warnings（均 complexity，非阻塞）：cell-tooltip.js:222 resolveCellTooltip 11>10；use-cell-tooltip.js:146 showCellTooltip 12>10（后者为设计已知豁免先例） |
| `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` | exit 0 | 无输出 |
| `curl :3000` | 200 | demo 服务存活，未重建 |
| 设计完成判据 grep（步骤 1.1~1.5） | 全过 | item-painters.js `tagOverflowBadge`=3 / `tag-overflow`=1；cell-painters.js `tagOverflowBadge: col.type === 'tag'`=1；cell-tooltip.js `isAutoTitle`=2、旧式 `raw !== true && raw != null`=0；hit-test.js `findTagOverflowPill`=2、`plus: true`=2（代码 1 处 + JSDoc 注记 1 处，与设计"命中 1"的偏差为文档行，非功能）；use-cell-tooltip.js `isSameTooltipCell`=3、`isAutoTitle`=2、旧式 `isSamePoint(next, tooltipCell)`=0 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 pill 渲染 + n 计数（含 8px 间隙） | 自检（确定性）+ 浏览器 | 自检面板 245/245 通过且 0 fail，新块「drawItems：tag 列 +n 溢出汇聚」在通过列表；块内断言（fakeMeasure 精确值）：fillText 序列 ['甲甲甲','乙乙乙','+2']、pill rect [x=110, width=34]（末条右缘 102 + 8px 间隙）、title='丙丙丙；丁丁丁'、index=-1、灰字 cssColorOf(THEME.gray) / 灰底 cssColorOf(THEME.hoverBg)、title:false 仍回报、未溢出无回报、无解回退首条省略截断。浏览器：`?scene=items&bust=20261110v101` hover getCellRect(1,3) 右缘内 20px → 600ms 后 `.mu-tooltip-panel` display='block'（pill 命中矩形仅绘制时回报，命中即证明渲染） | PASS |
| A2 pill tooltip = 剩余项全文 | 浏览器 | 接 A1 同面板 textContent = `溢出标签2；溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7；溢出标签8`：split('；') 7 项、序号 2..8 连续递增、首项 ≠ '溢出标签1'、末项 = '溢出标签8'、长度 7 ∈ [1,7]，分隔符 '；' 与格级全文同字面（真实环境下 k=1、n=7，与面板项数一致） | PASS |
| A3 未溢出无 +n | 自检 + 浏览器 | 自检块「未溢出：无 tag-overflow 回报、常规回报 ['tag:0','tag:1']」通过。浏览器：中性移出等 800ms 面板 display='none' 后，hover getCellRect(0,3)（row1 '短标/甲' 未溢出）pill 位 → 700ms 后面板 display='none'（无显示） | PASS |
| A4 协议共存不回归 | 浏览器 | 1) `getLayoutInfo().colWidths` length=15，前五 [120,150,150,150,150]；2) title:false 抑制 +n：hover getCellRect(1,4) pill 位 → 600ms 无可见面板（裁决行为）；3) tag 溢出格级回归：hover getCellRect(1,1) 左缘内 40px → textContent 逐字等于 '溢出标签1；…；溢出标签8'（8 项全量 join）；4) button 溢出回归：hover getCellRect(1,2) 中心 → '短；这是一条超长按钮文字标题溢出提示夹具' 逐字相等；5) `?scene=default&bust=20261110v102`：getCellRect(1,4) hover → 长文本全文 '极长文本夹具：…完整内容提示'；getCellRect(1,5)（title:false）hover → 800ms 无可见面板 | PASS |
| A5 自检 + lint | 浏览器 + 命令 | 自检面板首跑「自检结果（245/245 通过）」、`.ct-check-item--fail` 数 0（未点重跑）；eslint exit 0（2 条 complexity warning 非阻塞）、stylelint exit 0 | PASS |

浏览器断言均按设计协议执行：段间 `mouse.move(5,5)` 中性移出 → 等 ≥800ms → 断言面板 display='none' 再进入下一段；坐标越视口先 `.ct-stage` scrollIntoView 再重取 getCellRect（首轮 rect top=-1098 命中此坑，按要点 4 处理后重取 top=249）；URL 带 cache-bust；hover→停留→断言单次调用内完成。DOM 断言输出直接记录于本表，未产截图（按派发"DOM/可访问性断言优先、非必要不截图"约束）。

## 范围核对

`git status --short` + `git diff --stat` 与设计改动清单（8 文件）、基线（decisions.md [启动]、00-task.md 基线）逐块比对：

- **本任务设计清单 8 文件**：diff 与设计一致（逐块核对）——item-painters.js（plan/pill 私有函数 + 头注释）、cell-painters.js（单行实参）、cell-tooltip.js（isAutoTitle 导出 + 调用；其余 diff 行为上一任务 title 协议 v2 遗留，与本任务无涉）、hit-test.js（isPointInRect/findTagOverflowPill/itemHits/plus/JSDoc）、use-cell-tooltip.js（helper×2、传参、去重、过期守卫、plus 分支、import、@host-reads）、自检 cell-painters.js 与 interactions.js 末尾各 1 新块（与设计 §2.1/§2.2 全文一致）、main-view.vue「+n 夹具」2 列（与设计 §3.1 全文一致）。
- **基线排除项**（上一任务遗留，不计越权）：`src/components/table/ex/cell-paint/cell-content.js`、`src/components/table/ex/table-ex.vue`；main-view.vue / 两自检文件中注释标记 `20261110-table-ex-overflow-tooltip` 的块；`agent-docs/knowledge/INDEX-table.md`、`agent-docs/knowledge/project/table-ex-overflow-tooltip-title-protocol.md`、`agent-docs/plans/20261110-table-ex-overflow-tooltip/`、本任务 plan 目录。
- **用户并行改动（decisions.md [设计r1校验] 排除）**：`src/components/form/form-field.vue`、`demo/src/form/form/main-view.vue`、`docs-site/components/form-field.md`、`docs-site/components/form.md`、`skills/mussel-ui/references/components/form.md`、`docs/quick-reference_components.md`。
- **验证产物**：`.playwright-mcp/` 下 page/console 快照（该目录自带 .gitignore `*`/`!.gitignore`，已被忽略，git status 不可见）；无其他构建产物。
- **无法区分**：无——同文件两任务改动按块注释标记可完全区分。
- **设计外改动（未记录）**：无。

## 测试质量问题

无。两个新增自检块均为真值断言而非"不抛错"：+n 块断言精确文本序列、矩形坐标 [110,34]、title 串、index=-1、灰/灰底色值、title:false 渲染、未溢出负例、无解回退截断行为；门控块断言 plus 正例 3 态 + 负例 4 态（title:false、空 title、矩形外、itemHits 缺省、resizing）。

## 需人工检查

无。设计测试计划未标人工项；pill 灰色视觉由自检 fillStyle 断言覆盖（cssColorOf(THEME.gray)/THEME.hoverBg）。

## 验收入口（PASS 时必填）

1. **A5**：`http://localhost:3000/data/table-ex/?scene=items` 打开，滚动到自检面板 → 头部显示「自检结果（245/245 通过）」，无红色失败项。
2. **A1/A2**：同页 items 场景，找到 row2（id 2）「标签（+n）」列（右对齐），鼠标悬停行内最右侧灰色 `+7` pill → tooltip 显示 `溢出标签2；…；溢出标签8`（7 项剩余项）。
3. **A3**：同列 row1（'短标'、'甲' 两枚标签、无 pill）悬停 → 无 tooltip。
4. **A4**：同 row2 悬停「标签（+n·title:false）」pill → 无 tooltip；悬停「标签（溢出）」首个标签 → 8 项全文；悬停「按钮（溢出）」→ '短；这是一条超长按钮文字标题溢出提示夹具'；打开 `?scene=default` 悬停「长文本（溢出提示）」列奇数行 → 长文本全文，悬停「长文本（title:false）」→ 无 tooltip。
5. **A5 命令**：`npx eslint --ext .js,.vue src demo/src` 与 `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` 均 exit 0。

## 环境阻塞

无。demo 服务存活（curl 200，未重建）；playwright mcp 正常。console 唯一 error 为夹具故意的无效 data URI 图片（`net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`），属 demo 既有夹具行为，与本任务无关、非回归。
