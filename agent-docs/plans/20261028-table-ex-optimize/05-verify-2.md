# 验证报告（第 2 轮）

VERDICT: FAIL

## 上轮问题核对（第 2 轮起）

上轮（05-verify-1.md）无 FAIL 项，有 3 项 UNVERIFIED（验收 #2/#4/#5，环境豁免）+ 1 项测试质量小问题。逐项核对：

| 上轮项 | 本轮结论 |
|---|---|
| 验收 #2 UNVERIFIED（浏览器手段不可用） | 已按 decisions.md 用户裁定改用 playwright mcp 实测。②③（等级列/状态列下拉交互）实测 **PASS**；但 ①"自检面板 0 failed"不成立：面板 167/169，**2 项断言失败**（本轮新发现，均属本轮改动新增的断言自身缺陷，见"失败项"）→ 该项转 **FAIL** |
| 验收 #4 UNVERIFIED | playwright 实测：② 渲染与像素采样 **PASS**（详见验收标准核对表）；① 自检面板 0 failed 同上 **FAIL** |
| 验收 #5 UNVERIFIED | 改后单侧 M1/M2 采样已完成（playwright evaluate，7 次取中位，`scanCount=100000` 全部核对通过）；但 S0 改前基线缺失（decisions.md 已裁定转需人工），"无回退"比较 **仍 UNVERIFIED** |
| 测试质量小问题：`numericEnumColumn` 命名残留 | 本轮复核仍在（`demo/src/data/canvas-table/self-checks/editor.js:856`，实为 number+mappings 夹具）。维持"小问题，不判 FAIL" |

本轮无遗留的上一轮 FAIL 项。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS (exit 0) | dev：`✓ 297 modules transformed`，`dist/mussel.js 615.79 kB`，`✓ built in 541ms`；prod：`dist/mussel.min.js 294.51 kB`，`✓ built in 538ms`（复跑一次取真实退出码 `BUILD_EXIT=0`） |
| `grep -rn "enum" src/components/canvas-table/` | PASS (exit 1=无命中) | 0 命中 |
| `grep -rn "enum" demo/src/data/canvas-table/` | PASS (exit 1) | 0 命中；`-i` 变体仅 `finit**eNum**ber`/`Num**eric**` 子串假阳性与 `numericEnumColumn` 命名残留（见上轮核对） |
| `grep -rn "onImageLoad" src/ demo/src/data/canvas-table/self-checks/` | PASS | 闭包仅建于 `cell-painters.js:721`、`:1147`（均 `() => onImageLoad(row, colIndex)`）；`painter.js:358` 直传 `state.onImageLoad`；`painter.js:799/:1124-1125` 为 hover/relay 单次转发；self-checks 零参回调兼容 + 新契约断言 `[[3, 5]]`（cell-painters.js:609） |
| `grep -n "recordKeyOf" src/components/canvas-table/painter.js` | PASS（P1a） | `painter.js:251` 行级一次求值（paintBodyRow 内）；drawCellClipped 无逐格调点 |
| 注释扫描（node 内联脚本，7 个改动源文件，`//` 连续块与 `/* */` 块按物理行 >3 输出） | PASS | `ALL CLEAN`（0 输出） |
| `node --check` 10 个 self-checks .js | PASS | 全部 OK |
| demo 服务 + HTTP（本次启动：`node node_modules/vite/bin/vite.js build --config vite.demo.config.js --watch`，**PID 616**，日志 `evidence/demo-watch-2.log`；验证结束后已 `kill` 并补 `kill -9`，`POST_KILL=000`） | PASS | 就绪判据（沿用上轮规避）：`/data/canvas-table/main.js` → 200，构建产物 mtime 22:16 = 当前时刻，内容含 56 处 `mappings`、`等级` 列，`index` → 200 且 `<title>CanvasTable 画布表格 - Mussel Demo` |
| 浏览器 console 检查 | 信息 | 唯一 error = `data:image/png;base64,AAAA1` 加载失败——self-checks/cell-painters.js:562 失败路径夹具的**故意**坏 src，非缺陷；其余 30+ 条均为 getImageData `willReadFrequently` 性能提示（自检与本次采样触发，良性） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. canvas-table 源码无 enum 处理逻辑 | 命令 | `grep -rn "enum" src/components/canvas-table/` 0 命中（本轮重跑）；layout/editor 无 enum 条目（同上轮证据） | PASS |
| 2. mappings 显示映射生效且优先；options 编辑下拉；仅 options 按转换映射 | 浏览器 + demo 自检 | ① 自检面板 `167/169 通过`，**2 failed**（`[cell-painters]mappings/options 优先级…`、`[editor]仅 options 的 select…`，均为新增断言自身缺陷，功能行为另有证据支持正确，见失败项）。② 等级列（colIndex 9）：scrollLeft=200 → `getCellRect(0,9).x=764 ∈ [0,956)` → 合成点击开编辑器 → `.mu-canvas-table__editor` 内 `.mu-select` 存在 → 展开 `.mu-dropdown-panel .mu-option` = **低/中/高** → 点"中" → 事件日志首条 `update:cell-value {"record":"#1","recordIndex":0,"field":"level","value":2}`（value 为未字符串化的 2）→ 点名称列（colIndex 2）编辑器关闭 ✓。③ 状态列（colIndex 3，mappings 派生）：scrollLeft=0 → 同法开 select → 选项 = **启用/待处理/已归档**（无 default）✓（截图 `evidence/02-status-dropdown-options.png`） | FAIL（①） |
| 3. `npm run build` 通过 | 命令 | exit 0，dev + prod 两次 `✓ built` | PASS |
| 4. demo 页渲染正常：映射列显示映射值、编辑下拉编辑态正常 | 浏览器 | ① 同上 2 failed。② 像素采样（getImageData，lum<100 计数，格内缩进采样）：col3 状态映射列 row0 = **82 > 30** ✓；横滚 colIndex 9 可见（x=764）后 col9 row0（'低'）= **34 > 30** ✓（另测 row1 '中'=20、row2 '高'=53——阈值随字画密度敏感，按设计指定格 row0='低' 判）；col13 空值占位列 row0/row1 = **0 < 10** ✓（对照 col10 row0 = 11）。截图：`evidence/04-fresh-level-column.png`、`evidence/04-placeholder-column.png`。③ 交互同 #2②③ | FAIL（①） |
| 5. 性能度量方式列明；实施后复核无回退 | 浏览器（playwright evaluate 采样） | 改后单侧已测：默认场景 100k 行 × 14 列，复位滚动后连续 7 次 `props.records = records.slice()`，每次等 100ms 读 `getLayoutInfo()`。M1 `lastPaint.elapsed` = 0.8/0.7/0.6/0.8/0.6/0.8/0.9 ms → **中位 0.8ms**；M2 `lastRelayout.elapsed` = 144.5/151.5/145.2/147.6/142/151.8/143.8 ms → 中位 145.2ms，按 `elapsed/(scanCount×列数)` 归一化 = 0.1032/0.1082/0.1037/0.1054/0.1014/0.1084/0.1027 µs → **中位 0.1037µs/行·列**；`scanCount=100000` 7/7 次核对通过（无签名跳扫）。**"无回退"（改后 ≤ 基线 ×1.10）无法判定：S0 改前基线缺失**（decisions.md 裁定转需人工） | UNVERIFIED（基线缺失 → 需人工） |
| 6. 注释每段 ≤3 行；复杂度重构点有说明 | 命令 + 人工 | 命令部分：7 个源文件注释块扫描 ALL CLEAN（本轮重跑）；R1-R5 在 02-design.md 方案概述第 4 条列明。人工抽样部分见"需人工检查" | PASS（人工抽样另列） |

## 范围核对

- 基线：mussel-table @ 7113e14（`git log` 确认未提交），无基线脏文件、无"无法区分"项。
- `git status --short`：12 M（src 6 + demo 6）+ `?? src/components/canvas-table/mappings.js` + `?? agent-docs/plans/20261028-canvas-table-optimize/`（任务目录，排除）。`git diff --stat` 合计 757 insertions / 1239 deletions——与上轮及 02-design.md 改动清单逐一对应，无多无少。
- 未改动清单核对：theme/text-wrap/tree/interactions/row-geometry-controller/use-tree-rows/use-column-resize/constants/index.js、table/ 目录、self-checks/index.js 等 0 改动。
- 验证产物：`dist/`、`demo/dist/`（.gitignore 已忽略）；demo watch 重建覆盖 demo/dist（knowledge `demo-watch-wipes-dist`，预期）；`.playwright-mcp/` 快照与日志已被既有 `.playwright-mcp/.gitignore`（2026-10-27 已存在）忽略，`git status` 不显示。
- 设计外改动：无。并行实施：无。

## 测试质量问题

- 本轮 browser 实测暴露 **2 项新增断言缺陷**（均在本次改动新增代码中，`git diff` 确认为 `+` 行）：
  1. `demo/src/data/canvas-table/self-checks/cell-painters.js:399`：期望无映射 number 列 `1234.5` 格式化为 `'1,234.50'`，实际 `'1,234.5'`——`NumberColumn` 格式化器 `minimumFractionDigits: 0`（`src/components/table/column-types/number.js:10`，页内同参 Intl 复算证实 `1234.5 → "1,234.5"`、`12345.678 → "12,345.68"`）。**期望字面值写错**；组件行为与改前一致（姊妹断言 cell-painters.js:444-445 `'12,345.68'` 通过），修复方向=改断言期望值，非改实现。
  2. `demo/src/data/canvas-table/self-checks/editor.js:472`：`assertEqual(controller.state.editing.props.options, column.options)` 用 `!==` 做引用相等，但 `state = reactive({ editing: null })`（`src/components/canvas-table/editor.js:335`）经深响应代理，读回的 `props.options` 是 Proxy ≠ 原数组。**注入本身是原引用**：前一条断言 `resolveSelectOptions(column) === column.options`（editor.js 自检 :462）已通过，`resolveEditorProps` 直传原引用（`editor.js:257-258` + `:236-238`），失败消息两侧 `[object Object],[object Object],[object Object]` 完全一致亦印证内容相等。断言方式错误（跨 reactive 边界做引用比较），修复方向=比内容（assertArray）或 `toRaw` 后比较。
- 其余新增断言质量合格：均断言精确值（映射优先 `'甲'`、仅 options `'低'`/未命中原值 `5`、number 命中终结不走 Intl、三级 options 来源、`(row, colIndex)` 契约 `[[3, 5]]`、映射文本精算行高 52/36 等），非仅"不抛错"。
- 验收 #4② 设计文案将 colIndex 3 标为"'启用'"，当前列序 colIndex 3 = 状态（映射列）、colIndex 8 = 启用；采样按 colIndex 3（状态映射文本）执行，阈值判定不受影响（该列格内文本恒存在）。

## 需人工检查

1. **验收 #5 基线决策（调度者）**：判定"无回退"必需改前基线。候选：独立 worktree 检出 7113e14 起临时 demo 服务按测试计划 #5 同口径采样，或裁定按"无基线单侧复测"豁免（改后数据已录本报告：M1 中位 0.8ms / M2 归一化中位 0.1037µs/行·列，scanCount 全对）。注意验证员边界禁止 checkout/worktree，须由实施/调度侧补采。
2. **验收 #6 人工抽样（上轮遗留，维持）**：核对压缩后注释未丢失关键算法锚点——Fenwick 倍增下降（row-geometry）、估高 1 行下界与精算同源 wrapLines、滚动锚定补偿、槽位锚公式与 +0.01 浮点容差（cell-painters）、bandToX/blankTail 派生式（painter）、blur 兜底三判据（editor）。

## 环境阻塞

1. **S0 改前性能基线缺失**（decisions.md 已裁定转需人工）：影响验收 #5"无回退"判定基线侧 → UNVERIFIED。改后单侧数据已采集完整。
2. **headless 隐藏页 rAF/scroll 挂起（已规避，记录备查）**：本环境 `document.visibilityState='hidden'`，`requestAnimationFrame` 与原生 scroll 事件不触发，程序化设 `scrollLeft` 后组件滚动链路（`canvas-table.vue:504-524` scrollFrame 为 rAF 调度）不执行，`getCellRect` 恒返回未滚坐标。规避：`browser_take_screenshot` 强制 BeginFrame 后 rAF/scroll 管线恢复（实测 flush 后 `getCellRect(0,9).x=964→764`、`lastPaint.colEnd=12`）。过程截图 `evidence/probe-scroll-frame.png`。属验证环境时序问题，非产品缺陷；人工在可见窗口复测不会遇到。
3. playwright mcp 本轮连接正常，未触发 decisions.md 的"连接失败沿用环境豁免"分支。

## 失败项（FAIL 时，不含环境阻塞）

1. **自检断言：无映射 number 列 Intl 期望值错误**——面板项 `[cell-painters]mappings/options 优先级：mappings 优先、仅 options 转换、未命中原值回退`。关键错误：`Error: 无映射 number 列保持 Intl 格式化`（期望 `'1,234.50'`，实际 `'1,234.5'`）。断言位置 `demo/src/data/canvas-table/self-checks/cell-painters.js:399`；口径依据 `src/components/table/column-types/number.js:10`（`minimumFractionDigits: 0`）。功能行为正确（`cell-painters.js:444-445` 对照断言通过），修复落点=断言期望值。
2. **自检断言：reactive 代理上做引用相等比较**——面板项 `[editor]仅 options 的 select：column.options 原样下拉、开值不字符串化、数值提交类型保持`。关键错误：`编辑器 options 注入原样 期望 [object Object]×3，实际 [object Object]×3`（内容相同、引用不同）。断言位置 `demo/src/data/canvas-table/self-checks/editor.js:472`；根因 `src/components/canvas-table/editor.js:335`（`reactive` 深代理）+ 断言未比内容/未 `toRaw`。注入链为原引用（`editor.js:464` → `:257-258` → `:236-238`），修复落点=断言方式。

影响：验收 #2①、#4①（"自检面板 0 failed"）不满足 → VERDICT: FAIL。两项均为本轮改动引入的**测试断言缺陷**，非组件功能缺陷；功能层证据（交互链、像素采样、构建、其余 167 项自检）全部通过。
