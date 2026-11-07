# 交叉回应（第 1 轮）

## 交叉回应（第 1 轮）

| 位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| 台账 #1（短路写回 `lastScan*`） | 接受 | 保留 amender 版本。核对：`isScanDirty`（controller:146-151）与 `rescanRowHeights` 首四行写回（controller:176-180）逐字段对应；`columnsChanged` 为假时 `columnSig` 直接取 `lastScanColumnSig`（controller:320），故写回 `columnSig` 在脏/不脏两种情形均与基线逐字段一致；反例 A→B→A 中「不写回」确实产生 `isScanDirty` 假而谓词假（A 含 link 列）的状态，虽结论上 uniform heights 弃用仍等价，写回后论证链更短 |
| 台账 #2（count 用 `slice` 表达式） | 接受 | 保留 amender 版本。核对：渲染 `const shown = max ? entries.slice(0, max) : entries`（list.js:112）+ `items: shown.map(...)`（list.js:124/130）；`max=-1` 时 `Math.min(len,-1)=-1`（truthy，`\|\| 0` 不触发）而渲染 `slice(0,-1)` 丢末条，`max` 小数时 `Math.min` 产非整型 count，两条路径计数均可偏离 `items.length` → 行高分歧 |
| 台账 #3（新增 `single` 场景 + 步骤 0 基线） | 接受 | 保留 amender 版本。核对：mode 只升不降（controller:125-130、193-195）；默认场景 list 列（main-view.vue:491-498）+ 前 5 行 3 条目（:397-399）→ 首绘 `count=min(3,10)=3>1` → `hasArrayValues` → 首绘即 variable，「替换列」（:533-536）只换列不降 mode，`scanCount=0` 不可达；`createAlternateColumns()`（:506-514）全列无 link/list/maxLines/multiline/autoRowSpan，single 场景 `spans=null` 成立（buildSpans 无 spanMethod 且无 autoRowSpan 时返回 null，spans.js:77） |
| 台账 #4（LRU 单步 `if` + `createWrapCache(0)` 防挂死） | 接受 | 保留 amender 版本。核对：现状 clear-all（text-wrap.js:291-293）在 limit=0 时 size 恒 ≤ 1 可写入；`while (size >= limit)` 在 limit≤0 空表上死循环；单步 `if` + `cache.delete(cache.keys().next().value)`：空表 delete(undefined) 无害返回 false，set 后 size=1，limit=0 下 size ≤ 1 与现状一致且不挂死 |
| 未解决异议（累计） | 无 | 交叉记录声明无 |
| 终订自查补充（测试计划 5） | 修正 | 「demo `/table-ex/`」路径不完整 → 改为「`/data/table-ex/`」（demo 两级目录路由：`demo/src/data/table-ex/` → URL `/data/table-ex/`，demo/README.md 目录结构；测试计划 1 已用 `/data/table-ex/?scene=single`，两处统一） |

终订符号级自查结论：改动清单 9 行逐符号核对源码现状全部一致（文件:函数:行为见下），不改源码；除上表 URL 一处外无需再改。

- `text-wrap.js createWrapCache`（:286-299）：接口 `{ get, set, size }`、`WRAP_CACHE_LIMIT`（:16）不变，仅内部换 Map LRU
- `list.js ListColumn.compile`（:87-136）：`getItems`/`normalizeEntries`/`max` 闭包（:88-100）、返回匿名函数（:102）改命名 `render` 后 `if (!dom)` 挂 `count`，dom 通道（link.js:55 透传 `dom`）不挂
- `row-geometry.js`：`isLinkColumn`（:21-23）别名导出 `isEntryColumn`、`linkItemCountOf`（:55-62）优先 count、`computeRowHeights`（:318-377，complexity 豁免 :316-317）flat 分支
- `row-geometry-controller.js resolveForRelayout`（:306-336）：短路插在 `lastScanColumns` 更新（:324）之后、`isScanDirty` 调用（:326）之前，依赖变量 `rows/columns/spans/columnSig`（:307-320）均已就绪
- demo 自检 4 文件均存在且已 import 相关符号（row-geometry.js 手写 `_render` 夹具 :286/:338/:358/:378/:406、controller 自检现有 scanCount 断言 :154-156/:315-317、cell-painters 已 import ListColumn/LinkColumn :51-52）
- `main-view.vue`：stageColumns switch（:1065-1079）加 `case 'single'`，scene radio（:70-80）与 scene ref（:1011）同步加选项
