# 验证报告（终验，第 1 轮）

VERDICT: PASS

验证环境：demo 服务运行中发现（非本验证启动，无需关闭）；playwright mcp DOM 断言 + canvas 像素采样；node v24.15.0。任务目录：`agent-docs/plans/20261105-measure-perf-apply/`，证据在 `evidence/`。

## 上轮问题核对（第 2 轮起）

不适用（第 1 轮验证）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit 0 | dev + prod + ex-development + ex-production 全部产物（mussel.min.js 224.77 kB / mussel.ex.min.js 316.87 kB 等 4 组） |
| `npx eslint src` | exit 0 | 0 errors, 1 warning：`src/events/resize.js 60:1 complexity 12>10`（预存在，非本轮改动文件，04-impl.md 自检节同记录） |
| `npx stylelint "src/**/*.scss"` | exit 0 | 无输出，零报错 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| B1 demo 自检 216/216 0 FAIL（含 controller 模块） | 浏览器 | `:3000/data/table-ex/` 点「重跑自检」→ 面板「自检结果（216/216 通过）」；逐项统计 216 pass / 0 fail；模块分布 text-wrap 14 / row-geometry 16 / **row-geometry-controller 8** / tree 14 / spans 13 / theme 16 / layout 21 / cell-painters 51 / painter 23 / interactions 19 / editor 17 / data 4（`evidence/b1-selfcheck-summary.json`）。controller 8 断言覆盖派发点名的跳过/失效/重算全部场景（断言 1~8 与设计 §6 一一对应；派发写"6 断言"，实际 8 为超集，已满足） | PASS |
| B2 build / eslint / stylelint | 命令 | 见上表 | PASS |
| B3-1 recordsVersion 就地改值行高立即更新（P1 阻塞项专项，multiline 口径） | 浏览器 | multiline 场景基线 contentHeight 444、cell(1,1)=70（与 04-impl.md 基线一致）；就地改 `records[1].long10` + 点「recordsVersion++（仅通知）」→ contentHeight 444→516（+72 = 行 1 增量）、行 1 高 70→142，二次 notify 稳定不漂移（`evidence/b3-1-recordsversion.json`）。绝对值与实施记录（570/196）不同系无头浏览器 CJK 回退字体度量差（LONG_TEXT 实测折 7 行 vs 实施环境 ≥10 行钳制），行为判据（仅通知 → 行高立即增大、contentHeight 同步增量、重复通知稳定）完全一致 | PASS |
| B3-2 multiline 滚动锚定（格线不跳） | 浏览器 | 默认场景 100k，scrollTop 置 200000 后 12 帧合成 scroll：scrollTop 恒 200000、contentHeight 恒 3600206、viewRows 全程不变（`evidence/b3-2-b4-steady.json`）——无补偿扰动 | PASS |
| B3-3 编辑提交行高重估 | 浏览器 | multiline 行 1 列 1 真实鼠标点击开编辑器（textarea.mu-input 聚焦）→ Ctrl+A 替换「短文本」→ Ctrl+Enter → contentHeight 444→426、cell(1,1) 70→52、编辑器关闭、值已提交（`evidence/b3-3-edit-commit.json`），与 04-impl.md 逐字一致（`remeasureRow → remeasureVariableRow` 路径） | PASS |
| B3-4 树展开 contentHeight 变化 | 浏览器 | 树场景 360144 → collapseAll 72036（scanCount 2000）→ expandAll 360144（scanCount 10003、rebuild true），与 04-impl.md 一致（`evidence/b3-4-tree.json`） | PASS |
| B4-1 稳态滚动已见区域 `__valueCalls` 帧增量 0（视口外计数列口径） | 浏览器 | perf 列接线确认（18 列、尾列 width 4000）；稳态 12 帧增量全 0，采样前后 viewRows 不变（`evidence/b3-2-b4-steady.json`） | PASS |
| B4-2 估高段中位下降且 scanCount 不变 + 首扫混合口径裁决 | 浏览器 + 命令 | 见下方「B4-2 裁决」 | PASS |
| B4-3 lastPaint 稳态中位 ≤ 基线 ×1.1 | 浏览器 | 12 帧中位 0.9ms ≤ 1.3×1.1=1.43ms（`evidence/b3-2-b4-steady.json`；基线中位 1.3ms 取自 04-impl.md 同流程记录） | PASS |
| B5 list/link/text 列不回归（table-ex items 场景 + data/table DOM 版） | 浏览器 | items 场景 contentHeight 426、links/list/listLink 行高 [70,88,36,196]×3 列与 04-impl.md 锚点逐字一致（`evidence/b5-items-rows.json`）；canvas 点击链接条目 → `cell-item-click` payload 键 `item`（`{record:"#1",column:"links",item:{caption:"Mussel 文档"},recordIndex:0}`）；像素采样：list 全 link 列 primary 258px + teal 74px、list 全 text 列 primary 0（负向）、text.link 链色 primary（行 0=109px、行 1=93px）、danger 161px / disabled 置灰 319px（`evidence/b5-textlink-pixels.json`）；`/data/table/` DOM 版 0 console error、46 行、28 个链色 `<a>`、16 个 list-cell（`evidence/b5-dom-table.json`） | PASS |

### B4-2 裁决（04-impl.md「自检/遗留」首扫混合口径 283.4 vs 238.3ms）

按设计 §6 口径独立复采（数据规模 few↔full 切换 4 轮，`lastRelayout.elapsed − lastPaint.elapsed` 近似估高段）：

- 本验证空载复采：178.6 / 181.0 / 181.6 / 181.8，**中位 181.3ms**，方差极小（spread 3.2ms），scanCount 全部 = 100000（全量扫描确认）（`evidence/b4-2-firstscan-browser.json`）。显著低于实施记录的改后中位 283.4ms，也低于基线中位 238.3ms（−24%）。
- 本验证自查 node 同进程 A/B（100k×17 列估高本体，旧 = `git show HEAD:row-geometry.js`，新 = 工作区，交替 8 轮取中位）：**旧 89.03ms vs 新 41.70ms（−53.2%）**，且 heights 数组逐项一致（heightsEqual true）、模式判定一致（`evidence/b4-2-ab-node.json`，脚本 `evidence/ab-estimate-bench.mjs` 可复跑）。
- 结论：**判定为实施者采样期间的环境漂移/负载噪声，非估高回归**。两条独立证据链同向：空载浏览器口径低于基线；同进程 A/B 估高本体近半下降且产物逐字一致。04-impl.md 遗留 1 关闭。

## 范围核对

- 基线（00-task.md）：dev @ b3528d7，源码干净，仅 3 个未跟踪 agent-docs/plans/ 任务目录 → 本次脏文件全部为设计内改动，无"无法区分"项。
- `git status --short` / `git diff --stat`：8 个修改文件 + 1 个新增未跟踪文件，与设计 §5 改动清单逐一对上（`src/components/table/ex/{row-geometry,row-geometry-controller,text-wrap}.js`、`table-ex.vue`；`demo/src/data/table-ex/main-view.vue`、`self-checks/{index,row-geometry,text-wrap}.js`、`self-checks/row-geometry-controller.js`（新增））。8 文件合计 +416/−62 行。
- 未跟踪目录：3 个 agent-docs/plans/ 任务目录 = 基线已有，排除。
- 验证产物：`dist/`（build 产物，已 gitignore，不出现在 status）；`evidence/`（本验证输出）。
- 设计外改动：无。
- 验证期间未修改任何源码（仅向任务目录 evidence/ 写证据文件）。

## 测试质量问题

无。新增测试均真值断言而非"不抛错"：controller 8 断言以 `_value`/`render` 调用计数（如增量 0、恢复 10）、scanCount/rebuild、heightAt 精确值（36/52/70/106）、totalHeight 不回缩为判据（self-checks/row-geometry-controller.js:122-328）；P2 断言 0 回调调用与 0/1 行边界（低 rowHeight 主题 34/30）；P4 断言分词数组逐字相等与退化空串。

## 需人工检查

无（设计 §6 全部项均已按浏览器/命令手段自动化验证）。

## 验收入口（PASS 时必填）

- B1/B2 — 打开 `http://localhost:3000/data/table-ex/`，调试面板应显示「自检结果（216/216 通过）」，点「重跑自检」复核；命令行 `npm run build && npx eslint src && npx stylelint "src/**/*.scss"` 全部零 error。
- B3-1 — table-ex 页切「多行文本」场景，控制台执行 `window.__ctStage().records[1].long10 = '长文本'.repeat(50)`，点「recordsVersion++（仅通知）」→ 行高立即增大（状态栏 recordsVersion 变化，contentHeight 增大）。
- B3-3 — 多行文本场景点击行 1「maxLines=3」格，改短文本后 Ctrl+Enter → 行高立即收缩。
- B3-4 — 切「树」场景，点「collapseAll()」/「expandAll()」，内容区高度收缩/恢复。
- B4 — 默认场景（100000 行）打开「性能计数列」开关，控制台：`document.querySelector('.mu-table-ex__scroll').scrollTop = 200000`，稍候执行 `window.__valueCalls = 0` 并连续派发 scroll（`document.querySelector('.mu-table-ex__scroll').dispatchEvent(new Event('scroll'))`）→ `window.__valueCalls` 保持 0。
- B5 — 切「条目/新列型」场景观察 list/link/text.link 列渲染与条目点击；打开 `http://localhost:3000/data/table/` 看 DOM 版 link/list 列。

## 环境阻塞

无。说明两点（非阻塞）：① table-ex 页加载时的 1 条 console error `ERR_INVALID_URL @ data:image/png;base64,AAAA` 来自 `demo/src/data/table-ex/self-checks/cell-painters.js:758` 的自检故意坏图夹具（该文件本轮未改动，预存在）；② 本验证 multiline 数值（142/516）与实施记录（196/570）不同，系无头浏览器 CJK 回退字体度量差异，行为判据不受影响（详见 B3-1 行）。

## 失败项

无。
