# 探针基线（批次 2A 前，行为冻结快照）

依据：知识库 `agent-docs/knowledge/project/table-ex-refactor-frozen-probe.md` 流程 + decisions.md「轮 2（批次 2A）实施前须先采集探针基线（当前状态即 2A 前状态），验证时逐字比对」。本文件为批次 2A Edit 源码**之前**采集的行为冻结基线，批次 2A 后由验证员逐字比对。

## 采集元数据

- 采集时间：2026-11-06T16:48–16:49 UTC（playwright 时间戳）
- 工作区状态：HEAD + 批次 1 改动（22 文件，未提交）+ 前任务（20261106-ex-fixed-select-hover-span）未提交改动；批次 2A 改动零落地（采集时 `editing/` 仅 editor.js + editor-resolve.js，`shared/` 无 cell-identity.js）
- 服务：`npm run demo:build`（vite demo build --watch，后台任务 exec_3258a31b）；构建输出 `✓ 485 modules transformed` / `built in 645ms`；静态服务 `http://localhost:3000`
- 采集工具：playwright mcp（browser_navigate + browser_console_messages + browser_find + browser_evaluate）；console 原文落盘 `.playwright-mcp/console-2026-11-06T16-48-37-009Z.log`（table-ex 页）
- 采集操作：页面加载（无交互操作）；自检面板为页内调试面板随页加载自动执行

## 1. 构建序摘要（watch 首建产物，table-ex 相关）

```
✓ 485 modules transformed.
built in 645ms.
demo/dist/data/table-ex-scene/style.css    0.15 kB
demo/dist/data/table-ex-basic/style.css    0.27 kB
demo/dist/data/table-ex/style.css          3.04 kB
demo/dist/data/table-ex-basic/main.js     12.86 kB │ gzip:  3.99 kB
demo/dist/data/table-ex-scene/main.js      8.41 kB │ gzip:  2.96 kB
demo/dist/data/table-ex/main.js          454.30 kB │ gzip: 112.51 kB
```

## 2. 自检面板（页面 http://localhost:3000/data/table-ex/ 内嵌调试面板）

- 面板标题文本：`调试面板`；说明行：`自检结果（self-checks 各模块断言 + 数据生成器断言）/ 重绘计数与 lastPaint 统计 / 主题快照；实例接入（S1）前统计显示为占位`
- 计数：`自检结果（232/232 通过）`；`.ct-check-item` = 232；`.ct-check-item--fail` = 0；文本含 `✗` 项 = 0
- 模块分布（断言文本前缀 `✓[<module>]` 计数，合计 232）：

| 模块 | 数 | 模块 | 数 |
|---|---|---|---|
| text-wrap | 14 | layout | 21 |
| row-geometry | 16 | cell-painters | 57 |
| row-geometry-controller | 8 | painter | 32 |
| tree | 14 | interactions | 19 |
| spans | 13 | editor | 18 |
| theme | 16 | data | 4 |

## 3. Console 原文序列（逐字）

### 页 /data/table-ex/（TableEx 画布表格）

汇总：46 行 = INFO 1 条（Vue dev build 提示，2 行）+ WARNING 43 条（Canvas2D ×38 + icon 夹具 ×5）+ ERROR 1 条（无效图片夹具）。以下逐字（毫秒时间戳为采集时序证据，比对时以消息原文与顺序为准）：

```
[      71ms] [INFO] You are running a development build of Vue.
Make sure to use the production build (*.prod.js) when deploying for production. @ http://localhost:3000/assets/catalog.js:8839
[     100ms] [WARNING] [MUSSEL:Icon] Icon "demoGlyphA" has been installed repeatedly with the same content. @ http://localhost:3000/assets/catalog.js:13502
[     100ms] [WARNING] [MUSSEL:Icon] Icon "demoGlyphB" has been installed repeatedly with the same content. @ http://localhost:3000/assets/catalog.js:13502
[     232ms] [WARNING] Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently @ http://localhost:3000/data/table-ex/main.js:4543
[     233ms] [WARNING] （同上 Canvas2D 原文） @ http://localhost:3000/data/table-ex/main.js:4544
[     240ms] [WARNING] （同上） @ …/main.js:4543
[     261ms] [WARNING] （同上） @ …/main.js:4598
[     263ms] [WARNING] （同上） @ …/main.js:4544
[     283ms] [WARNING] [MUSSEL:Icon] Invalid icon "noRegEntry1793983717291": unregistered icon name. Please register it via installIcons first. @ http://localhost:3000/assets/catalog.js:13502
[     305ms] [WARNING] （Canvas2D 同上） @ …/main.js:7306
[     306ms] [WARNING] （同上） @ …/main.js:7319
[     312ms] [WARNING] （同上） @ …/main.js:7319
[     318ms] [WARNING] （同上） @ …/main.js:7331
[     319ms] [WARNING] （同上） @ …/main.js:7331
[     325ms] [WARNING] （同上） @ …/main.js:7331
[     330ms] [WARNING] （同上） @ …/main.js:7319
[     338ms] [WARNING] （同上） @ …/main.js:7331
[     339ms] [WARNING] （同上） @ …/main.js:7331
[     343ms] [WARNING] （同上） @ …/main.js:7331
[     344ms] [WARNING] （同上） @ …/main.js:7331
[     348ms] [WARNING] （同上） @ …/main.js:7331
[     349ms] [WARNING] （同上） @ …/main.js:7331
[     354ms] [WARNING] （同上） @ …/main.js:7331
[     355ms] [WARNING] （同上） @ …/main.js:7331
[     358ms] [WARNING] （同上） @ …/main.js:7319
[     362ms] [WARNING] （同上） @ …/main.js:7331
[     368ms] [WARNING] （同上） @ …/main.js:7319
[     373ms] [WARNING] （同上） @ …/main.js:7331
[     380ms] [WARNING] （同上） @ …/main.js:7319
[     388ms] [WARNING] （同上） @ …/main.js:7331
[     392ms] [WARNING] （同上） @ …/main.js:7319
[     395ms] [WARNING] （同上） @ …/main.js:7319
[     400ms] [WARNING] （同上） @ …/main.js:7331
[     405ms] [WARNING] （同上） @ …/main.js:7331
[     408ms] [WARNING] （同上） @ …/main.js:7331
[     417ms] [WARNING] （同上） @ …/main.js:7319
[     421ms] [WARNING] （同上） @ …/main.js:7319
[     424ms] [WARNING] （同上） @ …/main.js:7319
[     427ms] [WARNING] （同上） @ …/main.js:7331
[     439ms] [WARNING] （同上） @ …/main.js:7331
[     442ms] [WARNING] （同上） @ …/main.js:7319
[     446ms] [WARNING] （同上） @ …/main.js:7319
[     450ms] [WARNING] [MUSSEL:Icon] Icon "editGateProbe1793983717458" may have the same content as icon "iconProbeSvg". @ http://localhost:3000/assets/catalog.js:13502
[     450ms] [WARNING] [MUSSEL:Icon] Invalid icon "noRegEdit1793983717458": unregistered icon name. Please register it via installIcons first. @ http://localhost:3000/assets/catalog.js:13502
[     703ms] [ERROR] Failed to load resource: net::ERR_INVALID_URL @ data:image/png;base64,AAAA1:0
```

（注：`（同上）` 处 Canvas2D 警告文本与本文件上方第 1 条 Canvas2D 逐字相同；逐字节原文存档于 `.playwright-mcp/console-2026-11-06T16-48-37-009Z.log`（46 行），逐字比对以该文件为准。）

关键锚点（批 1 验证记录同口径）：

- ERROR 1 条：`Failed to load resource: net::ERR_INVALID_URL @ data:image/png;base64,AAAA1` —— cell-painters 无效图片夹具（失败路径测试），既有夹具非缺陷
- WARNING 中无 `v-on with no argument` / `ReferenceError` / `is not defined` / `Cannot find` 类错误
- icon 警告 5 条：demoGlyphA、demoGlyphB（重复安装同内容）、noRegEntry1793983717291（未注册名）、editGateProbe1793983717458（同内容提示）、noRegEdit1793983717458（未注册名）——均为自检夹具有意触发的失败路径
- Canvas2D willReadFrequently 警告 38 条（main.js 行号 4543/4544/4598/7306/7319/7331，为构建产物内位置，随构建序漂移属正常；比对以条数与文本为准）

### 页 /data/table-ex-basic/（TableEx 画布表格（基础））

- Console：0 error、0 warning（1 条 INFO：Vue dev build 提示，同上）

### 页 /data/table-ex-scene/（TableEx 画布表格（场景））

- Console：0 error、0 warning（1 条 INFO：Vue dev build 提示，同上）

## 4. 比对口径（供验证员）

1. 自检计数：`232/232 通过`、fail 0、✗ 0、模块分布 12 模块计数与本文件 §2 一致。
2. Console：三页 error/warning 条数与文本逐字一致（时间戳与 main.js 行号允许漂移）；无新增 error / warning 类型。
3. 构建序：watch 构建成功、485 modules 量级、table-ex 三页产物生成。
4. Canvas2D 行号（main.js:4543 等）为产物内位置，批次 2A 改动后随模块序漂移属预期，不作为不一致判据。
