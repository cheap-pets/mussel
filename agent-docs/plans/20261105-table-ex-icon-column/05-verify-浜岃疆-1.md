# 验证报告（二轮实施终验，第 1 轮）

VERDICT: PASS

模式：终验（二轮实施验证）。核对范围（派发追加约束）：二轮 4 项裁决逐项（demo 页 + self-checks）、self-checks 全面板 fresh 首跑 0 失败、上轮 UNVERIFIED 补验（tooltip 溢出矩阵）、回归抽查（icon 列双通道 / editButton hover+emit / 旧名 grep / BUTTON_ICON_GAP 残留 / 改动文件语法）、demo 页快照重读链（自定义 `--mu-control-height-small`）。所有结论基于本验证实例自跑证据，不采信 04-impl-二轮.md 自检结论。

## 上轮问题核对（第 2 轮起）

| 上轮项 | 结论 | 证据 |
| --- | --- | --- |
| 失败项 1：ellipsizeButton 裁剪检查顺序（icon-only 降级路径后置 → 右缘放不下仍绘制） | 已解决（结构性消解） | 降级路径已删除：`ellipsizeButton` 重构为源头互斥短路——caption 非空 → ellipsize → 空串即 `return null`（src/components/table/ex/cell-painters.js:1396-1407，裁剪判定先于一切绘制）；caption 空 → resolveIconEntry → `remaining < width ? null : …`（:1410-1417）。self-checks d 回归断言 fresh 首跑通过（0 fillText + 0 pill fill + 0 pill stroke + 0 onItemRect，self-checks/cell-painters.js:2422-2425）；icon-only 裁剪终止断言通过（:2436-2437，width 56 → texts 仅 `['甲']`、onItemRect 1 条） |
| UNVERIFIED 1：tooltip 溢出矩阵子断言（两轮均被先行断言中断未执行） | 已解决（本轮补验通过） | 断言在位且 fresh 首跑通过：icon-only 24 计宽 contentWidth 44 溢出 / 70 不溢出、caption+icon 计宽忽略 icon（10 字 106 ≤ 144 不溢出 / 15 字 151 > 144 溢出）、纯图标组 null（self-checks/cell-painters.js:2520-2544）；面板「button 图标」块 ✓ 文本明示「tooltip 矩阵均正确」 |
| UNVERIFIED 2：install pending → 两跳重试 → failed 链（真实字体时序） | 维持（需人工） | 设计「验证」节已声明不入同步断言；仓库无字体资产。本轮无新证据，继续列入需人工 |
| 上轮已 PASS 关键项（canvas 双通道产物、editButton 注册名 + emit、requestImage 多监听、drawIconGlyph、resolveIconEntry） | 维持有效 | 二轮改动面限 6 文件（mtime 12:18-12:24 集中本轮实施窗），片 1/片 3 源码零改动；icon 列与 editButton 另有本轮 demo 页实测回归（见验收标准核对 D 组）全部通过 |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
| --- | --- | --- |
| `node --check src/components/table/ex/{theme,constants,cell-painters}.js` + `demo/.../self-checks/{cell-painters,theme}.js` | PASS | ALL_JS_OK（5 文件退出码 0） |
| main-view.vue `<script setup>` 提取校验（`vm.SourceTextModule`，evidence/check-vue-syntax.mjs） | PASS | `OK demo/src/data/table-ex/main-view.vue (41785 chars)`、`OK demo/src/data/table/main-view.vue (10078 chars)` |
| `grep -rn "editorButton\|editor-button\|EDITOR_BUTTON" src/ demo/src/` | PASS | 0 命中（exit 1） |
| `grep -rn "BUTTON_ICON_GAP" src/ demo/src/`；`grep -rni "icon+caption\|icon + caption\|iconCaption" src/ demo/src/` | PASS | 均 0 命中（exit 1，形态删除无死代码残留） |
| self-checks 面板（浏览器 fresh load 首跑，http://localhost:3000/data/table-ex/） | PASS | `自检结果（223/223 通过）`，✗ 列表为空；关键块「button 图标：两形态互斥…哨兵与右缘裁剪、tooltip 溢出计宽」✓ |
| demo 页 console（fresh load） | PASS | 零 `noRegBtnGlyph` warn（互斥短路：caption 非空不解析）；现存未注册 warn 均为 self-checks 故意用例（`noRegEntry…`/`noRegEdit…` 时间戳名）与 `noRegGlyph`（icon 列既有夹具）；1 error（ERR_INVALID_URL data:image/png;base64,AAAA…）为 self-checks 故意失败加载桩，上轮已确认非本轮引入 |

项目无 eslint / typecheck 配置（设计已声明），静态手段 = node --check + .vue 提取校验。rollup watch + 3000 端口在运行，直接访问（HTTP 200），未打包、未启停服务。

## 验收标准核对

### A. 二轮 4 项裁决（demo 页 + self-checks）

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| a) pill 高度 = `--mu-control-height-small`（默认 24） | self-checks + demo 页像素 | 断言 `'7,24'`（centerY 19±12，self-checks/cell-painters.js:1025-1029 命中矩形、:2385-2390 icon-only）；demo 页「条目/新列型」场景首行 4 pill 垂直 span 全部 [43,66] = 24px（scrollLeft 695 格线校准）；theme 快照 `controlHeightSmall: 24`（`getThemeSnapshot()`） | PASS |
| a) 自定义 `controlHeightSmall: 32` → `'3,32'` | self-checks | :2505-2508（centerY 19±16 = 3,32）+ 图标居中 x = 18（:2509-2513）；面板通过 | PASS |
| b) 互斥文本优先：caption+icon 仅显示文本 | self-checks + demo 页 | texts `['编辑@16', '<glyph>@56', '删除@90']`、宽 [34,24,34]、glyph fillText 恰 1 次、未注册名零 warn（:2375-2396）；demo 页 pill3/pill4 宽 40 = 内距 16 + 文字 24（真实 12px/字），无图标像素区，「编辑」文字起点 466 = pill 起点 + TAG_PADDING_X（无图标偏移） | PASS |
| b) caption+未注册名仅 caption 且零 dev warn | demo 页 console + self-checks | fresh load console 零 noRegBtnGlyph warn；pill4（删除+noRegBtnGlyph）正常绘制（若哨兵误触发该条目不绘制）；self-checks :2396 断言通过 | PASS |
| b) icon-only 条目显示图标 | demo 页像素 | pill1（clock svg）图标像素中心 (405.5, ~55)、pill2（demoGlyphA cls ●）中心 (437.5, ~58)，均绘制 | PASS |
| c) icon-only 方形：宽 = 高 = 24、图标水平垂直居中 | self-checks + demo 页 | 宽断言 24（:2380-2385）、命中 `7,24`（:2386-2390）；demo 页 pill1/pill2 水平 span [394,24]/[426,24]、图标深色像素中心 x = 405.5 / 437.5 与 pill 几何中心 405.5 / 437.5 精确一致，垂直锚 centerY 54.5（槽位锚）±6 内 | PASS |
| d) 右缘剩余 < 阈值不降级绘制（上轮失败项 1 回归） | self-checks | 0 fillText + 0 fill + 0 stroke + 0 onItemRect 四重断言（:2422-2425）fresh 首跑通过；icon-only 右缘裁剪终止（:2436-2437）通过 | PASS |
| d) demo 页佐证：右缘放不下条目终止 | demo 页像素 | 快照 32 态下 4 条目总宽超内容宽 → 第 4 条目（删除 pill）不绘制，水平 run 仅 3 组 [394,32]/[434,32]/[474,40]，行为与裁剪条款一致 | PASS |

### B. self-checks 全面板

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| fresh load 首跑 0 失败 | 浏览器面板 | `自检结果（223/223 通过）`；上轮 222/223 的唯一 ✗（右缘裁剪）已消，且上轮被中断的尾部子断言（空哨兵两态/未注册哨兵/tooltip 矩阵）本轮全部执行并通过 | PASS |

### C. 上轮 UNVERIFIED 补验

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| tooltip 溢出矩阵子断言 | self-checks（fresh 首跑） | 纯图标组 null、icon-only 24 计宽 44 溢出 / 70 不溢出、caption+icon 忽略 icon 计宽 10 字 106 不溢出 / 15 字 151 溢出（self-checks/cell-painters.js:2520-2544），面板该块 ✓ | PASS |

### D. 回归抽查（未被二轮破坏）

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| icon 列双通道断言 | self-checks（fresh 首跑） | 「icon 列：双通道 compile 产物」「非法值/未注册名」「icons install」「drawIconGlyph」「resolveIconEntry」各块均 ✓（面板列表无 ✗） | PASS |
| icon 列 demo 显示（canvas） | demo 页像素 | 「图标」列 clock 16px 笔画水平 span [779..793] 居中格中心 785、垂直 span 高 14 于 centerY 54.5 ± 8 内 | PASS |
| icon 列 DOM 通道（base table /data/table/） | demo 页 DOM | td class `mu-table__td text-center mu-table__icon-cell`；条目 span `mu-icon` + svg innerHTML；`text-primary` ×4（color 列）；内联 font-size 16px / 20px（iconOption.size）；`title: true` → mouseenter 动态挂 title = 注册名 "clock"、mouseleave 移除（src/components/table/base/table-row.vue:19 动态 setTitle 机制，设计内行为） | PASS |
| editButton hover/emit（svg + cls 两形态） | demo 页（DOM cursor/事件日志 + 截图） | 备注（dots svg）hover 槽 cursor=pointer、点击 emit `edit-button-click {"record":"#1","recordIndex":0,"column":"memo"}`；启用（demoGlyphA cls）cursor=pointer、emit `column:"active"`；两形态截图 evidence/table-ex-editbutton-rerun2-memo-hover.png / -active-hover.png；点击后 .mu-table-ex 内 input/textarea/select = 0（不开编辑）、无 cell-click 副作用 | PASS |
| 旧名 grep | grep | `editorButton\|editor-button\|EDITOR_BUTTON` 于 src/ + demo/src/ 0 命中 | PASS |
| BUTTON_ICON_GAP 与 icon+caption 残留 | grep | 均 0 命中 | PASS |
| 改动文件语法 | node --check / vm | 5 .js OK + 2 .vue `<script setup>` OK | PASS |

### E. 快照重读链（demo 页构造验证）

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| 自定义 `--mu-control-height-small` 生效（设计「刷新/切换后生效」注记） | demo 页运行时构造（.mu-root 内联变量 32px，不改源码/夹具） | 变量生效后 MutationObserver 自动重读：`getThemeSnapshot().controlHeightSmall` 24 → 32（未点 refresh，等待 800ms）；`refreshTheme()` 后维持 32；pill 重采样：4 pill 垂直 span [39,70] = 32、icon-only 宽 [394,32]/[434,32]、图标居中随 (32−12)/2 重算（深色像素中心 409.5 = pill 中心）、第 4 条目右缘放不下终止；移除内联变量后快照回落 24。截图 evidence/table-ex-button-pill-row1-custom32.png（32 态）/ -default24.png（24 态对照） | PASS |

## 范围核对

基线（00-task.md 2026-11-05）：`?? agent-docs/plans/20261105-table-ex-icon-column/`。

当前 `git status --short`：17 M + 2 ??。与上轮终验（15 M + 2 ??）相比新增 2 个 M = 二轮新增改动面（theme.js / self-checks/theme.js），文件集合与下述清单完全一致：

- 二轮声明改动 6 文件（04-impl-二轮.md「改动文件」，mtime 12:18:18–12:24:32 集中本轮实施窗）：`src/components/table/ex/theme.js`、`src/components/table/ex/constants.js`、`src/components/table/ex/cell-painters.js`、`demo/src/data/table-ex/main-view.vue`、`demo/src/data/table-ex/self-checks/cell-painters.js`、`demo/src/data/table-ex/self-checks/theme.js`——全部在 git M 列表。
- 其余 11 M + 1 ??（`src/components/table/column-types/icon.js`）= 片 1/片 3 上轮实施产物，上轮终验已核，本轮 diff --stat 无清单外文件。
- 验证产物：agent-docs/…/evidence/ 新增 table-ex-button-pill-row1-default24.png、table-ex-button-pill-row1-custom32.png、table-ex-editbutton-rerun2-memo-hover.png、table-ex-editbutton-rerun2-active-hover.png（随任务目录未跟踪，基线已有项）。
- `.playwright-mcp/` 被 gitignore 忽略（status 不出现）。
- 无法区分：无。设计外改动：无（git status 与 diff --stat 均无清单外文件）。

## 测试质量问题

1. 「button 图标」块未注册名用例已改用 `Date.now()` 唯一名（self-checks/cell-painters.js:2351），配合哨兵块（:2461-2482）的独立 warn 捕获，规避了 warn once 跨用例去重串扰；上轮记录的「非法值块 warn once 重跑非幂等」仍在（面板口径 = fresh 首跑，decisions.md 二轮调度裁决，不影响判定）。
2. 断言块内无隔离（单点失败中断后续断言）为既有 runChecks 结构特性——本轮全过，不构成遮蔽；记录不改造。
3. 断言质量良好：期望值逐键锚定设计条款（texts/x 序/宽高/命中矩形三重零断言/tooltip 数值），demo 页像素实测与 self-checks 期望互相印证（pill 24/32、图标居中、宽 40 真实字体口径）。

## 需人工检查

1. 真实 icon-font 字体时序（设计「不可验证项」维持）：install pending → fonts.ready/rAF 两跳重试 → failed 链与 tofu 替换重绘，仓库无字体资产，由使用方项目端到端验证。
2. 观感项（设计「实测确认点」4/5）：24px pill 内 12px 文字与 12px 图标的观感、紧凑行高（`--row-height` < 30）时 24px pill 的视觉余量；editButton cls（●）与 svg（⋯）hover overlay 视觉一致性——本轮截图可辅助目视（evidence/table-ex-button-pill-row1-default24.png、table-ex-editbutton-rerun2-*.png）。
3. 上轮 3 项自决点标注（02-design.md「未解问题」节，均已按定案落地并有本轮实测证据，供人工确认）：① CSS 变量取值策略 = 快照读取（E 组实测：变量覆写 → 快照重读 → pill 随动）；② link 形态 icon-only 宽 = 图标本体 12（demo 页实测 link 列 [594,12] 图标 run 宽恰 12、位于条目起点）；③ caption 非空时 icon 完全忽略（零查表零 warn——console 零 noRegBtnGlyph warn + self-checks :2396）。
4. 性能与 API 便利权衡的认可（修订要求 4，设计「性能与 API 便利权衡」节 10 条，人工审）。

## 验收入口（PASS，每条 ≤5 分钟）

1. self-checks（B/C 组）：fresh 打开 http://localhost:3000/data/table-ex/ → 调试面板「自检结果」应显示 `223/223 通过`（判定口径 = fresh load 首跑；同会话重跑受 warn once 影响非幂等）。
2. button 两形态（A 组）：同页夹具场景切「条目/新列型」→ 首行「按钮」列应见 2 个约 24×24 图标 pill（图标居中）+「编辑」「删除」纯文字 pill；「链接按钮」列 icon-only 为无底纯小图标、文字条目纯文本（「编辑」条目不显示图标）。
3. 快照跟随（E 组）：控制台执行 `document.querySelector('.mu-root').style.setProperty('--mu-control-height-small','32px')` → 页面 pill 变高变宽（图标 pill 32×32）；移除（removeProperty）回落 24。
4. editButton（D 组）：夹具场景切回「默认」，横向滚动至「备注」「启用」列，hover 首行格内容区右缘 24px 槽分别见 ⋯ / ●，点击后事件日志出现 `edit-button-click`（payload column 分别 memo / active），表格无编辑器开启。
5. 静态：`node --check src/components/table/ex/cell-painters.js`；`grep -rn "editorButton\|editor-button\|EDITOR_BUTTON" src/ demo/src/` 与 `grep -rn "BUTTON_ICON_GAP" src/ demo/src/` 应 0 命中。

## 环境阻塞

无。3000 端口 rollup watch 服务已在运行（HTTP 200 直接访问），无服务启停记录。

手段限制记录（不影响判定）：① demo 页 pill 几何为 canvas 绘制无 DOM 数据，采用格线校准 scrollLeft（385/565/745/825 四线交点一致 → scrollLeft 695）+ 像素采样（垂直 span / 水平 run / 深色像素质心）数据断言，关键断言辅以截图；② 快照重读链在 demo 页无覆写夹具，采用运行时 `.mu-root` 内联变量构造（不动源码/夹具），html 层变量被 `.mu-root` 块声明遮蔽（root.scss `.mu-root,.mu-light` 块定义）故须内联到 .mu-root 元素——构造路径已记入验收入口 3；③ DOM 通道 `title` 为 mouseenter 动态挂载（table-row.vue:19），静态 DOM 无 title 属性属设计内机制，已按动态断言验证。

## 失败项

无。
