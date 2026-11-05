# 验证报告（终验，第 1 轮）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

不适用：第 1 轮验证，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
| --- | --- | --- |
| `npm run build` | 退出 0 | dev+prod 与 ex dev+min 四产物全部 built（mussel.min.js 228.75 kB / mussel.ex.js 691.95 kB / mussel.ex.min.js 321.84 kB 等），无报错 |
| `eslint src demo/src`（NODE_PATH=/usr/local/lib/node_modules，全局 8.57.0） | 退出 1（4 error / 20 warning） | 4 error 全部位于未触碰文件且经 `git show HEAD:<file> \| eslint --stdin` 复核为基线预存在：`demo/src/data/table-ex/main-view.vue:344,346` import/first、`demo/src/data/table-ex/self-checks/cell-painters.js:49` no-unused-vars、`:2288` no-template-curly-in-string。20 warning 中涉及本任务触碰文件的仅有：`demo/src/data/table/main-view.vue:16` max-len（基线同行长度 241>120，现 250，同一 note 行预存在超长）、`ex/cell-painters.js` 6 条（measureItem/drawItem/drawButtonLink/buttonsOverflowOf complexity + 2 max-len，与 HEAD 基线逐条相同仅行号平移）。新文件 `column-types/button.js` 0 error 0 warning（单测退出 0） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| 1. type:'button' 注册生效、无废弃警告 | 浏览器+命令 | `column-types/index.js:32` 注册 `button: ButtonColumn`；`/data/table-ex/` 自检面板 223/223，含「canvas 类型分发：progress/button 产 canvasKind」✓（self-checks/cell-painters.js:966-981 经生产 prepareColumn 链断言 `b1.canvasKind==='button'`，即注册表路径）；`/data/table/` console 0 error，无 button 相关 warn/废弃警告；两页 button 列均出按钮结构 | PASS |
| 2. 多按钮 + 字段结构一致 | 浏览器 | `evidence/ex-button-columns.png`：「按钮」列 row1 渲染 clock 图标 pill、demoGlyphA 图标 pill、「编辑」「删除」(红) 共 4 pill；点击红「删除」pill → 事件日志 `#1 cell-item-click {"record":"#1","column":"buttons","button":{"caption":"删除","color":"red","icon":"noRegBtnGlyph"},"recordIndex":0}`（button 为原对象、column.field='buttons'）；点击「禁用」disabled pill 仅 cell-click + update:selected-record(-key)，无 cell-item-click | PASS |
| 3. link 形态一致 | 浏览器 | 「链接按钮」列纯文字链无 pill 底/边框、icon-only 行渲染图标、C(grape)/删除(red)/详情(indigo) 染色正确（canvas 像素：link「编辑」primary 蓝 x 669..735、「删除」red x 745..771）；hover「删除」出现连续下划线（y=63 红色横带 28px，`evidence/ex-link-hover.png`）；点击 link「删除」payload 与 pill 形态完全一致 | PASS |
| 4. dom 通道条目协议 + events 可选 | 浏览器 | `/data/table/` button 列 section DOM 断言：pill 表 7 枚 `button.mu-button.mu-button--small` 全部 caption 文本可见（无空按钮，text 槽条件化生效）；`mu-button--primary/secondary/danger` 各 1、超出色 'warning' 条目无 color 类（缺省形态）；禁用条目带 `disabled` 属性 + `pointer-events: none`（elementFromPoint 命中 TD）；icon-only 条目内含 svg；caption+icon 条目仅文本；link 表 7 枚含 `mu-button--link`（bg/border transparent，pill 表对照实色底 rgb(28,126,214)）；点击日志 `button 列 record.id=1 column.field=buttons button={"caption":"主色","color":"primary"}`、文本优先条目 payload 保留原对象 icon 键、disabled 真实坐标点击日志无变化；console 无 `v-on with no argument`、无 Invalid prop | PASS |
| 5. table 统一 column-types | 命令+浏览器 | `grep -rn "button" src/components/table/base/` 仅命中 `base/table-row.vue:22` 模板注释（提及 mu-button 的说明），无任何 button 列类型定义/分发；`/data/table/` 的 `type:'button'` 渲染出 `button.mu-button` 结构即注册表路径（TextColumn 回退不会产生该结构） | PASS |
| 6. table-ex 行为不回退 | 浏览器 | 自检 223/223（self-checks 零改动即冻结基线，含「button 绘制：色板/disabled 两态取色、条目矩形回报 itemHits…center/right 分布 + 窄列平移」✓）；固定列组合场景按钮列（滚动区）pill 渲染与截断正常（`evidence/ex-fixed-scenario.png`）；点击 payload 四键（record/column/button/recordIndex）与 disabled 无日志如上；console 无 button 相关 warn。子项说明见「需人工检查」1/2 | PASS |
| 7. build + demo 可验证 | 命令 | `npm run build` 退出 0；eslint 4 error 均基线预存在（见命令结果）；`/data/table-ex-basic/` 第二张表（typeColumns 14 列含「按钮」列，main-view.vue:165）横向滚动后「编辑」「删除」(红)「详情」pill 渲染正常（`evidence/ex-basic-scrolled.png`），console 0 error、无 button warn | PASS |

## 范围核对

`git status --short` / `git diff --stat` 与设计「改动清单」逐文件对照：

- 基线排除项：`demo/src/data/table-ex-basic/main-view.vue`（decisions.md 启动确认，与本任务无关，保留原样未动——diff 内容与任务前基线一致）。
- 流水线产物排除：`agent-docs/plans/20261105-column-button-type/`（任务目录本身，本项目 dev-pipeline 约定 .pipeline 目录等价物）。
- 验证产物：`dist/` 构建产物已被 .gitignore 忽略（git status 未出现）；截图仅写入任务 `evidence/`。
- 无法区分：无。
- 设计外改动：无。改动 8 文件（7 改 + 1 新增 `column-types/button.js`）与设计改动清单完全一致，无清单外文件。
- 并发片白名单：本次为整体单片实施（I1），无跨片。

## 测试质量问题

- 项目无测试框架（AGENTS.md 约定 demo 页验证），无新增自动化测试文件，与设计一致。
- 冻结 self-checks 自动改走新路径构成回归网：「canvas 类型分发」断言（self-checks/cell-painters.js:966-981）经生产 prepareColumn → resolveColumnType → ButtonColumn.compile 链验证 canvas 产物字段；「button 绘制」断言验证取色/itemHits/窄列平移。
- demo 夹具断言了验收标准的实质内容（类名结构、color 变体、disabled 属性+pointer-events、icon svg、caption 优先、点击 payload 键与原对象、disabled 无日志），非仅"不抛错"。测试计划「回归」行全页扫描无意外空单元格（空缺仅 Dave 行 tags:[]/无 icon 值与 text.link 表各记录自带字段的夹具合法空；mappings section 性别列不映射为 20261104 enum 独占变更后的既有夹具漂移，实施记录遗留 4 已声明，与本任务无关）。

## 需人工检查

1. **table-ex canvas「title: true 溢出 tooltip」**（测试计划验收 6 子项）：demo 各 button 列均未配 `title: true`（grep 证实），无夹具可自动断言。tooltip 链路（`ex/table-ex.vue:632` tooltipEnabled、`:953` scheduleCellTooltip）本次零触及，自检 223/223。人工步骤：给 `/data/table-ex/` 条目/新列型场景「按钮」列临时加 `title: true` → 横向滚动使溢出 pill 行可见 → hover 溢出单元格 → 应弹出 tooltip。
2. **DOM link 形态 hover 下划线视觉口径**：测试计划「hover 色变 + 下划线」中下划线已在 canvas 侧验证（y=63 下划线像素）；DOM 侧 hover 色变已验证（danger rgb(240,62,62)→rgb(252,110,106)），但 MuButton link 样式本无下划线（`button/button.scss:134-139` 仅透明底/边框）——这是人工意见 1-1（直接用 mu-button）裁决接受的能力现状，设计未定义 DOM 下划线。人工确认视觉可接受即可。

## 验收入口（PASS 时必填）

- 验收 1/2/3/6 — 打开 `http://localhost:3000/data/table-ex/`（demo watch 常驻 3000），夹具场景切「条目/新列型」，横向滚动至「按钮」「链接按钮」两列：核对其余 pill/link/图标/禁用 pill 渲染；点击红「删除」pill → 调试面板事件日志出现 `cell-item-click`（payload 含 button/column/recordIndex）；点击「禁用」pill → 无 `cell-item-click`；调试面板自检显示「223/223 通过」。
- 验收 4/5 — 打开 `http://localhost:3000/data/table/` 的「button 列」section：核对主色/次色/危险/超出色回退/禁用/图标/文本优先按钮与链接按钮表结构（F12 看 `td.mu-table__button-cell > button.mu-button.mu-button--small`、禁用带 disabled 属性）；点击任一按钮 → 下方 demo-log 输出 `button={...}` payload；console 无 Invalid prop / v-on 警告。
- 验收 7 — 项目根执行 `npm run build`（退出 0）；打开 `http://localhost:3000/data/table-ex-basic/`，第二张表横向滚动查看「按钮」列编辑/删除/详情 pill。

## 环境阻塞

无。demo dev server 为环境常驻服务（3000 端口三页均 HTTP 200），非本次启动；playwright mcp 浏览器验证正常。

## 失败项

无。
