# 实施记录（二轮，修订 6 定稿）

模式：集成（二轮实施增量）。依据：02-design.md 修订 6「实施清单」二轮实施范围——片 1 / 片 3 上轮已落地（04-impl.md / 04-impl-修复-1.md），本轮仅核对回归基线、不重写；本轮增量 = 片 2 步骤 12–17。用户 4 项裁决逐条落地：a) pill 高度与 icon-only 宽 = controlHeightSmall 快照（readPx + constants 回退）；b) caption/icon 互斥、文本优先；c) icon-only 方形居中、link 宽 = 12；d) ellipsizeButton 裁剪检查先于降级判定（降级路径整体删除，结构性消解）。

## 改动文件

| # | 文件 | 步骤 | 内容 |
| --- | --- | --- | --- |
| 1 | `src/components/table/ex/theme.js` | 12 | `readSnapshot` 增 `controlHeightSmall: readPx(probe, '--mu-control-height-small')`（raw 读取、未定义 → 0、消费侧回退，与 rowHeight 同模式）；三处「20 固定字段」注释（`:2`/`:107`/`:252`）改 21 |
| 2 | `src/components/table/ex/constants.js` | 13 | 增 `CONTROL_HEIGHT_SMALL_FALLBACK = 24`（镜像 `root.scss:140`，注释注明变量名与取值处） |
| 3 | `src/components/table/ex/cell-painters.js` | 14 | import 增 `CONTROL_HEIGHT_SMALL_FALLBACK`；新增内部助手 `buttonHeightOf(theme)`（`theme?.controlHeightSmall \|\| CONTROL_HEIGHT_SMALL_FALLBACK`，`:1284`）；`BUTTON_ICON_GAP` 删除（全库 0 残留）；`TAG_*` 常量注释解耦（TAG_HEIGHT 归 tag 链 + link 命中框，button 不再同构）与 button 图标注释随形态收敛改写；`ellipsizeButton` 重构（源头互斥短路：caption 非空 → caption-only、icon 不解析不 warn，省略空串 → `return null`【d 显式修复，裁剪检查先于一切绘制】，caption 空 → icon-only 固定宽 pill = 快照 / link = 12、剩余 < 宽终止，降级路径删除）；`layoutButtonEntries` / `drawButtonPill` 签名追加 `buttonHeight` 位置参（设计注记「签名形态实施自定」）；`drawButton` 入口求值 `buttonHeightOf` 一次下传，`onItemRect` 命中矩形 pill 高 = 快照值、link 沿用 `TAG_HEIGHT` 现状；`drawButtonPill` 高 = 快照、icon-only 图标 `x + (h − 12)/2` 水平垂直居中、caption x = `x + TAG_PADDING_X`（无图标偏移）；`drawButtonLink` icon-only 图标于条目起点 x、caption-only 路径不变；`buttonsOverflowOf` 删 `iconWidth` 扣减与图标宽提前返回、icon 解析移入 caption 空分支（caption 非空零查表零 warn）、icon-only 计宽 pill = 快照 / link = 12 |
| 4 | `demo/src/data/table-ex/main-view.vue` | 15 | button 夹具（`:692-701`）改四条目：icon-only（svg 名 `clock`）/ icon-only（cls 名 `demoGlyphA`）/ caption+icon 文本优先演示（`编辑`+`clock`，icon 不显示）/ caption+未注册名（`删除`+`noRegBtnGlyph`，icon 忽略 caption-only）；「按钮」「链接按钮」两列同源对照维持；icon-only 未注册哨兵用例仅入 self-checks（设计定案） |
| 5 | `demo/src/data/table-ex/self-checks/cell-painters.js` | 16 | `THEME` 夹具补 `controlHeightSmall: 24`（`:111`）；「button 绘制」块名去「tag 同构」、命中矩形断言 `'9,20'` → `'7,24'`；「button 图标」块整块改写为两形态矩阵——夹具 `[caption+icon, icon-only, caption+未注册]` → texts `['编辑@16', '<glyph>@56', '删除@90']`、宽 `[34, 24, 34]`、高 `[24,24,24]`、icon-only 命中 `'7,24'`、glyph fillText 恰 1 次、未注册名零 warn（console.warn 捕获 try/finally 同款）；省略断言 caption x = 16 + 无 glyph fillText（删除原 glyph 位置断言）；d 回归（width 40，caption '甲' 需 25 > 内容宽 24 必空串）→ 0 fillText + 0 pill fill/stroke + 0 onItemRect；icon-only 右缘剩余 < 24（width 56）→ 该条目 0 绘制且终止（texts 仅 `['甲']`、onItemRect 1 条）；哨兵三态（空条目终止 / icon-only 有效继续 / 未注册 icon-only 哨兵终止 + warn 一次）；快照驱动断言（`controlHeightSmall: undefined` → 回退 24 宽 = 高；`:32` 自定义 → 命中 `'3,32'`、图标居中 x = 8 + (32−12)/2 = 18）；tooltip 矩阵重算（icon-only 24 计宽：44 溢出 / 70 不溢出维持；caption+icon 计宽忽略 icon：10 字 106 ≤ 144 不溢出、15 字 151 > 144 溢出；纯图标组无 tooltip 维持） |
| 6 | `demo/src/data/table-ex/self-checks/theme.js` | 17 | 头注释改写为二轮新增 `controlHeightSmall`（取代设计期 controlHeight）；块名与内联注释 20 → 21 固定字段（14 色 + 字号/字体 + 5 尺寸，键数 22）；`SIZE_VARS` 追加 `--mu-control-height-small: 24px`（夹具自含）；`pxKeys` 补 `controlHeightSmall: 24` |

回归基线核对：片 1（`drawIconGlyph`/`resolveIconEntry`/`whenGlyphReady`/install 解析/类型登记）与片 3（editButton 注册名 + emit + 改名）源码在位（`cell-painters.js:139`、`column-types/icon.js`、`table-ex.vue` `'edit-button-click'`、`editor.js:38`、`row-geometry.js:74`），本轮零改动。

## 偏离

无。一处实施中自纠（非偏离）：`drawButton` 的 `onItemRect` 初版对 link 形态也用了快照高，与设计定案「link 形态命中框沿用 `TAG_HEIGHT` 现状」不符，落地时已按设计修正（pill = 快照值、link = TAG_HEIGHT 二分，`cell-painters.js:1351-1360`）；self-checks link 形态块仅断命中宽（18/34），不受影响。

## 自检

- `node --check` 5 个 .js 全部通过：`src/components/table/ex/theme.js`、`constants.js`、`cell-painters.js`、`demo/src/data/table-ex/self-checks/cell-painters.js`、`self-checks/theme.js`；`demo/src/data/table-ex/main-view.vue` `<script setup>` 提取后 `node --check` 通过。本项目无 eslint / typecheck 配置。
- 残留核对：`BUTTON_ICON_GAP` 与 `icon+caption` 于 src/ + demo/src/ 0 命中；`editorButton|EDITOR_BUTTON` 0 命中。
- 断言期望值复算：以 node 纯逻辑复刻 `fakeMeasure`（CJK 9px/字符）+ `ellipsize`（text-wrap.js 同式二分）+ 新布局链（互斥源头判定 / 快照高），逐项复算与写入断言一致——texts `编辑@16 / glyph@56 / 删除@90`、宽 `[34,24,34]`、d 场景 '甲' 16+9=25 > 24 必空串 0 条目、icon-only 裁剪 width 56 → 剩余 7 < 24 终止、自定义 32 → `'3,32'`/x=18、tooltip 44 true / 70 false / 10 字 false / 15 字 true、省略 cap x=16。
- self-checks 面板运行（demo 页「自检结果」面板，fresh load 首跑口径）与 demo 页 playwright 验证属 verifier 职责，本轮未运行。

## 遗留

- 步骤 25 终验待 verifier：self-checks 全跑（上轮 UNVERIFIED 的 tooltip 溢出矩阵子断言随本轮重算矩阵补验）+ demo 页双页验证（table-ex / table）；demo 页自定义 `--mu-control-height-small`（30/32）夹具验证按设计「刷新/切换后生效」（快照重读链）。
- pill 高度 20 → 24 为已发布 button 列的视觉变更（设计「风险与回滚」已注明发布说明需注明），API / 协议 / 事件零改动。
- demo 夹具 `noRegBtnGlyph` 现配 caption（icon 忽略零 warn），demo 页不再产生该名的 dev warn（icon-only 未注册 warn 用例移入 self-checks）；`noRegGlyph`（icon 列）warn 维持。
- 文档同步四处按项目约定待用户确认后更新，不在本轮范围。
