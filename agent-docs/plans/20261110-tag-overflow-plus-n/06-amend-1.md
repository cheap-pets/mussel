VERDICT: AMENDED

## 检查项结论

1. **覆盖**：A1（自检精确 n/8px 间隙/灰色/命中回报 + 浏览器存在性）、A2（浏览器 textContent + 自检 title）、A3（自检 + 浏览器）、A4（浏览器 5 段回归 + 新增 title:false 渲染自检）、A5（自检面板 + lint）均有设计与手段；修订补齐两处：A3 原手段会被已显示面板拦指针（假 FAIL），title:false 的「仍渲染 pill」无验证手段。
2. **事实一致**：设计引用的路径/符号/行号逐条用工作区实读核对通过（`item-painters.js:77-117/120-139/142-151/156-177/216`、`cell-tooltip.js:23-25/53-64/220-225`、`hit-test.js:170-188`、`use-cell-tooltip.js:54-78/135-166`、`paint-body.js:35-44/236-248/312`、`use-pointer.js:187-199/245-247/285`、`theme.js:115/117`、`constants.js:54/56/58`、`use-table-api.js:107-125`、`main-view.vue:695/720/747/795/799-800/1039`、`cell-painters.js:1925-1943/2736`、`interactions.js:782-840`）；仅修正 1 处行为口径（单条超宽无格级 tooltip，见台账 #4）。
3. **约定一致**：pill 计入 groupWidth 参与 itemsStartX（`table-ex-item-column-align`）；title 真值经 `isAutoTitle` 单点复用，不建第二套口径（`table-ex-overflow-tooltip-title-protocol`）；既有自检零漂移已全量扫描证实（`canvas-pixel-assert-anchor-drift`）；pill 绘制收在 rightBound 内（`table-ex-paint-cap-content-right`）。
4. **影响面**：itemHits 新增 text/title 字段的消费面已逐个核对——click-resolve `findHitItem`（:164-179）透传、`emitDomItemClick` 经 `items[-1]` 判空（use-cell-click.js:241）、`emitButtonItemClick`（:220-222）、`applyItemCursor` 仅 link/button（use-pointer.js:245-247）、`updateHoverItem`（:187-199）无视觉差；无 props/events/公共 API 变化；item-painters 不反向 import cell-tooltip（cell-tooltip.js:10 单向），无新环。
5. **可实施**：片1 依赖 1.1→1.2、1.3/1.4→1.5 无环；每步有 grep/eslint 判据；修订修正 1.3 判据自相矛盾（≥3 → ≥2）与 2.1 插入语法（尾逗号），避免弱模型无效改动。
6. **风险与回滚**：行为扩面/pill title 生命周期/eslint complexity/双向门/验证依赖均有对策；回滚清单 8 文件且只撤本任务新增块（不整文件还原，main-view.vue 与两自检文件叠加上一任务改动）。
7. **范围**：5 src + 2 自检新增块 + 1 demo 夹具，未越出 A1-A5；未动 docs/docs-site/skills、form 调试文件、上一任务既有改动；title:false 夹具列属 A4 验证载体，必要。
8. **切片**：片1（逻辑）/片2（自检）/片3（夹具）/终验，每片有可观察判据（grep+eslint / 自检绿 / A1-A4 / lint+A1-A5 复验），A1-A5 均归属某片或终验，依赖无环，各片文件集合两两不相交。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 测试计划 A3 行 + 「验证环境要点」段 | 「每段 hover 前 pointer 先移出（表格上方表头或页面空白）」→ 新增第 1 条「面板指针拦截」协议：`mouse.move(5,5)` 移出舞台 → 等 ≥800ms → 断言 `.mu-tooltip-panel` computed display === 'none' → 再进入下一段；A3 行改为引用该条 | 面板显示中 `pointer-events: auto`（tooltip-panel.scss:66-67 `[pop-up]`；popup.js:41 入场设置）且恒在锚点上方 4px（tooltip-panel.vue:56、:132-136）——pill 锚点在行 1 时面板覆盖行 0 中部；落在面板上的移动不产生表格 pointermove，且面板 `@mouseover.stop` 清 delayHide（tooltip-panel.vue:12-13），不等待即进入下一段会假 FAIL | 是 |
| 2 | 步骤 2.1 自检块（+ return 串）+ 改动清单 cell-painters 行 + 测试计划 A1/A4 行 | 新增：`title: false` 列同夹具绘制 → 断言 `noTitle.some(r => r.kind === 'tag-overflow')`；改动清单与 A1/A4 行同步标注该断言 | 裁决理由 4「title:false 列仍渲染 pill」此前无验证手段；A1 未把 title:false 排除在渲染范围外。若弱实现误把 badge 门控加上 `col.title !== false`，原设计全套测试仍会绿——新断言可捕获 | 是 |
| 3 | 测试计划 A4 行 3) | `textContent === '溢出标签1；溢出标签2；…；溢出标签8'` → 逐字 8 项全文（'…' 改为 '溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7'），并注「逐字比对，勿用省略号」 | 期望值含省略号不可执行，弱模型照抄必假 FAIL；全文口径来自 cell-tooltip.js:23-25 join | 否 |
| 4 | 边界清单「n 计数」 | 「单条超宽…回退…（无 pill，格级溢出 tooltip 兜底）」→ 分两态：唯一条目超宽（cap 至 contentWidth）→ offset === contentWidth 不构成溢出 → 无 pill 亦无格级 tooltip（drawTag 自身省略截断）；条目 ≥2 且首条放不下 pill → k=0 回退 + 格级 tooltip 兜底全部条目 | `horizontalItemsOverflowOf` 单条 cap 后 total === contentWidth → `total > contentWidth` false（cell-tooltip.js:53-64）；measureItem cap 见 item-painters.js:216。原口径会让验证者在单条超宽格期待 tooltip | 否 |
| 5 | 边界清单「pill 与对齐/命中/间隙」 | 追加：pill 自身可命中（kind `tag-overflow`、index -1）；点击不发 cell-item-click，且 `finishCellClick` 不早退，仍续行格点击/选中/开编辑 | use-cell-click.js:118-148（`emitCellItemClick` 后无 return）+ :230-243（`items[-1]` 判空）——原设计只写了「不发 cell-item-click」，未说明后续链，验证/实现易误解为点击被吞 | 否 |
| 6 | 步骤 1.1 | 追加 drawItems 上方注释（:75-76）同步改写为「（tagOverflowBadge 时改绘 +n 汇聚 pill）」 | item-painters.js:75-76 现注释「超出右缘的条目丢弃」与新行为矛盾，属同批注释漂移 | 否 |
| 7 | 步骤 1.3 完成判据 | `grep -c "isAutoTitle"` ≥3（导出+调用+注释）→ ≥2（`export function` 定义 + :225 调用） | 设计 §4 代码只产生 2 处（无注释含该词），原判据自相矛盾，弱模型会为凑数加噪声注释 | 否 |
| 8 | 步骤 2.1「文件」行 | 追加「上一元素收尾 `}` 后先补 `,` 再粘块；块内缩进 2 空格」 | checks 数组末元素无尾逗号（cell-painters.js:2734-2736），漏逗号即语法错误、自检全红 | 否 |
| 9 | 步骤 2.2 块 | 追加注释：col 0/1 自动形态、col 2 title:false、col 4 未配置列（title 未设置）+ 空 title 条目 | 原块 `columns` 仅 3 列却用 `hit(4)`，易被误判为夹具错误（实际 gate 放行 + 空 title 分支） | 否 |
| 10 | 「遵循约定与复用」 | 追加 no-drift 全扫描证据：tag 列绘制仅 cell-painters.js:786/:905/:1927 与 painter.js:816/:1006/:1692，均 1~2 条、单元格宽 ≥160 不溢出；row-geometry.js:388/:658、spans.js:131 不绘制单元格 | 设计原只以 cell-painters 的 tag 块举证；painter.js 三处夹具需核对才能成立「既有自检零漂移」（已实读确认 2 条 tag、宽 200） | 否 |
| 11 | 「方案概述」裁决句 + 「裁决」节末 | 「待裁项」→「待裁项；修订终审通过，实施按此」；节末追加「修订终审：裁决成立」+ 渲染/提示分离说明（badge 不带 title 判断；title 仅作用于门控与 isAutoTitle 分支） | decisions.md [启动] 明示由修订终审；与 `table-ex-overflow-tooltip-title-protocol` 条目（仅显式 false 抑制、条目级提示不宽于列协议）一致 | 否 |
| 12 | 「未解问题」节 | 2 条非阻塞注记改为处置结论：①防御分支维持不加自检 + 无公共构造路径依据；②k 无关断言维持 + 补 k≥1 更宽裕推导 | ①`col.type === 'tag'` 时 `_render` 恒为 TagColumn.compile（cell-content.js:29、:91；tag.js:37-59 恒产 kind:'tag'）②k=1 只需 1 条 tag（CJK 10px 计 62px）+ 8 + pill ≈29 = 99 ≤ 134 | 否 |
| 13 | 「被拒绝的备选」#2 | 「现状回退（截断 + 格级溢出 tooltip 兜底）已覆盖单条超宽场景」→ 修正为多条目下 tooltip 兜底；唯一条目超宽为既有截断无提示 | 与台账 #4 同一证据（cell-tooltip.js:53-64、item-painters.js:216） | 否 |
| 14 | 「验证环境要点」第 3 条（新增） | 追加页面就绪判据：等 `.ct-check-item` 出现且 `getCellRect` 返回非 null 后再取 `r` | `getCellRect` layout 未就绪返回 null（use-table-api.js:107-125），`__canvasTable` 于 onMounted 赋值（main-view.vue:1564-1568）；弱验证者直接取 `r.left` 会 TypeError 空耗一轮 | 否 |

## 未解决异议（累计）

无。
