# 验证报告（终验第 2 轮，修复后再验证）

VERDICT: FAIL

模式：终验（修复轮 1 后）。核对范围（派发追加约束）：第 1 轮失败项 2 项修复效果、UNVERIFIED 1（editButton cls 夹具）、第 1 轮已 PASS 关键项抽查（self-checks 全面板 / editButton svg hover 与 emit / 旧名 grep）、修复轮改动文件 node --check。所有结论基于本验证实例自跑证据，不采信 04-impl-修复-1.md 自检结论。

## 上轮问题核对（第 2 轮起）

| 上轮项 | 结论 | 证据 |
| --- | --- | --- |
| 失败项 1：icon 列 DOM cell class 断言（resolveCellContent 链剥离 class） | 已解决 | 断言改直调 `resolveColumnType('icon').compile(column, true)` 产物（demo/src/data/table-ex/self-checks/cell-painters.js:2182-2205，svg 形态含 `domSvg.class === 'mu-table__icon-cell'`、cls 形态 class 直挂/无 innerHTML 键两断言）；构建链与 base table.vue:180 同款。面板 fresh 运行该块通过（不在 ✗ 列表）。DOM 真实消费链第 1 轮已实测（td class 含 mu-table__icon-cell） |
| 失败项 2：button 图标 x 序期望值（未叠加连续横排） | 已解决 | 期望值改为 `["●@16","编辑@32","●@70","编辑@102"]`（self-checks/cell-painters.js:2367，连续横排公式注释 :2352-2356）；面板 fresh 运行该断言通过。宽度断言 [50,20,34]（:2370-2374，上轮未执行到）本轮一并执行通过（位于 x 序后、右缘断言前） |
| UNVERIFIED 1：editButton cls 形态夹具缺失 | 已解决 | 夹具补齐：默认场景「启用」列 `editButton: { icon: 'demoGlyphA' }`（demo/src/data/table-ex/main-view.vue:473，demoGlyphA = `mu-demo-glyph-a`，content `\25CF` → ●，demo/src/common/style.css:347-349）。demo 页 hover 右缘槽：overlay 绘制 ● 图标（evidence/table-ex-editbutton-cls-hover3.png）+ sticky cursor = pointer（DOM 旁证 isEditButtonHit 命中）；点击 emit `edit-button-click {"record":"#1","recordIndex":0,"column":"active"}` 与 svg 形态同链 |
| 上轮 UNVERIFIED 2/3（install 重试链 / 真实字体时序） | 维持 | 设计「验证」节已声明不入同步断言 / 需人工，不在修复轮范围 |
| 上轮补充说明：失败项 2 块内 tooltip 溢出矩阵子断言需修复后重跑确认 | 未完成 | 该组断言位于「右缘裁剪」断言之后，本轮两跑均被新失败项 1 抛出中断，仍未执行到（见失败项 1 连带影响） |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
| --- | --- | --- |
| `node --check demo/src/data/table-ex/self-checks/cell-painters.js` | PASS | OK（无输出，退出码 0） |
| main-view.vue `<script setup>` 提取后模块校验（`vm.SourceTextModule`，evidence/check-vue-syntax.mjs） | PASS | `OK demo/src/data/table-ex/main-view.vue (<script setup> 41614 chars)` |
| `grep -rn "editorButton\|editor-button\|EDITOR_BUTTON" src/ demo/src/` | PASS | 0 命中（exit 1，无输出行） |
| self-checks 面板（浏览器 fresh load 首跑，http://localhost:3000/data/table-ex/） | FAIL | `自检结果（222/223 通过）`；唯一 ✗：「[cell-painters] button 图标…右缘剩余 < 内距 + 图标宽 → 该条目不绘制且终止后续 期望 0，实际 1」（见失败项 1）；上轮 2 失败项所在断言均通过 |
| self-checks 面板（同会话点击「重跑自检」第 2 跑） | FAIL | `自检结果（221/223 通过）`；2 ✗ = 上述右缘断言 +「非 string dev warn 一次」（后者系 warn once 语义致重跑非幂等，fresh 首跑通过，见测试质量问题 2，不计失败项） |
| demo 页 editButton hover / 点击 emit（playwright，DOM + 截图） | PASS | svg（备注 dots）hover ⋯ 显示 + `edit-button-click {"record":"#1","recordIndex":0,"column":"memo"}`、editorCount 0；cls（启用 demoGlyphA）hover ● 显示 + `edit-button-click {"record":"#1","recordIndex":0,"column":"active"}`、editorCount 0 |

项目无 eslint / typecheck 配置（设计已声明），静态手段 = node --check + .vue 提取校验。项目 rollup watch + 3000 端口在运行，直接访问，未执行打包，未启停服务。

## 验收标准核对（本轮派发核对范围）

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| 上轮失败项 1 修复：DOM cell class 断言走 compile(column, true) 消费链 | self-checks 面板（fresh 首跑） | 断言代码 self-checks/cell-painters.js:2182-2205；该块 ✗ 列表无此项 | PASS |
| 上轮失败项 2 修复：x 序期望值 16/32/70/102 | self-checks 面板（fresh 首跑） | 期望值 :2367 与实测一致（✗ 列表无此项） | PASS |
| 上轮 UNVERIFIED 1：editButton hover 显示注入 cls 图标（demoGlyphA） | demo 页（playwright 鼠标坐标级 hover + 截图 + DOM cursor/事件日志） | evidence/table-ex-editbutton-cls-hover3.png（● 绘制于格右缘槽、与文字同锚）；sticky cursor = pointer；点击 emit column:active | PASS |
| self-checks 全面板 0 失败（抽查项） | 浏览器面板 | 222/223，剩余 1 ✗（新失败项 1） | FAIL |
| editButton svg 形态（dots）hover 与点击 emit 仍正常（抽查项） | demo 页 | evidence/table-ex-editbutton-svg-hover-rerun.png（⋯ 显示）；事件日志 `edit-button-click …"column":"memo"`，无 cell-click/选中副作用，无编辑器（.mu-table-ex 内 input/textarea/select = 0） | PASS |
| 旧名 grep 仍 0 命中（抽查项） | grep | exit 1 无输出 | PASS |
| 修复轮改动文件 node --check | 命令 | cell-painters.js OK；main-view.vue script setup OK | PASS |
| 第 1 轮其余 PASS 项（canvas 双通道产物形状、占位、icons install、drawIconGlyph、resolveIconEntry、icon 列 canvas/DOM 各项、button 三形态/hover 反转/降级/payload、editButton 其余语义） | —（未复跑） | 修复轮 src/ 零改动：mtime 旁证（src/ 各文件 ≤ 09:17，修复轮 2 个 demo 文件 10:11）+ git 文件集与第 1 轮完全一致（15 M + 2 ??）→ 第 1 轮证据维持有效。例外：失败块内「空哨兵两态」「未注册降级」「tooltip 溢出矩阵」子断言两轮均未执行到（见失败项 1 连带影响），其中未注册降级行为仍有第 1 轮 demo 页证据 + resolveCellTooltip 既有块 ✓ 维持 | 维持有效 |

## 范围核对

基线（00-task.md 2026-11-05）：`?? agent-docs/plans/20261105-table-ex-icon-column/`。

当前 `git status --short`：15 M + 2 ??，文件集合与第 1 轮终验完全一致：

- 15 M：`src/icons/index.js`、`column-types/{index.js,style.scss}`、`ex/{cell-painters,editor,row-geometry,constants,painter}.js`、`ex/table-ex.vue`、`demo/src/{common/style.css,data/table/main-view.vue,data/table-ex/main-view.vue,data/table-ex/self-checks/{cell-painters,editor,painter}.js}`；`?? src/components/table/column-types/icon.js`。
- `?? agent-docs/plans/20261105-table-ex-icon-column/`：基线已有项（含本轮新增 evidence/ 截图与报告，随任务目录未跟踪）。
- 修复轮声明改动 = 2 文件（self-checks/cell-painters.js、main-view.vue），mtime 10:11；src/ 与其余 demo 文件 mtime ≤ 09:17（实施轮），与「实现源码本轮零改动」声明一致。
- 验证产物：agent-docs/…/evidence/（本轮新增 table-ex-editbutton-cls-hover{,2,3}.png、table-ex-editbutton-svg-hover-rerun.png）；`.playwright-mcp/` 已被 gitignore 忽略（status 不出现，内含 `*` + `!.gitignore`）。
- 无法区分：无。设计外改动：无（文件集合与第 1 轮清单一致，diff --stat 无清单外文件）。

## 测试质量问题

1. self-checks 面板同会话重跑非幂等：「icon 列：非法值…」块「非 string dev warn 一次」断言在第 2 跑失败——`src/utils/warn.js:4` 模块级 `warned` Set + `once = true`，该 warn 消息恒定（`实际类型 number`），首跑消费 once 后重跑不再触发。断言编写隐含「每跑必 warn」语义，与 warn once 机制冲突。fresh load 首跑通过（222/223 中该项 ✓）。面板口径 = fresh load 首跑（第 1 轮报告同为首跑口径）；不列失败项，建议断言加注释或改用唯一 value 触发源（如未注册名用例的 `Date.now()` 后缀做法）。
2. 「button 图标」块断言顺序：尾部断言（右缘裁剪之后：空哨兵两态、未注册降级、tooltip 溢出矩阵）在两轮验证中均因先行断言抛出未执行——断言块内无隔离，单点失败遮蔽后续断言。属既有 runChecks 结构特性，记录不改造。
3. 其余断言质量良好（真实锚定验收标准：产物逐键、几何值、事件 payload、DOM cursor/日志）。

## 需人工检查

1. 真实 icon-font 字体时序（设计「不可验证项」已声明）：pending → 两跳重试 → failed 链路与真实字体 tofu 替换，由使用方项目端到端验证。步骤：注册 iconfont cls 图标后，① 断网/延迟加载字体观察首帧 tofu 是否在 fonts.ready 后重绘；② install 早于样式注入观察两跳重试后 ready。
2. 观感项（设计「实测确认点」）：editButton cls 形态（●）与 svg 形态（⋯）hover overlay 视觉一致性（本轮两形态截图已备：evidence/table-ex-editbutton-cls-hover3.png / table-ex-editbutton-svg-hover-rerun.png，可辅助目视）；button icon+caption 12px 图标与文字 20px pill 内基线观感。
3. 性能与 API 便利权衡的认可（修订要求 4，设计「性能与 API 便利权衡」节 8 条，人工审）。

## 验收入口（FAIL，供修复轮复验，每条 ≤5 分钟）

1. self-checks：fresh 打开 http://localhost:3000/data/table-ex/ → 调试面板「自检结果」应显示全通过（当前 222/223，剩余「button 图标…右缘裁剪」1 ✗）。注意判定口径为 fresh load 首跑（同会话重跑受 warn once 影响多 1 项非幂等失败）。
2. editButton 双形态：同页默认场景，鼠标悬停「备注」列首行格内容区右缘（约右缘内 8~24px、与行首行文字同高）看 ⋯，悬停「启用」列同位置看 ●；分别点击后事件日志出现 `edit-button-click`（column 分别为 memo / active）且表格无编辑器、无选中副作用。
3. 静态：`node --check demo/src/data/table-ex/self-checks/cell-painters.js`；`grep -rn "editorButton\|editor-button\|EDITOR_BUTTON" src/ demo/src/` 应 0 命中。

## 环境阻塞

无。3000 端口 rollup watch 服务已在运行（直接访问成功），无服务启停记录。

手段限制记录（不影响判定）：① editButton hover 图标为 canvas overlay 绘制，无 DOM 数据可断言，采用截图目视 + sticky cursor = pointer（isEditButtonHit 命中的 DOM 旁证）+ 点击事件日志三证据合判；② hover 坐标经 `window.__canvasTable.getCellRect(row, col)` 调试句柄换算（editButtonRectOf 槽位：格内容区右缘 24px、垂直锚用主题 rowHeight 公式与行首行文字同高；右缘最外侧 ~12px 为滚动条轨道会拦截 pointer，hover 点取槽中心）；③ console 1 error（`ERR_INVALID_URL @ data:image/png;base64,AAAA…`）为 self-checks 故意失败加载桩（self-checks/cell-painters.js:778，防重跑命中 failed 缓存），修复轮之前即存在（.playwright-mcp 01:25/01:42 会话日志同报），非本轮引入。

## 失败项（FAIL 时，不含环境阻塞）

1. **self-checks：「button 图标」块「右缘剩余 < 内距 + 图标宽 → 该条目不绘制并终止后续」实现违反设计**
   - 命令/标准：self-checks 面板（fresh 首跑）块「[cell-painters] button 图标：icon-only/icon+caption 测宽与绘制、省略只作用 caption、哨兵两态、未注册降级、tooltip 溢出计宽」
   - 关键错误：`右缘剩余 < 内距 + 图标宽 → 该条目不绘制且终止后续 期望 0，实际 1`
   - 断言位置：demo/src/data/table-ex/self-checks/cell-painters.js:2399（夹具 :2392-2397：width 40 → 内容宽 24 < 阈值 28）
   - 根因定位：`ellipsizeButton`（src/components/table/ex/cell-painters.js:1375-1402）裁剪判定 `icon && remaining < padX * 2 + BUTTON_ICON_SIZE`（:1395）位于「caption 省略为空 → icon-only 降级」分支（:1387-1393）之后。remaining 24 < 28 时 caption maxWidth = `Math.max(0, 24 − 8×2 − 16)` = 0（:1383）→ ellipsize 产空文本 → 走 `!text` 降级分支返回 icon-only 条目（width = TAG_HEIGHT 20 ≤ remaining 24）→ 绘制 glyph（fillText 1 次，即「实际 1」），随后条目 2 空哨兵终止——与「实际 1」逐项吻合。
   - 违反口径：02-design.md:193「右缘剩余 < padX*2 + 图标宽 → 该条目不绘制并终止后续（与 caption 放不下同义）」；实现自身注释同口径（cell-painters.js:1373-1374）。该断言为第 1 轮因 x 序断言先抛出从未执行的尾部既有断言（04-impl-修复-1.md「遗留」节预告重跑确认项），修复 x 序后整块重跑暴露，非修复轮引入。
   - 实际 vs 预期：icon+caption 条目右缘放不下图标最小时被降级为 icon-only 绘制（1 次 fillText）；设计要求该条目不绘制并终止后续（0 次 fillText）。
   - 修复方向（归实施裁决）：将 icon+caption 条目的右缘裁剪判定前置到 caption 省略/降级分支之前；或区分 `!text` 两态——原生无 caption（icon-only 语义，维持降级）与 caption 被省略致空（按设计裁剪不绘制并终止）。注意保持原生 icon-only 条目「固定宽不省略」行为不变（设计 :193）。
   - 连带影响：位于该断言之后的「空哨兵两态」「未注册降级」「tooltip 溢出计宽矩阵」子断言两轮均未执行到（断言块无隔离，抛出即中断）；上轮「补充说明」要求的 tooltip 矩阵重跑确认继续被阻断，随本失败项修复后重跑消解。

## UNVERIFIED（无法验证项与原因）

1. 「button 图标」块尾部子断言组（空哨兵两态 / 未注册降级 / tooltip 溢出矩阵）的本轮执行确认：被失败项 1 抛出中断（非环境原因；失败项修复后重跑即消解）。未注册降级行为本体仍有第 1 轮 demo 页证据（「删除」pill 纯字无图标）+ resolveCellTooltip button 组既有块 ✓ 维持。
2. install 解析 pending → 两跳重试 → failed 链路与真实 icon-font 字体时序：设计「验证」节已声明不入同步断言 / 仓库无字体资产需人工，维持上轮结论（非本轮修复范围）。

（环境阻塞导致的 UNVERIFIED：0）
