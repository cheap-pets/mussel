# 设计

## 方案概述

新增 `src/components/table/column-types/button.js`（`ButtonColumn`，`compile(column, dom)` 双通道），并在 `column-types/index.js` 注册 `button`。table-ex 侧删除 canvas-only 分流（`CANVAS_ONLY_TYPES` 移除 button、`createColumnRender` 删 button 分支），`type: 'button'` 经 `resolveColumnType` 走 `ButtonColumn.compile(column)`，canvas 产物 `{ canvasKind: 'button', buttons, link }` 与现分支逐字段一致——`drawButton` / `resolveTooltipButtons` / `emitButtonItemClick` / itemHits / GRAPHIC_ITEM_TYPES / TYPE_DEFAULT_WIDTHS 全部零改动（对齐协议与 canvas 通道无回退，验收 6）。

DOM 通道（mu-table，此前 `type:'button'` 回退 TextColumn）直接产出 MuButton 组件条目（人工意见 1-1）：`items[].is = MuButton`（组件对象，`<component :is>` 原生支持）、恒传 `size: 'small'`、`column.link: true` 加 `buttonStyle: 'link'`，caption/icon/color/disabled 映射为 props；点击 emit `cell-item-click`，payload 键 `button` 与 canvas 一致（验收 1/2/3/4/5）。items 协议 `is` 由「标签字符串」扩展为「标签字符串或组件对象」；配套需改消费端 `base/table-row.vue:21`：`{{ item.text }}` 恒生成文本 vnode（undefined → 空串），`renderSlot` 判其为有效插槽内容，会整体顶掉 MuButton 内部 `<slot>` fallback，caption/icon 一律不渲染——改为 `<template v-if="item.text != null">{{ item.text }}</template>`（条件假时抛注释节点，`ensureValidVNode` 判空后落 fallback）。现有列条目除 icon/img（`text: null`）外 text 均非 null；icon/img 改后仅少一个空文本节点，渲染不变。

MuButton `color` 仅接受 `normal/primary/secondary/danger`（button.js:17-20 validator；样式规则仅三色，button.scss:96-120）。DOM 通道色名经 `resolveColorName` 归一后仅 4 色内传递，其余 14 色回退 MuButton 缺省形态（避免 dev validator warn）；canvas 通道维持 17 色。disabled 传 `disabled: true`，原生 button 置 disabled 后 click 天然不触发（与 canvas disabled 不发事件同口径）。

字段结构沿用现状：`column.buttons: Array | (record) => Array`，按钮 `{ caption?, icon?, color?, disabled? }`，caption/icon 互斥、caption 优先；`column.link: true` 列级 link 形态（cell-painters.js:195-204、1383-1418 现状）。

## 遵循约定与复用

无探索报告，以下约定自行提取自源码（均已核对存在）：

- 双通道协议先例：`compile(column, dom)` dom=true 产 `is/class/style/events` items、否则产平铺数据字段 —— `column-types/list.js:100-155`、`tag.js:7-104`、`icon.js:40-108`。
- mu-table 列准备 `type.compile(el, true)`：`base/table.vue:180`；items 消费端 `v-bind="item.attrs"` + `v-on="item.events ?? {}"`：`base/table-row.vue:12-23`（events 可选约定已兜底；`{{ item.text }}`（:21）恒占默认插槽，组件条目须条件化 text 槽，见接口节）。
- table-ex 列准备链：`ex/cell-painters.js:235-273`（prepareColumn）；数组值豁免名单含 button：cell-painters.js:278-285；`NON_EDITABLE_TYPES` 含 button：`ex/editor.js:38`；估高 `GRAPHIC_ITEM_TYPES` 含 button：`ex/row-geometry.js:74`；默认宽 `TYPE_DEFAULT_WIDTHS.button`：`ex/layout.js:30`。
- canvas 点击派发 `emitButtonItemClick`（payload 键 `button`、disabled 只续链不发）：`ex/table-ex.vue:1196-1206`。
- 色名解析 `colorNameOf`（`(色名|(record)=>色名)` → 非空 string，否则 'primary'）：cell-painters.js:1213-1217；17 色名清单：`ex/theme.js:60-65`（12 基础色 + 5 语义色）。
- MuButton 接口：`buttonProps`（disabled/color/size/buttonStyle，validator 清单 button.js:6-25）、caption/icon props（button.vue:23-27）、导出（button/index.js:1）；small 样式 `--size: var(--mu-control-height-small)`（button.scss:37-48）、link 样式（:62-65、134-139）、disabled 样式（:127-132）、color 三色规则（:96-120）；icon prop 经 `<mu-icon :icon>` → useIcon 注册表解析（icon/icon.js:12、26-45）。MuButton 未声明 click emits，`v-on` 监听经单根 fallthrough 落根 button 元素（Vue 3 默认行为）。
- CSS：BEM `mu-` 前缀、`--mu-*` 变量、条目样式集中于 `column-types/style.scss`（tag 条目 vertical-align 先例 :46-51）；`--cell-padding: 8px`（base/table.scss:3）。
- `ensureFn`：`utils/type.js:80-84`（数组值包常量函数）。
- demo 页 URL `http://localhost:3000/data/<name>/`（知识库 fact）；改已有页面无需重启 demo watch；table-ex 交互断言口径见知识 `table-ex-demo-interaction-verify`（条目命中区 = pill 绘制区、事件日志 unshift 最新在前、浮层断言等 80ms+）。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
| --- | --- | --- |
| `src/components/table/column-types/button.js` | 新增：`ButtonColumn`（compile 双通道，DOM 条目直接产 MuButton）+ 导出 `resolveColorName` | 验收 1/2/3/4：注册源与双通道产物单一事实源 |
| `src/components/table/column-types/index.js` | 注册 `button: ButtonColumn` | 验收 1/5 |
| `src/components/table/column-types/style.scss` | 新增 `.mu-table__button-cell > .mu-button` 两条布局规则（水平间距 + vertical-align），视觉全部复用 button.scss 现成规则 | 验收 4：DOM 按钮组布局落地 |
| `src/components/table/base/table-row.vue` | `{{ item.text }}`（:21）改为 `<template v-if="item.text != null">{{ item.text }}</template>` | 验收 4：文本 vnode 恒存在即占满默认插槽，组件条目（MuButton）内部 slot fallback（icon/caption）不渲染 |
| `src/components/table/ex/cell-painters.js` | `CANVAS_ONLY_TYPES` 移除 button（剩 progress）；`createColumnRender` 删 button 分支；本地 `colorNameOf` 删除改从 `./button`（经 `../column-types/button`）import `resolveColorName`（progress 绘制同用）；相关注释更新 | 验收 6：table-ex 改走 column-types 定义、行为不回退 |
| `src/components/table/ex/editor.js` | 仅注释：'button' 不再是 canvas 专属（已入注册表、仍不可编辑） | 注释与事实一致 |
| `src/components/table/ex/row-geometry.js` | 仅注释：button 不再是 canvas 专属类型 | 同上 |
| `demo/src/data/table/main-view.vue` | 新增「button 列」demo-section（按钮 + link 两表、多按钮/color 4 色与超出色回退/disabled/icon-only 夹具、cell-item-click 日志）；「列类型」note 类型清单补 button | 验收 4/5/7：DOM 通道验证载体 |

无新增自动化测试文件（项目无测试框架，按 AGENTS.md 经 demo 页验证）；table-ex 侧 button 相关 self-checks（`demo/src/data/table-ex/self-checks/cell-painters.js` 等）不改，自动改走新路径构成回归网。注：`self-checks/cell-painters.js:975` 的返回文案仍写「canvasKind 分发在 resolveColumnType 之前」，改后为过时描述（断言不受影响，N/N 判定不看文案），核对时勿按口径漂移处理。

基线已改文件 `demo/src/data/table-ex-basic/main-view.vue` 按 decisions.md 保留原样不动；table-ex demo（`demo/src/data/table-ex/main-view.vue:794-797`）已有按钮列，无需改动即验证 canvas 新路径。

## 接口 / 数据结构

```js
// src/components/table/column-types/button.js（新增，纯 JS）
// import { MuButton } from '@/components/button'      // button/index.js:1
// import { resolveIconEntry } from './icon'           // icon.js:18（与本文件无环）

/** 色名归一（自 cell-painters.js:1213-1217 迁移，语义逐字一致；progress 绘制同源消费） */
export function resolveColorName (value, record)
// 入参 value: 色名 | (record) => 色名；返回非空 string，否则 'primary'

export const ButtonColumn = {
  compile: (column, dom = false) => {
    // 列准备期：getButtons = ensureFn(column.buttons)；
    // isLink = column.link === true（列级单点，整列同形态）；
    // showTitle = column.title === true；columnRef = column._raw ?? column（list.js:117 同款防御）
    return ({ record, value, emit }) => { /* 伪代码如下 */ }
  }
}
```

canvas 产物（`dom=false`，与现 `createColumnRender` button 分支逐字段一致，cell-painters.js:195-204）：

```js
{ canvasKind: 'button', buttons: getButtons(record) ?? [], link: column.link === true || null }
```

dom 产物（`dom=true`，人工意见 1-1：直接产 MuButton；`buttons` 非数组或为空数组时返回 undefined 落占位链，门控同 canvas `drawButton`（cell-painters.js:1323））：

```js
const BUTTON_COLORS = ['normal', 'primary', 'secondary', 'danger']  // = color validator 清单（button.js:19）

{
  class: 'mu-table__button-cell',
  items: buttons.flatMap(button => {
    const { caption, icon, color, disabled } = button ?? {}   // 空元素同 canvas EMPTY_BUTTON（cell-painters.js:1297）
    // caption/icon 互斥、caption 优先——与 canvas ellipsizeButton 判定一致（cell-painters.js:1396-1410）
    const hasCaption = String(caption ?? '') !== ''
    // icon-only 且 icon 未注册（resolveIconEntry null，warn 在 resolve 内）→ 跳过该条；
    // canvas 空哨兵同时终止后续条目（cell-painters.js:1301），差异仅见残缺配置
    if (!hasCaption && !resolveIconEntry(icon)) return []
    const name = resolveColorName(color, record)
    // disabled 判定同 canvas isTruthyAttr（cell-painters.js:1014-1016）：非 null 且非 false
    const isDisabled = disabled != null && disabled !== false
    return [{
      is: MuButton,                    // 组件对象：import { MuButton } from '@/components/button'（button/index.js:1）
      title: showTitle && caption,     // 走 table-row.vue:19 setTitle 挂根元素
      attrs: {
        size: 'small',                 // 恒传，强制 small 尺寸（mu-button--small，button.scss:37-48）
        ...(isLink ? { buttonStyle: 'link' } : null),
        ...(hasCaption ? { caption: String(caption) } : { icon }),   // 文本一律走 caption prop，不用 item.text
        ...(BUTTON_COLORS.includes(name) ? { color: name } : null),  // 仅 4 色内传递，超出色回退缺省形态
        ...(isDisabled ? { disabled: true } : null)   // Boolean prop（button.js:7，button.vue:23 展开），置灰 button.scss:127-132
      },
      events: { click: () => emit('cell-item-click', { record, column: columnRef, button }) }
    }]
  })
}
```

- 不使用 `item.text`：table-row.vue:21 会把它作为默认插槽内容整体替换 MuButton 内部 slot（icon/caption 结构失效，button.vue:9-12），文本一律走 caption prop。
- **插槽约定变更（消费端一处）**：table-row.vue:21 现为 `{{ item.text }}`，即使 `item.text` 为 undefined 也会生成空串文本 vnode；Vue `renderSlot` 用 `ensureValidVNode` 判定，文本 vnode 非 Comment → 视为有效内容 → MuButton 的 `<slot>` fallback 不渲染（实测等价结构：单根 `<button>` + `<slot>` fallback，传 `default: () => [createTextVNode('')]` 渲染为空 `<button>`，fallback 不出现）。故改为 `<template v-if="item.text != null">{{ item.text }}</template>`；条件假时仅剩注释节点 → `ensureValidVNode` 返回 null → 落 fallback。出处：node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:3393、3419-3426（Vue 3.5.44）。text 恒有值的列条目渲染不变。
- payload：`{ record, column, button }`，键与 canvas `emitButtonItemClick`（table-ex.vue:1204）一致；DOM 无 recordIndex（list/tag DOM 现状同口径，canvas 侧外包）。
- events 每条目恒含 click；MuButton 未声明 click emits，`v-on` 监听经单根 fallthrough 落根 button 元素，原生 disabled 状态下 click 不触发；消费端 `v-on="item.events ?? {}"`（table-row.vue:18）天然兼容 events 可选约定。
- items 协议 `is` 扩展为「标签字符串或组件对象」：`<component :is>`（table-row.vue:13-14）原生支持组件对象；现有列条目仍传字符串；text 槽条件化后（见上条）现有列渲染不变。

CSS 契约（style.scss 新增，仅两条布局规则）：

```scss
.mu-table__button-cell > .mu-button {
  vertical-align: middle;                               // tag 条目同款（style.scss:51）
  & + .mu-button { margin-left: var(--cell-padding); }  // 组间距 8px，与 canvas 组间距同值（drawButton :1362）
}
// 三态/hover/disabled/link 视觉全部由 button.scss 现成规则承担，本次零新增视觉规则
```

## 被拒绝的备选

1. **DOM pill 视觉镜像（`span.mu-table__cell-button` + 17 色修饰类 + `--cell-btn` 变量三态）**：D1 原方案——被人工意见 1-1 否决：DOM 侧直接用 mu-button，不在 table 内维护第二套按钮视觉体系（约 60 行三态 CSS 与组件库按钮演进脱钩）。随其作废的子决策（原子类组合表达三态、hover 仅下划线）不再单列。
2. **保持 button 为 table-ex canvas-only，mu-table 侧另写 DOM button 列**：违背任务目标（统一 column-types 定义）；双端字段名/事件 payload 会各自漂移。
3. **17 色名直传 MuButton `color` prop**：color validator 仅 `normal/primary/secondary/danger`（button.js:17-20），超出色触发 Vue dev validator warn 且无对应样式规则（button.scss:96-120 仅三色）——改为 4 色内传递、其余色回退 MuButton 缺省形态。

## 风险与回滚

- 合并风险：**双向门**。纯新增（button.js/style.scss/demo）+ 等价替换（canvas-only 分流删除），revert 单 commit 即完全回滚；无数据/存储/公共 API 迁移。
- 爆炸半径：`type: 'button'` 列（mu-table 与 mu-table-ex）＋ mu-table 全部列的 items 渲染（table-row.vue:21 text 槽条件化，共用消费端一处）；progress 分流不动；table-ex 其余列类型路径零触及。
- 共用消费端回归面：table-row.vue:21 对所有 items 列生效——text 恒有值的列（text/list/tag/check）渲染不变；`text: null` 的 icon/img 由「空文本节点」变为「无子节点」，innerHTML/src 路径不受影响（实测空文本节点不参与渲染）。验证见测试计划「回归」行。
- canvas 回归风险点（实施时核对）：`resolveColorName` 迁移后语义须与原 `colorNameOf` 逐字一致；`CANVAS_ONLY_TYPES` 移除 button 后 `isPlainTextColumn`（'button' 非 text → false）、`_mapText`（非 enum → null）、数组豁免（:284 保留 `t !== 'button'`）取值不变。
- self-checks 基线：button 相关自检自动改走 compile 路径，若 FAIL 先区分口径漂移与真回归（`canvas-pixel-assert-anchor-drift` 知识）。
- click fallthrough：MuButton 未声明 click emits，`v-on` 监听依赖 Vue 单根 fallthrough 落根 button 元素——MuButton 未来声明 emits 或改根结构时需回归 DOM 条目点击。
- 双端色域差异：DOM 通道受 MuButton color validator 约束仅 4 色、canvas 维持 17 色（theme.js:60-65），同名色（如 warning）双端形态不同（DOM 回退缺省、canvas 彩色 pill）——人工意见 1-1 裁决接受 mu-button 现有能力，canvas 是否对齐留待后续。

## 测试计划

环境：demo dev server 常驻 3000（URL `/data/<name>/`），playwright mcp 直接访问；改已有页面无需重启构建。

| 验收标准 | 片 | 手段 | 检查方式 |
| --- | --- | --- | --- |
| 1. 注册生效无废弃警告 | 片1 | 浏览器 | `/data/table-ex/` 按钮列照常渲染（经注册表路径即生效）；页面 console 无 button 相关 warn；`/data/table/`（片2 后）同查 |
| 2. 多按钮 + 字段结构一致 | 片1 | 浏览器 | `/data/table-ex/` 「按钮」列各行多 pill 渲染（详情/禁用/A B C 等，main-view.vue:697-754）；点击任一 pill，事件日志（unshift 最新在前）payload `button` 为按钮对象、`column.field='buttons'`；disabled pill 点击无日志 |
| 3. link 形态一致 | 片1 | 浏览器 | `/data/table-ex/` 「链接按钮」列纯文字链（无 pill 底/边框）、icon-only 行渲染图标；hover 色变 + 下划线；点击 payload 同上 |
| 4. dom 通道条目协议 + events 可选 | 片2 | 浏览器 | `/data/table/` button section：`td.mu-table__button-cell` 下 `button.mu-button.mu-button--small`（`textContent` 含 caption 文本——插槽未被空文本顶掉、无空 `<button>`；color 变体类 mu-button--primary/secondary/danger、超出色条目无 color 类即缺省形态、禁用条目带 `disabled` 属性且 `pointer-events: none`——用 `dispatchEvent`/`force: true` 点击，断言无日志，不可裸 `.click()`）；link 表 `button.mu-button--link`（无底无边框）；icon-only 条目内含 mu-icon svg；点击后 demo-log 输出 `button={...}` payload；console 无 `v-on with no argument` 警告、无 Invalid prop 警告 |
| 回归：共用消费端 text 槽（table-row.vue:21） | 片2 | 浏览器 | `/data/table/` 既有 section 逐项：text 列文本、list/text.link 条目文本与点击日志、tag 条目、icon 列表图标、img 列图像、mappings 与固定列——无空单元格/文本缺失；`/data/table-ex/` 自检面板仍 N/N |
| 5. table 统一 column-types | 片2 | 命令+浏览器 | `grep -rn "button" src/components/table/base/` 无列类型定义（现状本无自有定义）；`/data/table/` 的 `type:'button'` 不再回退 text（出 button.mu-button 结构即为注册表路径） |
| 6. table-ex 行为不回退 | 片1 | 浏览器 | `/data/table-ex/` 自检面板「N/N 通过」（self-checks 未改，即冻结基线，见知识 `table-ex-refactor-frozen-probe`）；固定列场景（按钮在滚动区）与窄列场景 pill 水平位置/截断同基线；`title: true` 溢出 tooltip 正常；点击日志 payload 键与字段（`button`/`record`/`column`/`recordIndex`）不变、disabled 条目无日志 |
| 7. build + demo 可验证 | 终验 | 命令 | `npm run build` 退出 0；eslint（全局 8.57.0，口径 `src` 与 `demo/src`）0 error；`/data/table-ex-basic/` 按钮列正常（该页基线已含与本任务无关的未提交改动，按 decisions 保留原样，非本任务回归基线） |

## 实施步骤

- **片1（canvas 通道迁移 + 注册）**——依赖：无
  1. 新建 `column-types/button.js`：`resolveColorName` + `ButtonColumn` 双通道（canvas 产物与 cell-painters.js:195-204 逐字段一致；dom 分支随文件一次成型）。
  2. `column-types/index.js` 注册 `button`。
  3. `ex/cell-painters.js`：`CANVAS_ONLY_TYPES` 剩 progress、`createColumnRender` 删 button 分支、`colorNameOf` 改 import `resolveColorName`、注释更新；`ex/editor.js`、`ex/row-geometry.js` 注释更新。
  - 文件集合：`column-types/button.js`、`column-types/index.js`、`ex/cell-painters.js`、`ex/editor.js`、`ex/row-geometry.js`。
  - 完成判据：`npm run build` 通过；`/data/table-ex/` 按钮列（pill/link/icon/禁用/对齐/固定列/窄列）渲染与点击同基线、自检 N/N、console 无新 warn（验收 1/2/3/6）。
- **片2（DOM 通道消费端插槽 + 样式 + demo 验证）**——依赖：片1
  4. `base/table-row.vue`：`{{ item.text }}`（:21）改为 `<template v-if="item.text != null">{{ item.text }}</template>`（组件条目不传 text，空文本 vnode 会顶掉组件内部 slot fallback）。
  5. `column-types/style.scss` 增 `.mu-table__button-cell > .mu-button` 布局规则（水平间距 + vertical-align）。
  6. `demo/src/data/table/main-view.vue` 增「button 列」section：按钮表（多按钮、color: primary/secondary/danger 与超出色 'warning' 回退夹具、disabled、icon-only 含 svg 名 'clock' 与 caption+icon 文本优先夹具）+ link 表（`column.link: true` 同源数据）+ cell-item-click 日志；「列类型」note 补 button。
  - 文件集合：`base/table-row.vue`、`column-types/style.scss`、`demo/src/data/table/main-view.vue`。
  - 完成判据：`/data/table/` 新 section 渲染 `button.mu-button.mu-button--small` 按钮/link/禁用/图标条目且 caption 文本可见（非空 `<button>`），点击 demo-log 输出 `button` payload；console 无 v-on 与 Invalid prop 警告；既有 section 按测试计划「回归」行复核无空单元格（验收 4/5）。
- **终验**——依赖：片2
  7. `npm run build` + eslint（src 与 demo/src）+ `/data/table-ex-basic/` 基线页按钮列复核 + 两 demo 页全量断言（含「回归」行）按测试计划表执行（验收 7）。

无共享/生成文件需单列集成片（index.js 注册随片1）。

## 未解问题

1. DOM 侧按钮组无溢出截断语义（td 自然换行；canvas 为逐 pill 丢弃越界）——不影响验收标准，是否对齐留待后续。
2. mu-table 侧 button 列未配类型级默认宽（table-ex `TYPE_DEFAULT_WIDTHS` 有 140/80，layout.js:30 注明「仅 table-ex 消费」）；demo 均显式配宽。如需双端默认宽一致，属后续任务。
3. 双端色域不一致：DOM 通道受 MuButton color validator 约束仅 4 色（button.js:17-20）、canvas 维持 17 色（theme.js:60-65），同名色双端形态不同（DOM 超出色回退缺省）；为 MuButton 扩色或 canvas 收敛属后续任务。

（原「DOM pill 视觉口径待确认」已由人工意见 1-1 裁决（mu-button small）；原「文档三处同步」已由人工意见 1-2 裁决不同步——两项均见 decisions.md，不再列为未解。）
