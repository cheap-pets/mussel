VERDICT: PASS
# 验证报告 — 整体（第 1 轮）

## 上轮问题核对

首轮，无。

## 命令结果

| 命令 | 退出状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | 0 | dev + ex-development + ex-production 三段构建成功；`dist/mussel.ex.min.js 337.15 kB`，无 error/warning |
| `npx eslint src/components/table demo/src/data/table-ex demo/src/data/table/main-view.vue` | 0 | 0 errors, 2 warnings：`cell-tooltip.js:222`（complexity 11）、`use-cell-tooltip.js:146`（complexity 12），两文件本次未触碰（git status 证实），历史遗留，零新增 |
| `curl http://localhost:3000/data/table-ex/`、`/data/table/` | 0 | 均 200（常驻 watch 服务，未自启服务，无 PID 管理项） |
| node 基线比对（run1 vs baseline-selfchecks.txt） | 0 | 基线 246 条 → 当前 250 条；新增 4 条恰为 B1/B2/B4/C4 断言；仅 3 条用例内嵌度量数字差异（见下） |
| node 同环境二跑比对（run1 vs run2，零代码变更） | 0 | 同样 4 行漂移（createWrapCache measure 42/42→变、文本锚 font 13.2622px→变、字形锚墨迹 px→变、icons install 重跑态行）→ 非确定性实证，基线 3 条差异判为环境波动非行为变化 |
| playwright 断言（B1/B2/B3/B4） | 0 | 见「验收标准核对」，evidence：`evidence/verify-selfchecks-run1.txt`、`evidence/verify-selfchecks-run2.txt` |

注：验证命令按 00-task.md 的 eslint 口径执行并额外纳入本次改动的 `demo/src/data/table/main-view.vue`（超集口径，零新增告警结论一致）。

## 验收标准核对

| 标准 | 手段 | 证据（命令 / HTTP 响应 / evidence 路径） | 结果 |
|---|---|---|---|
| 1. B1：>10 条 tag 点击第 10 个 payload 为真实 tag 非 `'...'`，`onItemClick` 正常触发；link/list dots 不变 | self-checks 纯函数断言 + playwright 真实点击 | ① interactions.js 新用例「isCappedDotsItem：kind 门控」：link 超限末位 true / tag 恒 false / 非末位 false / 未超限 false / 缺省 10，250/250 通过；② 浏览器：`?scene=items`，真实拖宽「标签（彩色）」列 210→910（column-resize 事件证实），canvas 像素聚类定位 12 个 pill，真实鼠标点击第 10 个（cx 604）→ 事件日志 `cell-item-click {"record":"#4","column":"tags","tag":{"caption":"标签 10"},"recordIndex":3}`，非 `'...'`；③ 回归：同法点击「链接（三态）」record4 普通条目 → `item:{"label":"链接 9"}` 正常；点击末位 dots → `item:"..."`（行为不变） | PASS |
| 2. B2：函数 lineClamp 收真实 record、不抛 TypeError；editorType 单次求值 | self-checks（design-input 指定手段）+ 同路径浏览器实测 | ① editor.js 新用例「resolveEditorProps 第二参」：`_resolveMaxLines` 收到真实 record（`received.includes(record) === true`）、外部 editorType 透传不二次求值（`received.length` 不变）、select 注入一致、无第二参 raw column 兼容，通过；② 浏览器：`?scene=multiline` 真实点击可编辑 multiline 格（maxLines=3 列，同走 openEditor → editor.js:188 链路）→ 编辑浮层 TEXTAREA 打开、值装载正确、console 无 TypeError（函数形态 lineClamp 的可编辑组合 demo 无夹具，其链路由 ① 模块级断言覆盖） | PASS |
| 3. B3：`<mu-table>` 省略/空数组 columns 不抛 TypeError | playwright DOM 实测 | `http://localhost:3000/data/table/`「边界与回归」区 `:columns="[]"` 表格渲染为 0 表头单元格 / headerRow 1 / bodyRows 5（5 行 0 列），整页 16 表格全部挂载，console 仅 Vue dev build INFO、无 error；守卫代码 `base/table.vue:212` `columns.at(-1)?._ctrlClass.push('last-col')` | PASS |
| 4. B4：pointercancel 后监听释放、参考线清除、宽度按当前值提交 | self-checks composable 级 + playwright 浏览器级 | ① interactions.js 新用例「useColumnResize·pointercancel」：真实 PointerEvent 派发 window，断言参考线 `resizeGuideX` null、relayout×1、`column-resize` width=300 提交、后续 move 不再写几何（监听释放），通过；② 浏览器：真实手柄拖拽列 0（120→move 至 200）→ `getLayoutInfo().colWidths[0]` = 200 → 派发 `pointercancel` → 事件日志 `column-resize {"column":"name","width":200}`（按当前值提交）→ 再 move 至 250 列宽保持 200（监听已释放）；监听挂/摘：`use-column-resize.js:105-108,121-123` | PASS |
| 5. C1：六处取值链改引 `readCellValue`，不吞 `_mapText`，spans 分组键不变 | diff 逐处核对 + 全量 self-checks 回归 | `utils.js:11` 导出；改引处：`row-geometry.js`（valueOf，`_mapText` 取 `.text` 留调用点）、`spans-auto.js`（displayValueOf，映射对象留调用点）、`cell-content.js:124`、`use-cell-click.js` 两处（emitButtonItemClick / openEditorAt）、`editor.js`（rawValue）；六处与 git diff 一致，行为等价逐点核对（`typeof _value`→`?.` 与 `field != null` 为 design 指定最宽防御形态）；246 条基线用例全绿（含 row-geometry/spans 全部既有断言） | PASS |
| 6. C4：三处 orderBy 改引 `parseOrderBy`，首冒号语义保留，null/undefined 不变 | diff 核对 + self-checks 断言 | `utils.js:18` `replace(':', ' ')` 首冒号语义逐字保留；改引处：`base/table.vue` sortDirection（`if (!orderBy) return {}` 短路保留）、`paint-utils.js` sortDirectionOf（短路保留）、`click-resolve.js` resolveOrderByNext；新用例「parseOrderBy」：null/undefined → `['', undefined]`、`'a:b:c'` → `['a','b:c']`、无冒号、resolveOrderByNext 推进回归，通过 | PASS |
| 7. 全量：build 通过；eslint 零新增；self-checks 与基线逐字一致（新增断言除外） | 命令实测 + 基线比对 | build exit 0；eslint 0E/2W（均未触碰文件）；self-checks 250/250（基线 246 + 新增 4：B1/B2/B4/C4），差异仅 3 条用例内嵌度量数字（measure 计数 / 字体墨迹 px），同环境零代码变更二跑复现同等漂移（evidence run2）→ 环境非确定性，非行为变化 | PASS |

## 范围核对

check-scope skipped（本任务无 02-design.md，派发已声明预期）→ 按派发注记采用人工核对口径（git diff/status 对照 design-input.md，基线 HEAD 710d515 脏文件仅任务目录自身）：

- 清单内已改（14 个）：`utils.js`、`base/table.vue`、`ex/interaction/click-resolve.js`、`ex/composables/use-cell-click.js`、`ex/composables/use-column-resize.js`、`ex/editing/editor-resolve.js`、`ex/editing/editor.js`、`ex/geometry/row-geometry.js`、`ex/spans/spans-auto.js`、`ex/cell-paint/cell-content.js`、`ex/table-paint/paint-utils.js`、`demo/.../self-checks/interactions.js`、`demo/.../self-checks/editor.js`、`demo/src/data/table/main-view.vue` — 与 04-impl「改动文件」逐一对应，git status 无额外修改文件。
- 清单内未改：无 — design-input 各条目指名文件全部发生改动，无 [范围遗漏]。`demo/README.md` 未改属合理（B3 断言加在现有 base table demo 页内，未新增页面，项目约定仅页面增删需同步清单）。
- 清单外改动：无。不做清单红线未触碰：C2/C3 无任何相关改动；C5 仅 `editor-resolve.js:43-45` 处注释说明（design 明示允许），raw 兼容分支代码未动；tag +n pill 协议未动；无结构拆分/搬移；agent-docs 仅任务目录自身文件（00/04/05、design-input、decisions、evidence）。
- 附注：仓库根 `baseline-selfchecks.txt` / `after-selfchecks.txt` 为 implementer 声明的 untracked 验证辅助采集文件，非业务源码，不构成越权改动。

## 测试质量问题

无。新增 4 条 self-check 均为实质行为断言：B1 断言 5 种边界（kind 门控/非末位/未超限/缺省 maxItems）；B2 以 `_resolveMaxLines` 调用计数证明单次求值并断言真实 record 透传；B4 以真实 window PointerEvent 序列断言监听释放（后续 move 几何冻结）；C4 覆盖 null/undefined/`'a:b:c'`/无冒号/next 推进。

## 需人工检查

无。设计未标注「人工」标准；无视觉/交互手感遗留项。

## 验收入口（PASS 时必填）

- 标准 1（B1）— 打开 `http://localhost:3000/data/table-ex/?scene=items`，拖「标签（彩色）」表头右缘至约 900px 宽，点击第 10 个真实 tag，页面「事件日志」出现 `cell-item-click {"...","column":"tags","tag":{"caption":"标签 10"},...}`（非 `'...'`）
- 标准 3（B3）— 打开 `http://localhost:3000/data/table/`，滚到「边界与回归」区，`columns: []` 表格（5 行 0 列）正常渲染无报错
- 标准 2/4/6 与 B1 纯函数（self-checks）— 打开 `http://localhost:3000/data/table-ex/`，滚到「调试面板」确认「自检结果（250/250 通过）」，可点「重跑自检」复核
- 标准 7 — 复制执行：`npm run build`；`npx eslint src/components/table demo/src/data/table-ex demo/src/data/table/main-view.vue`

## 环境阻塞 / 输入缺失

无。demo 站 ：3000 常驻服务直接可用；playwright MCP 可用，全部浏览器断言亲测执行。02-design.md 缺失已由派发以 design-input.md 代替声明（check-scope skipped 属预期，范围核对已按人工口径降级完成）。decisions.md 为空，无已确认约束，决策冲突 0。

## 失败项

无。
