# 验证报告（终验 · 第 2 轮，R1 修复后全量复验）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

| 上轮失败项 | 结论 | 证据 |
|---|---|---|
| 1a self-checks「list link 条目缺省 primary」stub 口径 | **已解决**：R1-2 stub `PRIMARY_COLOR`/`PRIMARY_HOVER` 常量同源化后，self-checks 面板实测 201/201、0 FAIL | evidence/dom-table-ex-2.md「self-checks 面板」节 |
| 1b linkHoverColorOf 丢失 `colors.primary.hover` 回退（实现回归） | **已解决**：cell-painters.js:709-711 无 color/danger 条目回退 `theme?.colors?.primary` 谱系（`palette?.hover ?? palette?.color ?? theme?.primaryColor`），`item.link === false` 分支保持 textColor；self-checks `linkHoverColorOf` 用例（HEAD 既有断言）在 201 用例内通过 | cell-painters.js:704-712 + evidence/commands-2.md 代码审查锚点 |
| 2 canvas list 列条目点击失效 | **已解决（验证侧坐标口径 + 真实缺陷已修）**：按 04-impl-修复-1.md 遗留 2 的条目 rect 坐标口径（`getCellRect(row,col).left+20/.top+18`，非列中心、非条目带外区）复测，四操作序列 × 三列 12/12 稳定触发 `cell-item-click`（payload 键 `item`、含 `recordIndex`）；修复轮另发现并修复的真实缺陷（list 非 link 列条目 cursor=pointer）经逐列断言 links/listLink=pointer、listText/textLink=default | evidence/dom-table-ex-2.md「canvas 点击复测」「光标断言」节 |
| 3 既有 link 列点击时序依赖 | **已解决**：与失败项 2 同批复测覆盖，links 列在直接点击 / 先滚动 / 先 hover / 场景切换四序列下均触发 | 同上 |

上轮「测试质量问题」2 条（stub 口径、断言期望二选一）随 1a 一并解决；本轮无新增测试质量问题。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build`（项目根） | exit 0 | 4 次 vite build 全部 ✓ built：base dev 283 modules（mussel.js 415.04 kB）、base prod（min.js 224.77 kB）、ex dev 301 modules（mussel.ex.js 677.82 kB）、ex prod（ex.min.js 315.93 kB） |
| demo 服务可用性（curl 预检） | 200 | /data/table/ → 200；/data/table-ex/ → 200（服务已运行，直接访问，未自行启动打包） |
| `npx eslint <14 个改动文件>` | exit 0 | 0 error / 3 warning（max-len 既有行：table-ex main-view:217、spans.js:336、data-table main-view:16；spans.js:336 经 git diff -U0 核对不在本轮改动区 :406-435） |
| `npx stylelint src/components/table/column-types/style.scss` | exit 0 | clean |
| self-checks 面板（重跑自检） | 201/201 | 0 FAIL |
| 页面构建标记 | 最新 | /data/table/ 含「list 全 text / list 全 link」表；/data/table-ex/ 默认场景含「list 列 / text.link / text 数组值（占位）」列（规避 04-impl-修复-1.md 偏离 2 模块缓存问题） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 text.link 渲染 + color→class | 浏览器 | /data/table/：td class `mu-table__td text-primary mu-table__cell-link`、teal 行 `text-teal mu-table__cell-link`；真实 hover 后 `text-decoration-line: underline` + `cursor: pointer`；/data/table-ex/ 参照表同款 class；canvas 像素采样 list 全 link 列主色蓝（32,128,208）/ teal 绿（48,176,128）佐证链色 | PASS（canvas 视觉终判留需人工） |
| A2 danger 不新增 + 数组拒绝 | 浏览器 + 代码审查 | text.js:44 注释、全文无 danger 分支；:50 `if (!value \|\| Array.isArray(value)) return null`；边界回归段「名称（text 数组值）」「数量（无 type 数组值）」两列 td `-` 占位、无 list-cell/cell-link 类 | PASS |
| A3 multiline/lineClamp 保留 | 浏览器 + 代码审查 | 多行 link 夹具 div class `text-danger mu-table__cell-link pre-line line-clamp` + `-webkit-line-clamp: 2` + overflow hidden；text.js:38/:11-27/:55 lineClamp 分支与原实现同构，无 link 时产物不变（本页无独立无-link 多行列，该子项以代码同构性为证） | PASS |
| A4 list 列渲染 + 列级 link（最新语义） | 浏览器 | /data/table/：全 text 列条目全 SPAN 无色类（含遗留 `{label, link:true}` 条目 → SPAN 负向断言）、标量值 `-` 占位、dots SPAN；全 link 列（column.link）条目全 A + `text-primary` 缺省/`text-teal`/`text-danger` 变体、disabled 置灰、dots A；/data/table-ex/ 参照表同款；canvas 行高变高（r0=70/r1=88）+ 像素采样正文灰 vs 链色佐证 | PASS |
| A5 每项单行省略 | 浏览器 | computed：display block / nowrap / ellipsis / overflow hidden；探针 scrollWidth 672 > clientWidth 607（截断发生，验后移除）；offsetTop 8→26→44 每项一行；canvas 逐条省略目检留需人工 | PASS（canvas 目检留需人工） |
| A6 cell-item-click payload（键 item） | 浏览器 | DOM 面：link 项 `item={"label":"遗留 link 键项","link":true}`（原引用）、附加键 `{"label":"附加键链接","id":42}`、dots `item="..."`、兼容列 danger 映射 `{"caption":"危险链接","danger":true,"color":"danger"}`、column 均为原始列引用（field/caption 正确）、disabled 点击无日志；canvas 面：四序列 × 三列 12/12 触发，payload 键 `item` + `recordIndex` | PASS |
| A7 link 兼容共用 list 实现 | 浏览器 + 代码审查 | link.js:44-58 仅映射 + 委托 ListColumn.compile（顶层 `link: true` + `_raw`），无自有渲染逻辑；DOM：渲染为 `.mu-table__list-cell` 竖排、danger→`text-danger`、color:teal→`text-teal`、单值 12345 包装、disabled 置灰拦截、payload 键 `item` | PASS |
| A8 build + demo DOM 验证 | 命令 + 浏览器 | `npm run build` exit 0（4/4 ✓）；A1~A7 DOM 断言全过；self-checks 201/201（0 FAIL，设计全局检查达标）；eslint 0 error；stylelint clean；caption 兼容警告每次页面加载 1 次（once 去重） | PASS |
| A9 table-ex 除 list 外无列类型接受数组 | 浏览器 + 代码审查 | cell-painters.js:219-226 isArrayValueRejected（type null/''/字符串且非 link/list/tag/button → `{}`，非字符串 type 豁免）、:239 置于 _plainText 短路前；`drawArrayLines`/`GRAPHIC_ITEM_TYPES`/`isTextPresentingColumn` grep 0 命中；row-geometry.js:116 数组恒 1 行、:340-341 变高仅 `isLinkColumn(col) && count > 1`；editor.js:38 NON_EDITABLE_TYPES 含 'list'；DOM 参照「text 数组值（占位）」落占位；multiline 场景 strings/nums 为 list 列（demo 源码 :717-724 同类）+ self-checks row-geometry 用例通过 | PASS（canvas 区目检留需人工） |

## 范围核对

- 基线排除项：`src/styles/link.scss`（M，基线内用户改动，实施未触及，派发明示不算越权 ✓）、`agent-docs/plans/20261104-table-ex-measure-perf/`（基线内未跟踪目录）
- 本任务文档目录：`agent-docs/plans/20261104-table-column-type/`（未跟踪，本报告与 evidence 所在）
- 验证产物：`.playwright-mcp/`、`dist/`（git status 未列出 = 已 ignore）
- 无法区分：无
- 设计外改动：无——15 个 M 文件 + 新增 `src/components/table/column-types/list.js` 全部落在 02-design.md 改动清单 + R1 修复轮文件集合内（interactions.js 属 R1-4 文件集合；interactions/table-ex/cell-painters 三处 cursor/link 门控改动已在 04-impl-修复-1.md「改动文件」记录）

## 测试质量问题

无新增。上轮 2 条（stub 口径不一致、断言期望与实现口径二选一）已随 R1-2 同源化解决。

## 需人工检查

1. canvas 链色目检（A1）：/data/table-ex/「条目/新列型」场景 canvas 区 list 全 link 列整列链色、text.link 列链色文本（无 hover 下划线）——本轮已有像素采样佐证（primary 蓝 / teal 绿 / 正文灰分列正确），视觉终判人工比对 DOM 参照。
2. canvas 竖排与逐条省略目检（A5）：list 列 3 条目竖排、12 条目行 dots（canvas `_maxItems` 层）、超长条目逐条省略——本轮以变高行高（70/88）与 DOM computed 断言佐证，形态终判人工。
3. canvas text 数组值列不拆行目检（A9）：canvas 区该列恒单行占位（DOM 参照为准）——self-checks row-geometry 用例 + row-geometry.js:116 代码为证，目检确认即可。

## 验收入口（PASS）

- A8：项目根执行 `npm run build`，4 次 vite build 退出码 0。
- A1/A2/A3/A4/A5/A7 DOM 面：浏览器开 `http://localhost:3000/data/table/` 的「list 列 / text.link」section——list 全 text 表（条目 SPAN 无色类、遗留 link 键条目仍 SPAN、标量行 `-`）、list 全 link 表（条目 A + text-primary/teal/danger、禁用项置灰）、text.link 表（td class `text-primary mu-table__cell-link`，hover 出下划线）、link 兼容表（danger→text-danger）。
- A6：同页点击 list 条目，日志 span 显示 `cell-item-click` payload（键 `record`/`column`/`item`；dots 项 `item="..."`；disabled 项点击无日志）。
- A4/A6/A7 canvas 面：`http://localhost:3000/data/table-ex/` 切「条目/新列型」场景，点击 links/list/listLink 三列条目（注意点击坐标须落在条目文本带上，如单元格左上角向内 ~20px 处；点列中心或 padding 带不触发属预期），事件面板出现 `cell-item-click`（payload 键 `item`、含 `recordIndex`）。
- A8 self-checks：/data/table-ex/ 点「重跑自检」→ 面板 201/201。
- A9：/data/table-ex/ 默认场景 DOM 参照表「text 数组值（占位）」列落占位；/data/table/「边界与回归」段数组值表 `-`。

## 环境阻塞

无（demo 服务可用、构建可用、playwright 可用）。

## 失败项

无。
