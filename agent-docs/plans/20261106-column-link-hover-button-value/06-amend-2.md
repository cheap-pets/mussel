VERDICT: AMENDED

## 上次回应核对（第 2 次起）

- 06-amend-1 台账 #1-#5（实质：空组门控上提 / button.js 改动清单 / 接口 4 空组产物 `{}` / 风险需求 2 表述 / 片2 步骤与判据） → `02-amend-1.md` 逐条「接受」并保留正文；核对 `02-design.md` 四段仍一致，且工作区已落地（`column-types/button.js` 门控在 `!dom`/`dom` 分支之前、`text.js:66` `link: isLink || null`、`cell-text.js:118,150,192` underline） → **已落实**
- 06-amend-1 台账 #6-#18（非实质 13 条） → 设计者「确认保留」；#6/#17 旧状态随用户裁定改写，核对 `02-design.md` 需3-b 与接口 5 已按裁入口径 → **关闭**
- 06-amend-1 未解决异议 1（表头底边框是否计入需求 3-b） → 用户裁定采纳修法 a（`decisions.md:6`）；核对 `paint-header.js:283-287` 末线已 cap 至 contentRightX、表头背景未动 → **关闭**（本追加轮 2 又由用户指令取代表头背景口径，`decisions.md:9`，非回退）
- 追加轮 1 修复（`04-impl-修复-1.md` / `05-verify-3.md`）→ 自检 223/223 已达成，夹具断言与 `link.js`/`list.js` 现状契约一致 → 作为本轮基线成立；本轮设计不改该夹具文件 → **已落实**

## 检查项结论

1. **覆盖**：需A/需B(-1..3)/需C/行满列满不回归/自检 223/223/编译 均有设计 + 测试计划行；R5 空白区放行保留与 `striped` 默认 false 两处口径已于测试计划与改动清单写明，斑马行延伸区改由自检夹具覆盖（本轮共写）。
2. **事实一致**：抽查全部 path/symbol 通过——`paint-overlay.js:55-66`（paintHoverRow/Col 现状宽高）、`paint-body.js:72-73,107-108,155-156`、`paint-utils.js:55-71`（isSelectedRow/rowBackground）、`paint-gridlines.js:117-126,157-159`、`paint-header.js:271-287`、`painter.js:68-76,95,218-224,320`、`row-geometry.js:183,238`（totalHeight）、`table-ex.vue:118`（`striped: Boolean` 默认 false）、`base/table.scss:22-28`（DOM 列宽铺满）、`self-checks/painter.js:199-207,1212-1270`。
3. **约定一致**：色值全走 `theme.colors`/快照字段、BEM/`mu-` 前缀未动、注释中文出处风格与模块现状一致；不回退基线（不含 `paint-header.js:272-273` 背景整宽旧口径）。
4. **影响面**：六个 cap 消费点（gridlines 行线/列线、header 末线与背景、hover 行带/列带、选中行带×2 pass）全部列入；`rowBackground` 唯一消费方为 `paint-body.js`（已 grep 核实），拆 `baseRowBackground` 无遗漏调用方；span region 底色矩形由列几何构成、右缘 ≤ contentRightX，设计已声明不改并核对成立。
5. **可实施**：片A/片B 文件集合互斥可并行，片C 依赖片A（helper）与片B（demo 文件）串行，集成片依赖三片；各有可观察判据，无循环依赖。
6. **风险与回滚**：双向门、无共享生成文件；透明区视觉、混色链路、脏区先擦后画、固定 pass 无操作均已推演；回滚禁用 `git checkout`（保基线）。单项推演复核成立：`spacerWidth: Math.max(colsWidth, containerWidth)`（`layout.js:336`）→ 最大 scrollLeft = contentWidth − stickyWidth → 滚动时 `contentRightX ≥ stickyWidth`，cap 恒无操作；`contentBottomY` 同理（`spacerHeight` 撑满剩余滚动）。
7. **范围**：A/B/C 三项 + 等价 helper 收敛，无超验收改动；`paint-gridlines.js` 改写为逐字等价重构，风险由既有 blankTail 自检覆盖。
8. **切片**：未标并行组（除 A∥B 声明），A∩B 文件集合为空，C 与集成串行，共享 demo 文件已按 C→集成顺序串行。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 测试计划「需C 选中底色不越末列右缘」行 | 「点击 sparse 表行 2 …（行 2 偶行 = bgNormal）；再点行 3（斑马行）延伸区为 bgStripe」 → 「点击第 1 行（id 1 = 行索引 0，y≈54）：x≈250 selectBg、x≈340 bgNormal；再点第 3 行（id 3 = 行索引 2）；sparse 表未绑 `:striped`（默认 false）→ 三行均 bgNormal，斑马延伸区改由自检 `selectedKey: 1` 覆盖」 | 无 `:striped` 绑定 → `striped` 为 false（`table-ex.vue:118`），demo 无斑马行；且行索引 2 为偶数本就 bgNormal，原「行 3（斑马行）= bgStripe」与 `rowBackground` 的 `row % 2 === 1` 相反（`paint-utils.js:68`）。按原文验证会误判需C 失败 | 是 |
| 2 | 改动清单 self-check 行 + 实施步骤「集成」step1 | 断言组「选中带右界 + 延伸区底色」 → 明确采样点与期望：`(250,126)` selectBg / `(450,126)` bgNormal；`(450,90)` bgStripe / `(450,50)` bgNormal；表头 `(450,4)` `[0,0,0,0]` / `(300,4)` bgFill；3 行夹具列带 `(200,100)` `blendColor(hoverBg, bgStripe)` / `(200,200)` `[0,0,0,0]`；新增 `selectedKey: 1` → `(250,90)` selectBg / `(450,90)` bgStripe；并补 name/return/模块头 `:10-11` 同步 | 原「x=340 selectBg」落在 amount 列 currency 右对齐文字右缘 ≈341（`number.js:4` `align:'right'`、padding 8 + rightInset 1），像素断言会采到字形；「hover 混色」「y=10 表头」未给期望值，`assertPixel` 需精确值（`painter.js:199-207`）。断言全部并入既有检查项，总项数仍 223 | 是 |
| 3 | 改动清单 demo 行 | 「section note 更新」 → 追加「sparse 表不绑 `:striped`（`striped: Boolean` 默认 false，`table-ex.vue:118`）→ 三行 bgNormal，斑马行延伸区不在 demo 范围」 | 与台账 #1 同一事实，避免实施者/验证者复测时再造错误预期 | 否 |
| 4 | 测试计划环境行 | 「3 行 × Σ290 窄列 × 320px 容器，容器宽 > 290」 → 「容器高 320px（`main-view.vue:100`）+ demo-section `wide`，容器宽 ≈1000 ≫ 340」 | 320px 是 `style="height: 320px"`（高），宽度由 `wide` 布局决定；探针 x≈340 需容器宽 > 340 才成立 | 否 |
| 5 | 测试计划「需A」行 | 「x≈250 同 y 为表头背景色」 → 「x≈230」（并给出末列 caption 文字左缘 ≈254 的避让依据） | sparse 末列「数量」右对齐（right 锚 = 200+90−8 = 282，两字 ≈254..282），x≈250 距字形仅 4px 且受字体渲染影响 | 否 |
| 6 | 「未解问题」 | 「两点记录」 → 「三点记录」；新增第 3 条：`00-task.md:31` 与 `02-design.md:181` 旧口径「表头背景仍整宽」已被 `decisions.md:9-12` 取代，验证者须按本设计需A 判定 | 00-task:31 仍在验收标准内（与追加轮 2 冲突），提示验证者防误判为回归；非阻塞，不改历史文件 | 否 |

## 未解决异议（累计）

无。轮 1 异议 1（表头底边框截断）已由用户裁定关闭（`decisions.md:6`）；本轮为追加轮 2，需求 A/B/C 与 decisions.md 一致，未发现需用户裁定的阻塞项（3 条非阻塞记录见设计「未解问题」1-3）。
