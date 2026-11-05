# 实施记录（I1，单片整体实施）

设计输入：`02-design.md`（交叉审改定稿，R1 状态「交叉审改后经 A 复核接受」）；约束与启动确认见 `decisions.md`。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
| --- | --- | --- |
| `src/components/table/column-types/button.js` | 片1 步骤 1 | 新增 `ButtonColumn`（compile 双通道：canvas 产物与原 createColumnRender button 分支逐字段一致；dom 产物 MuButton 组件条目）+ 导出 `resolveColorName`（自 cell-painters `colorNameOf` 逐字迁移）。按 list.js 先例拆 `domItemOf`/`buttonAttrsOf` 两层 helper（见偏离 1），产物字段结构不变 |
| `src/components/table/column-types/index.js` | 片1 步骤 2 | 注册 `button: ButtonColumn` |
| `src/components/table/ex/cell-painters.js` | 片1 步骤 3 | `CANVAS_ONLY_TYPES` 剩 progress（注释同步）；`createColumnRender` 删 button 分支；本地 `colorNameOf` 删除，progress/drawButtonLink/drawButtonPill 三处消费点改 import `resolveColorName`；:1211 节区注释更新。`isArrayValueRejected` 的 `t !== 'button'` 豁免按设计保留 |
| `src/components/table/ex/editor.js` | 片1 步骤 3 | 仅注释：button 已入列类型注册表、仍不可编辑 |
| `src/components/table/ex/row-geometry.js` | 片1 步骤 3 | 仅注释：button 经注册表 compile 产 canvasKind 同走 drawCanvasKindContent；`GRAPHIC_ITEM_TYPES` 本体零改动 |
| `src/components/table/base/table-row.vue` | 片2 步骤 4 | `{{ item.text }}` 改 `<template v-if="item.text != null">`（含原因注释）；组件条目（MuButton）内部 slot fallback 不再被空文本 vnode 顶掉 |
| `src/components/table/column-types/style.scss` | 片2 步骤 5 | 新增 `.mu-table__button-cell > .mu-button`（vertical-align + 相邻 margin-left 8px）两条布局规则，视觉复用 button.scss |
| `demo/src/data/table/main-view.vue` | 片2 步骤 6 | 新增「button 列」section：pill 表（多按钮、primary/secondary/danger 与超出色 'warning' 回退、disabled、icon-only svg 'clock'、caption+icon 文本优先）+ link 表（`column.link: true` 同源数据）+ cell-item-click 日志；「列类型」note 类型清单补 button；script 增 `buttonRecords`/`buttonColumns`/`buttonLinkColumns`/`logButtonClick` |

基线 `M demo/src/data/table-ex-basic/main-view.vue` 按 decisions 保留原样未动。

## 偏离

1. 设计第 1 步（接口节伪代码）：dom 条目组装伪代码为 render 函数内单层 flatMap 内联；实现拆为 `domItemOf`（有效性门控 + 条目结构）与 `buttonAttrsOf`（MuButton props 组装）两层模块级 helper。原因：内联版 eslint `complexity` warn（11 > 10，规则为 warn 级但新文件保持零告警）；helper 划分与 list.js 的 `domItemOf` 先例同构。dom 产物字段（is/title/attrs/events、各条件键）与设计伪码逐字段一致，无行为差异。
2. 无其他偏离。

## 自检

命令（eslint 口径：`NODE_PATH=/usr/local/lib/node_modules eslint`，全局 8.57.0；demo watch 常驻 3000，playwright mcp 直访）：

- 片1 lint：5 个改动文件 `eslint` 0 error；button.js 0 warning（重构后）；cell-painters.js 剩 6 条 warning 均为基线（measureItem/drawItem/drawButtonLink/buttonsOverflowOf complexity 与 2 条 max-len，均在未触碰行）。
- 片1 build：`npm run build` 通过（dev+prod、ex dev+min 四产物）。
- 片1 浏览器 `/data/table-ex/`（夹具场景切「条目/新列型」，横向滚动 320 使按钮列入视口）：
  - 自检面板 223/223 通过——含「canvas 类型分发：progress/button 产 canvasKind」自检，即 `type:'button'` 已改走 `resolveColumnType → ButtonColumn.compile` 且产物断言通过（验收 1）；该自检改走新路径后仍绿（无废弃警告）。
  - pill 绘制：红「删除」pill（buttons[3]）像素带位于格内 x 120..160，与布局算法逐 pill 宽度推算一致；icon-only/编辑/删除多 pill 横排（验收 2/6）。
  - hover：pill 内 cursor=pointer、hover 反转实色（itemHits 命中区 = pill 绘制区）。
  - 点击：emit probe 拦截组件 emit——`cell-item-click` payload keys `[record, column, button, recordIndex]`，button = `{caption:'删除',color:'red',icon:'noRegBtnGlyph'}` 原对象、column.field='buttons'、recordIndex=0（验收 2/6）。
  - disabled「禁用」pill 点击：仅 `update:selected-record(-key)` + `cell-click`，无 `cell-item-click`（验收 2）。
  - link 形态「链接按钮」列点击：payload `button={caption:'详情',color:'indigo'}`（验收 3）。
  - console：无 button 相关新 warn/error（页面 1 条 error 为 self-checks 故意坏图夹具 `data:image/png;base64,AAAA`，预存在）；「caption 优先 icon 不解析」语义成立（noRegBtnGlyph 未触发 Invalid icon warn）。
- 片2 lint：table-row.vue、demo main-view.vue `eslint` 0 error（demo 剩 1 条基线 max-len warning：列类型 note 行基线即超 120）；`stylelint style.scss` 通过。
- 片2 浏览器 `/data/table/`：
  - button 列 section（验收 4/5）：pill 表 7 枚 `button.mu-button.mu-button--small`——caption 文本全部可见（text 槽条件化生效，无空 `<button>`）；`mu-button--primary/secondary/danger` 各 1、超出色 'warning' 条目无 color 类（缺省形态）；禁用条目带 `disabled` 属性且 `pointer-events: none`（elementFromPoint 命中 td）；icon-only 条目内含 `span.mu-icon > svg`（span 为 mu-icon 本体，无杂散空节点）；caption+icon 条目仅渲染文本（文本优先）。link 表 7 枚含 `mu-button--link`（无底无边框）。
  - 点击日志：主色/次色/危险/超出色（payload 保留 warning 原值）/文本优先（payload 原对象含 icon 键）与 link 表危险项均输出 `button={...}`；disabled 真实坐标点击（page.mouse）日志无变化、命中落到 td（dispatchEvent 直派按钮监听器属人工探针旁路，不作为 disabled 断言口径）。
  - console：0 error；无 `v-on with no argument`、无 Invalid prop 警告。`innerHTML will override its children` 警告经 Vue 源码判定预存在（`hasContentChildren` 仅判 children 数组非空，text/comment vnode 均触发，icon 列既有结构，数量不变）。
  - 回归行：列类型表逐列内容齐全（文本/布尔是/枚举映射女/日期/数值/金额¥1,234.5/链接/标签 admin,vip/图像 img/图标 svg/空值 '-'）；list 条目文本与点击日志、link 兼容列 4 项 `<a>` 与点击日志、text.link 文本、枚举列映射生效；排序/行选中/样式表文本齐全；边界回归表 text 数组落占位 '-'、空数据表正常；全页空单元格扫描仅剩夹具合法空（Dave 行 `tags: []` 与无 icon 值、text.link 表各记录仅带各自字段）。
  - 验收 5 grep：`src/components/table/base/` 无任何 button 列类型定义/分发（仅 table-row.vue 模板注释提及）；`type:'button'` 出 `button.mu-button` 结构即注册表路径。
- 终验：`npm run build` 退出 0；`eslint src demo/src` 全量 4 error 全部位于未触碰文件（`demo/src/data/table-ex/main-view.vue:344,346` import/first、`demo/src/data/table-ex/self-checks/cell-painters.js:49` no-unused-vars、`:2288` no-template-curly-in-string，基线预存在）；`/data/table-ex-basic/` 第二张表（14 列 typeColumns 含「按钮」列）横向滚动后红「删除」pill 像素确认（287px，列内容 x 1246..1396 入视口段），console 0 error、无 button 相关 warn（验收 7）。

## 遗留

1. 设计末次改动（R1）未经 X 复核即实施——用户序列固定（decisions 启动确认），随本记录留痕。
2. `ex/table-ex.vue:1181/1196` 注释「canvas 专属（render）产物」措辞在 button 入注册表后语义略窄；设计对该文件零改动冻结，未同步（仍为 canvasKind 产物、无 DOM events 通道，不影响理解）。
3. `self-checks/cell-painters.js:975` 返回文案「canvasKind 分发在 resolveColumnType 之前」已过时（断言不受影响），设计注明不改。
4. `/data/table/` 页 mappings section 的 text/bool/number 列 mappings/options 不再生效——20261104「mappings enum 独占」v2 变更后的既有夹具漂移，与本任务无关未改。
5. 测试计划回归行的「固定列」在 `/data/table/` 页无对应 demo section（固定列机制载体在 table-ex 页，自检 N/N 已覆盖）；本记录以 table-ex 自检 + 页面全表扫描替代。
6. 未验证 DOM 通道按钮的键盘可达性（tab 焦点进入触发 click 语义与原生一致，不在测试计划范围）。
