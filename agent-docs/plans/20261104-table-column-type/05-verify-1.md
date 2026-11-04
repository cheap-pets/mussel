# 验证报告（终验 · 第 1 轮）

VERDICT: FAIL

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build`（项目根） | exit 0 | 4 次 vite build 全部 ✓ built：base dev 283 modules（dist/mussel.js 415.31 kB）、base prod（mussel.min.js 224.86 kB）、ex dev 301 modules（mussel.ex.js 677.06 kB）、ex prod（mussel.ex.min.js 315.87 kB） |
| demo 服务可用性（curl 预检） | 200 | http://localhost:3000/data/table/ → 200；http://localhost:3000/data/table-ex/ → 200（服务已运行，直接访问，未自行启动打包） |
| 构建产物核对 | 一致 | dist 产物 demo 实际引用的 /assets/catalog.js 含 `col.type === "link" \|\| col.type === "list"` 分发与 `ColumnTypes.list`（:22991）、`.mu-table__list-cell` —— demo 跑的是本次实施后代码 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 text.link 渲染 + color→class | 浏览器 | /data/table/：缺省行 td class `mu-table__td text-primary mu-table__cell-link`、teal 行 `text-teal mu-table__cell-link`；CSSOM `.mu-table__cell-link:hover { text-decoration: underline }`、常态 textDecorationLine=none；/data/table-ex/ DOM 参照表同款 class（evidence/dom-data-table.md、dom-table-ex.md）。canvas 链色目检 → 需人工 | PASS（canvas 目检留需人工） |
| A2 danger 不新增 + 数组拒绝 | 浏览器 + 代码审查 | text.js:44-45 注释 + 全文无 danger 分支；/data/table/ 边界回归段 text/无 type 数组值 → 单元格 "-"（占位），td 无 list-cell/link 类 | PASS |
| A3 multiline/lineClamp 保留 | 浏览器 | long 列 div class `text-danger mu-table__cell-link pre-line line-clamp` + style `--line-clamp: 2` | PASS |
| A4 list 列渲染 + link 项 | 浏览器 | /data/table/：list 单元格 `.mu-table__list-cell`；`{link:true}` → `a.text-primary`、color 变体 → `a.text-teal`/`a.text-danger`；纯文本 → `span` 无色类；标量值 → "-" 占位；caption 兼容渲染正常；/data/table-ex/ 参照表同款；canvas 竖排像素行带 [50-60]/[68-78]/[86-96] 3 条目（evidence/dom-table-ex.md） | PASS |
| A5 每项单行省略 | 浏览器 + 目检 | computed：display block / white-space nowrap / text-overflow ellipsis / overflow hidden；offsetTop 8→98 每项一行；超长探针 scrollWidth 3360 > clientWidth 607（截断发生，探针验后移除）。canvas 逐条省略目检 → 需人工 | PASS（canvas 目检留需人工） |
| A6 cell-item-click payload | 浏览器 | DOM 面 /data/table/ 全 PASS：link 项 `item={"label":"链接项","link":true}`、纯文本项、附加键 `{"label":"附加键链接","id":42,...}`（附加键保留）、dots `item="..."`、column 为原始列引用（field/caption 正确）；disabled 条目 pointer-events:none + 真实鼠标点击日志不变（dispatchEvent 绕过 hit-test 不算数）。canvas 面 FAIL，见失败项 2 | PASS（DOM）/ FAIL（canvas） |
| A7 link 兼容共用 list 实现 | 浏览器 + 代码审查 | link.js 仅含映射 + 委托 ListColumn.compile（:44-57），无自有渲染逻辑；DOM：渲染为 `.mu-table__list-cell` 竖排、danger→`text-danger`、color:teal→`text-teal`、disabled 置灰拦截、单值 12345 包装渲染；payload `item={"caption":"危险链接","danger":true,"color":"danger"}`、column.field=links 原始列引用 | PASS |
| A8 build + demo DOM 验证 | 命令 + 浏览器 | npm run build exit 0（4/4 ✓）；A1~A7 DOM 断言全过；self-checks 面板 199/201 通过 ≠ 0 FAIL（设计全局检查要求 0 FAIL） | FAIL（self-checks 2 用例） |
| A9 table-ex 数组支持移除 | 浏览器 + 代码审查 | cell-painters.js:219-226 isArrayValueRejected 门控（:239 置于 _plainText 短路前）；drawArrayLines / drawTextValue 数组分支 / tooltip 数组分支全删（grep 0 命中）；row-geometry.js:116 数组恒 1 行、:340-341 变高仅 isLinkColumn && count>1；DOM 参照「text 数组值（占位）」列落占位；strings/nums 已改 list 列（listOption.max:3）正常渲染；row-geometry/spans self-check 用例通过（失败项仅在 cell-painters 模块）。canvas 区目检 → 需人工 | PASS（canvas 目检留需人工） |

## 范围核对

- 基线排除项：`src/styles/link.scss`（M，基线内用户改动，实施未触及 ✓）、`agent-docs/plans/20261104-table-ex-measure-perf/`（基线内未跟踪目录）
- 验证产物：`.playwright-mcp/`（playwright 工具产生，git status 未列出 = 已被 ignore）；`dist/`（npm run build 产物，git status 未列出 = 已 ignore）
- 无法区分：无
- 设计外改动：无——14 个 M 文件 + 新增 `src/components/table/column-types/list.js` 全部在 02-design.md 改动清单内；`agent-docs/plans/20261104-table-column-type/` 为本任务文档目录

## 测试质量问题

1. self-checks stub `THEME_COLORS` 语义色 color 用 17 色位置公式生成（cell-painters.js:71-72），与真实 theme.js 语义色路径（读 `--mu-{name}-color`，primary 与 primaryColor 同源）不同源——stub 中 `colors.primary.color`（rgba(140,60,200,1)）≠ `primaryColor`（rgba(0,102,255,1)），真实主题两者相等。该不一致在旧实现（无 color 不查表）下从未暴露，新实现的查表路径使其显形。
2. 「list 列竖排」用例的竖排坐标/文本/dots/payload 断言充分；「list link 条目缺省 primary」断言期望值口径（THEME.primaryColor）与实现口径（colors 查表）在 stub 下不可同时成立，需二选一对齐（见失败项 1a）。

## 需人工检查

1. canvas 链色目检（A1）：/data/table-ex/「条目/新列型」场景 canvas 区 text.link 列「链色文本」「危险文本」呈主色/红色（decisions 第 8 条仅链色文本、无 hover 下划线），与 DOM 参照表并排比对。
2. canvas list/link 竖排与逐条省略目检（A5/A9）：list 列 3 条目竖排、超限 dots（第 4 行 12 条目 > maxItems 10 显示 '...'）、text 数组值列不拆行（DOM 参照为准）。
3. link 列 canvas 条目点击的时序复测（见失败项 3）：不同操作序列（直接点击 / 先滚动 / 先 hover / 场景切换后点击）下 link 列条目 cell-item-click 是否稳定触发。

## 验收入口（FAIL，供修复轮复验参考）

- A1~A7 DOM 面：浏览器开 http://localhost:3000/data/table/ 「list 列 / text.link」section —— list 表三态结构（span 无色类 / a.text-primary / a.text-danger / disabled 置灰）、text.link 表 td class（text-primary/text-teal + mu-table__cell-link）、link 兼容表 danger→text-danger、点击条目看日志 span payload（键 item）。
- A9：http://localhost:3000/data/table-ex/ 默认场景 DOM 参照表「text 数组值（占位）」列落占位；「边界与回归」段数组值表 "-"。
- A8：`npm run build` exit 0。
- self-checks：/data/table-ex/ 点「重跑自检」→ 面板应 201/201（当前 199/201）。

## 环境阻塞

无（demo 服务可用、构建可用、playwright 可用；canvas 目检项按设计「未解问题 1」本就无 DOM 断言手段，列需人工非阻塞）。

## 失败项

1. **self-checks 非 0 FAIL（A8 全局检查，2 用例，均本次实施引入）**：
   - a. [小问题→夹具] `[cell-painters] link 列竖排…`：断言「list link 条目缺省 primary 期望 #0066ff，实际 #8c3cc8」。位置 demo/src/data/table-ex/self-checks/cell-painters.js:1523 + stub :68-79。根因：stub `THEME_COLORS.primary.color`（17 色公式值）与 `THEME.primaryColor` 不同源，真实主题同源（theme.js readColors 语义色读 `--mu-primary-color`）；真实渲染行为正确，属断言/夹具口径缺陷，修夹具或对齐断言即可。
   - b. **[致命→实现回归]** `[cell-painters] linkHoverColorOf…`：断言「默认 → colors.primary.hover 期望 rgba(140,130,245,0.85)，实际 rgba(0,102,255,1)」。位置 src/components/table/ex/cell-painters.js:700-708（对照 HEAD :711-716）。根因：HEAD 版对无 danger 条目恒查 `colors.primary` 谱系（hover ?? color ?? primaryColor），本次改写后无 color/danger 时 palette=null 直接回退 `theme.primaryColor`，丢失默认悬停谱系——老式自定义 kind:'link' 条目（无 color/danger/link 字段）hover 色从 primary.hover 变为常态 primaryColor，违反设计「老式自定义 kind:'link' 条目行为不变」承诺（02-design.md 风险节）。断言 :1748 为 HEAD 既有断言被新实现打破。
2. **A6 canvas 面 list 列条目点击失效（A4/A6/A7 canvas 共用链路）**：/data/table-ex/「条目/新列型」场景，list 列条目点击（y 内容 30~140 共 26 点扫描 + 精确坐标 + hover 预热 + refreshTheme + 重跑自检 + 真实/合成点击）均仅触发 cell-click，无 cell-item-click；hover cursor 为 default。对照：links 列（同 drawLinkItems/kind 'link' 产物）上次会话点击成功且 cursor=pointer，同批次对比下 list 列不命中。绘制侧正常（像素行带证实 3 条目竖排文本与 links 列同分布）。疑似位置：条目命中链 painter 收集/查询——src/components/table/ex/painter.js（drawCellClipped :462-486 收集、paintRegion :1225-1240 脏区分支）、src/components/table/ex/interactions.js:327-378（resolveItemClick）、src/components/table/ex/table-ex.vue:912-945（hover）/1093-1097（点击）；源码逐层（cell-painters.js:413 分发含 'list'、drawLinkItems :1087 全条目 report、list.js canvasItemOf kind 'link'）未发现与 link 列的差异点，行为证据确凿、根因未闭合，需实施方进一步定位。
3. **附加发现（既有 link 列，非本次新增验收项，但污染 A6/A7 canvas 对照）**：刷新页面后 link 列条目点击也失效（本会话全程无法复现上次会话的成功点击），存在操作序列/时序依赖；上次成功样本 payload 结构正确（键 item、含 recordIndex）。与失败项 2 疑同根（itemHits 填充批次时机），定位建议同上；修复验证时一并复测 link/list 两列。
