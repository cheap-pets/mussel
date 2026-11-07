# 实施记录

依据 02-design.md（R 终订版）实施步骤 0–5 顺序整体实施；改动范围 = 设计「改动清单」9 文件，无清单外改动。

## 改动文件

| 文件 | 设计步骤 / 验收 |
|---|---|
| `demo/src/data/table-ex/main-view.vue` | 步骤 0：`single` 场景——`singleLineColumns = createAlternateColumns()` 稳定引用、radio 选项、`?scene=` 白名单（`SCENE_WHITELIST`，非白名单回退 `default`）、`stageColumns` 加 `case 'single'`（records/spans/tree/fixed 走既有 default 分支） | 
| `src/components/table/ex/shared/text-wrap.js` | 步骤 1（AC4）：`createWrapCache` 改 Map LRU——get 命中 delete+set 触碰、set 已存在键重插、超限单步 `if` 淘汰最旧（`cache.keys().next().value`，不用 while——limit ≤ 0 时空表死循环防护）；接口与 `WRAP_CACHE_LIMIT` 不变 |
| `demo/src/data/table-ex/self-checks/text-wrap.js` | 步骤 1：改写末条「整体清空」断言为 LRU 语义（size=limit、最旧淘汰重算、get 触碰改变淘汰序、limit=0 不挂死、存活键二次 wrapLines 免测量） |
| `src/components/table/column-types/list.js` | 步骤 2（AC2）：`ListColumn.compile` 返回值改命名函数 `render`，compile 作用域内 `if (!dom) render.count = …` 挂一次；count 复用闭包 `getItems/normalizeEntries/max`，`shown = max ? entries.slice(0, max) : entries` 与渲染逐字同表达式（非 Math.min） |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 步骤 2：新增 `.count` 产物断言（canvas 挂 / dom 不挂、非数组与空 entries 0、空 label 过滤、负/小数/字符串 max slice 同源、count ≡ 渲染 items.length、LinkColumn 委托单值/数组/max 截断） |
| `src/components/table/ex/geometry/row-geometry.js` | 步骤 3（AC2+AC3）：① `isEntryColumn` 导出别名（实现同 `isLinkColumn` 不动）；② `linkItemCountOf` 优先 `typeof col._render?.count === 'function'` 走 `Math.min(count(record, value) || 0, maxItems)`，无 count 回落现状全产物路径；③ `computeRowHeights` 循环前由 `rowMetricsOf(theme)` 算 `flat = rowHeight ≥ padding*2 + lineHeight`，flat 时非条目列跳过 `valueOf`（count 记 0），非 flat 走现状分支 |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | 步骤 3：新增 ① count 通道（带 `.count` 的 `_render` 估高/精算 render 主体零调用 spy、每格 count 恰 1 次、maxItems 钳制、无 `.count` 回落现状）；② 免取值（flat 36/8/18 夹具 `_value` spy 0 次、heights 全 36；非 flat rowHeight=30 夹具逐格取值、34/30 行高差保留） |
| `src/components/table/ex/geometry/row-geometry-controller.js` | 步骤 4（AC1）：import `isEntryColumn`；`resolveForRelayout` 在 `if (columnsChanged) lastScanColumns = columns` 之后、`isScanDirty` 判定之前插入短路谓词 `mode === 'uniform' && !spans && columns.every(col => !isEntryColumn(col) && !((col._maxLines ?? 1) > 1) && !col.multiline)` → 写回 `lastScanRows/lastScanColumnSig/lastScanMetricsSig/lastScanSpans` 后返回 `{ geometry: resolveGeometry(rows, theme), scanCount: 0, rebuild: false }`；spans 缓存重置与 `syncMeasuredHeightCache` 照常先行 |
| `demo/src/data/table-ex/self-checks/row-geometry-controller.js` | 步骤 4：新增夹具 `createSingleLineFixture`（全确定单行列）与 `createUpgradableFixture`（uniform + 条目列全单条目 + relayout spy），新增 ① 短路（首扫 0 / uniform 保持 / rows 替换后仍 0）；② 条件破坏四路径（列加条目列 / `_maxLines>1` 候选列 / spans 非 null（buildSpans 真实 SpansIndex）/ mode 已 variable）均恢复全量扫 `scanCount = 6`；③ 升级路径（`remeasureRow` → `remeasureUniformRow` 升级 variable + relayout 恰 1 次 → 重扫 scanCount 4 / rebuild true / 行 1 高 70） |

## 偏离

1. **设计步骤 0 的「优化前基线采集」（浏览器实测）未执行**：本实施环境工具集不含 playwright MCP，按派发约束「连接失败记录环境阻塞、不代验」处理。基线以源码推导记录：`?scene=single`（100000 行、全确定单行列）在短路实现前每次脏判定必全量扫 → `lastRelayout.scanCount === 100000`；行高 = uniform 模式恒 `rowHeight` 36（`resolveGeometry` → `uniformGeometryOf({ rowHeight: theme.rowHeight || 36, rowCount })` 算式确定，步骤 0–4 全程不变）。**此为推导值非实测值**；测试计划 1 的「与优化前基线逐值一致」对比项同样待浏览器可用时执行。属环境阻塞，非设计错误（设计引用的接口/符号/行为事实已逐项源码核对一致，见「自检」）。
2. 其余无偏离。设计行号锚点逐项核对：list.js shown 表达式（原 :111-112）、controller isScanDirty（:146-151）/upgradeToVariable（:125-130）/lastScanColumns 更新（:324）、row-geometry rowHeightOf/rowMetricsOf（:129-139）、text-wrap 双重 get（:275）、cell-content.js:94 `col._render = createColumnRender(...)` 直挂 compile 产物（`.count` 随之携带、`use-cell-click.js:218` 仅调用不受影响）。

## 自检

| 检查 | 命令 / 方式 | 结果 |
|---|---|---|
| 语法 | `node --check` × 8 个改动的 .js 文件（4 src + 3 自检 + main-view 不适用） | 全部通过 |
| 纯函数自检模块 Node 直跑 | 临时 alias loader（`C:\Users\scrol\AppData\Local\Temp\mussel-verify\`，stub .vue/.scss/~icons + vite defines），运行 text-wrap / row-geometry / row-geometry-controller 三模块全部断言 | **43/43 PASS**（含全部新增断言与既有断言无回归） |
| count 产物语义 Node 直验 | 同环境直调 `ListColumn.compile` / `LinkColumn.compile` 断言 max=3/4/-1/2.5/'2'、空值门控 0、过滤、dom 不挂、count ≡ items.length、link 单值/委托 | COUNT-PROBE ALL PASS |
| 打包编译（全图） | rollup watch 自动重编译：`demo/dist/data/table-ex/main.js` 重建于 13:26:07，含 `case "single"`、全部新增自检断言串 | 通过——main-view.vue + 4 自检文件 + 4 src 文件全部编译进 bundle（任一文件编译错即不落盘） |
| stylelint | `npx stylelint "src/**/*.{scss,css,vue}" --fix`（设计指定） | 退出码 0，零差异 |
| 改动面 | `git status --short` + `git diff --stat` | 恰为设计清单 9 文件（530 insertions / 14 deletions）+ 既有 `todo/misc.md`（基线内，未触碰） |

自检执行过程发现并修复 2 处**自检夹具问题**（非源码缺陷）：spans 破坏场景初版用裸对象使 `spanHeightRoleOf` 抛错 → 改 `buildSpans` 真实 SpansIndex；且 buildSpans「无有效区域返回 null」需配同值 autoRowSpan 列保证非 null。

浏览器验证（测试计划 1/2/3/5/6 浏览器项）：**环境阻塞**——playwright MCP 不在本实施环境工具集，未执行、不代验；dev 服务在运行（`http://localhost:3000/data/table-ex/` HTTP 200）。

## 遗留

1. 浏览器侧断言全部待 verifier / 用户在具 playwright MCP 的会话执行：`?scene=single` 首绘与换行数 `scanCount === 0`、行高与基线（推导值 36）逐值对比、items 场景 cell-item-click/hover 命中区/dots payload 回归、自检面板 11 模块全绿、default 10 万行可交互与分场景 scanCount（default 首绘 100000 / 替换列 100000 / single 0）。
2. 设计既述语义变化（非缺陷）：demo 性能计数列 `window.__valueCalls` 在 scan 期随免取值变为 0（仅精算期有值）；repo 内无断言消费，profiling 知识页口径更新留任务收尾按用户确认处理（不在本片改动清单）。
3. default 场景（含 list 列）首绘仍全量扫（mode 只升不降），收益来自 AC2 计数通道 + AC3 免取值；表级短路只覆盖 uniform 确定单行表（AC1 口径），`?scene=single` 为其唯一可达载体。
4. 本轮实施在 Node 直跑中未覆盖的浏览器-only 自检模块（cell-painters 新增断言的 DOM/canvas 断言路径已在 Node 验证其 `.count` 语义本体；产物断言本身待浏览器自检面板跑绿确认）。
