# 验证报告（第 3 轮）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

上轮（05-verify-2.md）FAIL 项 2 个（均为自检断言自身缺陷）、UNVERIFIED 1 项（验收 #5 基线缺失，decisions.md 已裁定转需人工）、测试质量小问题 1 项。逐项核对：

| 上轮项 | 本轮结论 |
|---|---|
| FAIL 1：cell-painters 自检 Intl 期望值错误（cell-painters.js:399 期望 `'1,234.50'`） | **已解决**。修复已落地：期望值改为 `'1,234.5'` 并补注 `minimumFractionDigits: 0` 口径（`demo/src/data/table-ex/self-checks/cell-painters.js:399-401`）；所属面板检查项 `[cell-painters] mappings/options 优先级…` 本轮浏览器实测 ✓ |
| FAIL 2：editor 自检跨 reactive 边界引用比较（editor.js:472） | **已解决**。修复已落地：改为 `toRaw(controller.state.editing.props.options)` 解代理后比原引用，新增 `import { toRaw } from 'vue'`（`demo/src/data/table-ex/self-checks/editor.js:474`、`:32`）；所属面板检查项 `[editor] 仅 options 的 select…` 本轮浏览器实测 ✓ |
| 自检面板 0 failed（验收 #2①/#4①） | **已满足**：面板本轮实测 `自检结果（169/169 通过）`，0 failed |
| UNVERIFIED：验收 #5"无回退"缺改前基线 | **维持 UNVERIFIED（需人工）**。S0 基线缺失（decisions.md 裁定转需人工）；改后单侧第 3 轮复测完成（数据见验收 #5 行），与第 2 轮改后数据同量级（M1 中位 0.8→0.7ms，M2 归一化 0.1037→0.1066µs/行·列，+2.8% 属环境噪声，两轮均为改后侧无对比意义） |
| 测试质量小问题：`numericEnumColumn` 命名残留 | 仍在（`demo/src/data/table-ex/self-checks/editor.js:858`、`:860`，实为 number+mappings 夹具）。维持上轮裁定：命名问题非功能缺陷，不判 FAIL |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS (exit 0) | dev：`✓ 297 modules transformed`、`dist/mussel.js 615.79 kB`、`✓ built in 526ms`；prod：`dist/mussel.min.js 294.51 kB`、`✓ built in 548ms`。验证收尾时（工作区出现外部改动后）**复跑第二次**仍 exit 0（`dist/mussel.min.js 294.97 kB`、`✓ built in 576ms`） |
| `grep -rn "enum" src/components/table-ex/` | PASS (exit 1=无命中) | 0 命中 |
| `grep -rn "enum" demo/src/data/table-ex/` | PASS (exit 1) | 0 命中（`numericEnumColumn` 命名残留属 `-i` 变体口径，见上轮核对） |
| `grep -rn "onImageLoad" src/ demo/src/data/table-ex/self-checks/` | PASS（P1b 契约） | 闭包仅建于 img 分支：`cell-painters.js:721`、`:1147`（均 `() => onImageLoad(row, colIndex)`）；`painter.js:358` 直传 `state.onImageLoad`；`painter.js:799`/`:1124-1125` 为 hover/relay 单次转发；self-checks 零参回调兼容 + 新契约断言 `[[3, 5]]`（self-checks/cell-painters.js:609） |
| `grep -n "recordKeyOf" src/components/table-ex/painter.js` | PASS（P1a） | `painter.js:251` 行级一次求值（paintBodyRow 内，`state.flatInfo ? recordKeyOf(...) : null`）；drawCellClipped 无逐格调点 |
| 注释扫描（node 脚本：6 个 .js 源文件 + table-ex.vue `<script>` 提取，`//` 连续块与 `/* */` 块按物理行 >3 输出） | PASS | `ALL CLEAN`（0 输出） |
| `node --check`（6 个源 .js + 6 个 self-checks .js + index） | PASS | 全部 OK |
| demo 服务 + HTTP（本次启动：`node node_modules/vite/bin/vite.js build --config vite.demo.config.js --watch`，bash 包装 PID 1258 → 实际 node 进程 PID 19100（`Get-CimInstance` 确认命令行一致），日志 `evidence/demo-watch-3.log`；验证结束已 `taskkill //PID 19100 //F`，`POST_KILL=000`、端口无监听） | PASS | `/data/table-ex/` → 200 且 `<title>TableEx 画布表格 - Mussel Demo`；`/data/table-ex/main.js` → 200，内容含 59 处 `mappings`、`等级` 列 |
| 浏览器 console | 信息 | 唯一 error = `data:image/png;base64,AAAA1` 加载失败——self-checks 失败路径夹具的**故意**坏 src，非缺陷；其余 30+ 条为 getImageData `willReadFrequently` 性能提示（良性） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. table-ex 源码无 enum 处理逻辑 | 命令 | `grep -rn "enum" src/components/table-ex/` 0 命中（本轮重跑） | PASS |
| 2. mappings 显示映射生效且优先；options 编辑下拉；仅 options 按转换映射 | 浏览器 + demo 自检 | ① 自检面板 **169/169 通过，0 failed**（上轮 2 个失败项所在检查项均 ✓，见上轮核对）。② 等级列（colIndex 9，`type:'number'` + options）：scrollLeft=200 → `getCellRect(0,9).x=764 ∈ [0,956)`、`lastPaint.colEnd=12` → 合成点击开编辑器 → `.mu-table-ex__editor` 内 `.mu-select` 存在 → 展开 `.mu-dropdown-panel .mu-option` = **低/中/高** → 点"中" → 事件日志 `update:cell-value {"record":"#1","recordIndex":0,"field":"level","value":2}`（value 为未字符串化的 number 2）→ 点名称列（colIndex 2，`getCellRect(0,2).x=104`）→ 事件 `cell-click column:"name"`、编辑器关闭 ✓。③ 状态列（colIndex 3，mappings 派生）：scrollLeft=0 同法开 select → 选项 = **启用/待处理/已归档**（无 default）（截图 `evidence/03-status-dropdown-options.png`） | PASS |
| 3. `npm run build` 通过 | 命令 | exit 0，dev + prod 两次 `✓ built`；外部改动入工作区后复跑仍 exit 0 | PASS |
| 4. demo 页渲染正常：映射列显示映射值、编辑下拉编辑态正常 | 浏览器 | ① 自检面板 169/169（同上）。② 像素采样（getImageData，lum<100，格内 4px 缩进，dpr 换算）：col3 状态映射列 row0 = **82 > 30** ✓；横滚 colIndex 9 可见后显示"低"的行（row3，`records[3].level=1`）= **34 > 30** ✓（row0/row1 本轮数据 level=2 显示"中"= 20、row2 level=3 显示"高"= 53——数据生成器随机取值，上轮 row0 恰为 level=1；同字符暗像素两轮一致：34/20/53）；空值占位列（colIndex 13）横滚至可见（scrollLeft 钳制 568，x=836）row0 = **0 < 10** ✓（对照 col10 row0 = 16）。截图：`evidence/03-level-column-visible.png`、`evidence/03-placeholder-column.png`。③ 交互同 #2②③ | PASS |
| 5. 性能量化复核无回退 | 浏览器（playwright evaluate 采样） | 改后单侧第 3 轮复测：默认场景 100k 行 × 14 列，复位滚动后连续 7 次 `props.records = records.slice()`，每次等 100ms 读 `getLayoutInfo()`。M1 `lastPaint.elapsed` = 0.8/0.7/0.5/0.7/0.8/0.7/0.8 ms → **中位 0.7ms**（上轮改后 0.8ms）；M2 `lastRelayout.elapsed` = 170.2/183.7/149.3/145.7/147.7/153.8/146.7 ms → 中位 149.3ms，归一化 `elapsed/(scanCount×14)` = 0.1216/0.1312/0.1066/0.1041/0.1055/0.1099/0.1048 µs → **中位 0.1066µs/行·列**（上轮改后 0.1037）；`scanCount=100000` 7/7 核对通过（无签名跳扫）。**"无回退"（改后 ≤ 基线 ×1.10）仍无法判定：S0 改前基线缺失**（decisions.md 裁定转需人工，见需人工项 1） | UNVERIFIED（基线缺失 → 需人工，decisions.md 环境豁免） |
| 6. 改动代码注释每段 ≤3 行；复杂度重构点有说明 | 命令 + 人工 | 命令部分：7 个源文件注释块扫描 ALL CLEAN（本轮重跑）；R1-R5 在 02-design.md 方案概述第 4 条列明。人工抽样部分见"需人工检查"2 | PASS（人工抽样另列） |

## 范围核对

- 基线：mussel-table @ 7113e14（`git log` 确认未提交、无新 commit），无基线脏文件。
- **本任务实施改动集**（与 02-design.md 改动清单逐一对应，无多无少）：12 M（src 6 + demo 6）+ `?? src/components/table-ex/mappings.js`。文件 mtime 21:32-22:35（实施轮 + 修复轮时点），table-ex 目录内文件本轮验证期间（22:36 后）**零变化**。
- `git diff --stat`（table-ex 12 文件部分）：main-view.vue 13 / sc-cell-painters 134 / sc-editor 188 / sc-layout 5 / sc-painter 6 / sc-row-geometry 27 / table-ex.vue 82 / cell-painters 417 / editor 464 / layout 195 / painter 343 / row-geometry 124——与上轮报告的 757/1239 量级一致（修复轮在 2 个 self-checks 增加少量行）。
- 未改动清单核对：theme/text-wrap/tree/interactions/row-geometry-controller/use-tree-rows/use-column-resize/constants/index.js（table-ex 的）、self-checks/index.js 等 mtime 均为 10 月早期，0 改动。
- 验证产物：`dist/`、`demo/dist/`（.gitignore 已忽略）；`.playwright-mcp/` 已被既有 `.playwright-mcp/.gitignore` 忽略；`evidence/` 在任务目录内。
- 无法区分：无（两批改动经 git status 时间线 + mtime 完全可区分）。

### ⚠ 验证期间出现的外部工作区变更（非本任务产物，交调度者确认）

本轮验证执行期间（第一次 `git status --short` 约 22:38 无这些文件 → 收尾 22:47 出现；文件 mtime 22:43:38-22:46:14），工作区新出现 **9 个与 table-ex 零交集的改动**：

| 文件 | 状态 | diff 量 |
|---|---|---|
| `src/components/tag/tag.vue` | 新增（??） | 549 字节新组件 |
| `src/components/index.js` | M | +2（注册 MuTag） |
| `src/components/tag/tags.vue` / `tags.scss` | M | +4 / +7 |
| `src/components/table/column-types/tag.js` | M | +7（追加 `mu-faint-{color}` 类） |
| `src/components/table/column-types/style.scss` | M | +5 |
| `src/styles/tag.scss` / `tones.scss` | M | +36 / +2（`mu-solid--` → `mu-solid-` 类名） |
| `demo/src/basics/badge/main-view.vue` | M | +22 |

定性：内容为 MuTag 新组件与 tag 着色体系改动（tag.js 注释提及 table-ex 的 class 解色机制，但改动不在 table-ex 目录），不在 04-impl.md / 04-impl-修复-2.md 的改动与偏离记录中——**非本任务任何实施轮次的产物，疑似同工作区并行任务/用户操作**。不计为本任务实施的设计外越界（本任务实施集与设计清单完全一致）。影响评估：本报告全部浏览器证据在页面加载（22:39，早于外部改动）后连续采集（事件日志 #1→#9 编号连续，页面未被刷新），跑的是 table-ex 任务产物 bundle；`npm run build` 在含外部改动的最新工作区复跑仍通过。

## 测试质量问题

- 上轮 2 项断言缺陷已修复，修复方向正确（改断言不改实现），浏览器实测通过。
- `numericEnumColumn` 命名残留维持上轮裁定：小问题，不判 FAIL。
- 本轮无新增测试质量问题。测试计划 #4② 设计文案将 colIndex 3 标为"'启用'"（实际 colIndex 3 = 状态映射列、colIndex 8 = 启用）沿用上轮记录；另 #4② 指定格 `getCellRect(0,9)` 的"低"依赖数据行取值，数据生成器随机 level 使指定行字符不固定（本轮 row0=2→"中"），判据按"显示'低'的行暗像素 > 30"执行（本质断言"映射文本被绘制"不受影响）。

## 需人工检查

1. **验收 #5 基线决策（调度者，上轮遗留，维持）**：判定"无回退"必需改前基线（HEAD 7113e14 上按测试计划 #5 同口径采样），或裁定按"无基线单侧复测"豁免。改后数据已两轮采集（第 2 轮：M1 中位 0.8ms / M2 归一化中位 0.1037µs/行·列；第 3 轮：0.7ms / 0.1066µs/行·列，scanCount 均 7/7=100000）。注意验证员边界禁止 checkout/worktree，须由实施/调度侧补采。
2. **验收 #6 人工抽样（上轮遗留，维持）**：核对压缩后注释未丢失关键算法锚点——Fenwick 倍增下降（row-geometry）、估高 1 行下界与精算同源 wrapLines、滚动锚定补偿、槽位锚公式与 +0.01 浮点容差（cell-painters）、bandToX/blankTail 派生式（painter）、blur 兜底三判据（editor）。

## 环境阻塞

1. 无。playwright mcp 本轮连接正常，全部浏览器手段已执行。
2. 备查（已规避，非缺陷）：headless 隐藏页（`visibilityState='hidden'`）下 rAF/scroll 挂起，程序化设 `scrollLeft` 后组件滚动链路（rAF 调度）不执行；沿用上轮规避——`browser_take_screenshot` 强制 BeginFrame 后生效（实测 `getCellRect(0,9).x` 964→764、`lastPaint.colEnd` 9→12）。过程截图 `evidence/03-scroll-flush.png`。人工在可见窗口复测不会遇到。

## 失败项（FAIL 时，不含环境阻塞）

无。

## 判定说明

- 6 条验收标准：#1/#2/#3/#4/#6 PASS；#5 UNVERIFIED（S0 改前基线缺失，decisions.md 已裁定转需人工，属任务约定的环境豁免范畴）。
- 上轮 2 个 FAIL 项均已解决并有浏览器实测证据（自检面板 169/169）。
- 验证期间出现的外部工作区变更（tag/badge/tones 9 文件）经时间线与 mtime 证实非本任务实施产物、与 table-ex 零交集，不计为实施的设计外越界；已在"范围核对"单列，请调度者确认其归属。
