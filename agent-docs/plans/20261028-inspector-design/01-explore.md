# 探索报告

任务：为 mussel-inspector（属性检查器）设计提供代码库事实。路径均相对项目根 `/Volumes/External/workshop/cheap-pets/mussel/`。

## 相关代码

### 组件注册与入口

- `src/components/index.js:26-35` — `installComponents` 遍历各模块命名导出，仅注册 `Mu` 开头的键（L31），并调用模块的 `install?.(app, options)`（L34）
- `src/components/index.js:18-22,54-60` — 独立单文件组件直接 import 后用 `_install({ MuTable, ... })` 挂载（MuTags/MuBadge/MuTable/MuCanvasTable/MuScrollBox 走此路径）
- `src/components/form/index.js:1-21` — form 模块全部组件以命名导出形式注册（`export { default as MuInput } from './input.vue'`），无独立 install
- `src/index.js:9-13,35-50` — 库入口组装：setupLocale / setupColors / installIcons / installComponents

### MuForm / MuFormField（声明式字段渲染的既有实现 —— 与 inspector 需求最接近）

- `src/components/form/form.vue:25-31` — MuForm props：`items / model / rules / labelWidth / labelAlign`；**无 disabled / readonly prop**
- `src/components/form/form.vue:99-110` — `provide('form', reactive({...}))`，上下文含 `model / labelWidth / labelAlign / rules / errors / setLabel / setRequired / validateField`
- `src/components/form/form.vue:112-116` — `defineExpose({ errors, validate, resetValidation })`
- `src/components/form/items.js:6-43` — items DSL 判定器：`'hr'` 分隔线（L6-9）、`'->'` 换行（L11-14）、数组=一行多列 `mu-form-row`（L16-19）、**字符串=分组标题** `div.mu-form__title`（L21-24）、`{is}` 自定义组件（L26-32）、`{prop}` 字段→`mu-form-field` 透传 attrs（L34-40）
- `src/components/form/input-types.js:1-17` — `INPUT_TYPES`：type 字符串→`[组件标签, 默认attrs]` 映射表。含 `text/memo/date/week/month/quarter/year/date-range/time/color/segmented/select/multi-select/check-group/radio-group`；**无 `number`**
- `src/components/form/form-field.vue:33-43` — MuFormField props：`prop / input / width / label / labelWidth / labelAlign(left|right|top) / required / suffix / error`；**无 disabled / readonly**
- `src/components/form/form-field.vue:61-80` — `control` computed：`input` 为 Object 时 `{is, type, ...attrs}`（`is` 优先），否则查 `INPUT_TYPES`（缺省 `text`）
- `src/components/form/form-field.vue:12,64` — 控件 `v-model="form.model[prop]"` 直接读写外部传入的 model 对象（不拷贝）；`vModel = Boolean(form.model && prop)`
- `src/components/form/form-field.scss:1-58` — 字段布局：flex 横排，label 固定宽；`label-align="right"` 右对齐（L39-43）、`label-align="top"` 上下排布（L45-52）；`.mu-form-field__input` flex:1
- `src/components/form/form.scss:1-36` — `.mu-form` flex-wrap 容器（padding `--mu-base-spacing`）；`.mu-form__title` 分组标题样式（L23-30）；`hr` 分隔线虚线样式（L9-14）
- `src/components/form/form-row.vue:19-21` — MuFormRow props `items`，经 `useFormRowItems` 渲染行内多字段
- `src/components/form/validation.js:58-71` — `useFieldModel(model)`：所有输入组件共用的 model 代理，写入后 300ms debounce 触发 formField 校验

### 输入组件（全部位于 `src/components/form/`，V4 无独立 input/、select/ 等子目录）

- `src/components/form/input.js:7-21` — MuInput props（`inputProps`）：`invalid / readonly / disabled / placeholder / prefix / suffix / tabindex / clearable / size(small|normal|large) / pill`；input.vue 另有 `type`（L21）
- `src/components/form/input.js:23-33` — MuInput emits：`input / focus / blur / keydown / enter / esc / click / prefixClick / suffixClick`；**无 change 事件**
- `src/components/form/input.js:54-59` — `type` 直接透传原生 input（`type: props.type || 'text'`），可传 `type="number"` 走原生数字输入
- `src/components/form/input.vue:23-24` — `defineModel()` + `useFieldModel` 包装
- `src/components/form/select.js:4-11` — MuSelect props（`selectProps`）：`options / optionKey('value') / valueMode('normal'|'composite') / dropdownClass / dropdownWidth('anchor') / dropdownScrollbar`
- `src/components/form/select.js:20-33` — options 元素形状 `{ label, value }`；`optionLabels` 取 `el.label ?? el.value`
- `src/components/form/select.vue:33-38` — MuSelect = `combo-wrapper` + `editable:false` 固定；值经 `v-model` 双向
- `src/components/form/combo-wrapper.vue:51-61` — 底层 combo props = `inputProps + dropdownProps + dropdownItems + editable`；emits = `inputEmits + dropdownEvents`；**无 change**
- `src/components/dropdown/dropdown-wrapper.js:5-10` — `dropdownEvents`：`action / dropdown:show / dropdown:hide / dropdown:itemclick`
- `src/components/form/option.vue:20` — MuOption 继承 `dropdownItemProps`（含 `disabled`），options 数组项支持 `disabled`
- `src/components/form/radio-group.vue:21` — MuRadioGroup props：`options / disabled`；模板 L4-9 渲染 `option.value/label/disabled`
- `src/components/form/radio.vue:17-21` — MuRadio props：`value`(必填) / `label` / `disabled`；model 注入 radioGroup
- `src/components/form/switch.vue:17-27` — MuSwitch props：`icon / activeIcon / inactiveIcon / label / activeLabel / inactiveLabel / activeValue(默认 true) / inactiveValue(默认 false) / disabled`；点击 toggle 写 model（L41-44）
- `src/components/form/check.vue:15-23` — MuCheck props：`value / label / disabled`；model 类型 `[Boolean, Array]`
- `src/components/form/segmented.vue:31-35,43-49` — MuSegmented props：`options / disabled / iconPosition`；options 元素可为字符串/数字（自动归一为 `{label,value}`）或对象
- `src/components/form/color-input.vue:46-53` — MuColorInput props：`disabled / readonly / placeholder / dropdownClass`；`defineModel({ type: String })`，HEX 经 `normalizeHex`（`@/utils/color`）规范化

### mu-table（容器/复合组件参考）

- `src/components/table/table.vue:65-85` — props 全配置驱动：`keyField / records / columns / selectedRecord / selectedRecordKey / headerChecked / orderBy / recordsOffset / fixedLeftColumns / gridlines / hoverMode / striped / placeholder`
- `src/components/table/table.vue:87-95` — emits 全 kebab-case：`header-click / cell-click / cell-item-click / update:header-checked / update:cell-value / update:selected-record / update:selected-record-key`
- `src/components/table/table.vue:159-203` — `internalColumns` computed：对传入 columns 规范化（`_key/_text/_value/_title/_class/_style/_render`），函数值经 `ensureFn` 包装
- `src/components/table/column-types/index.js:16-34` — `ColumnTypes` 注册表 + `resolveColumnType(type)`（未知类型回落 text）——**type→实现 注册表模式的库内先例**
- `src/components/table/table-row.vue:34-40` — 子组件按 props（columns/record/recordIndex/recordNumber）渲染，经 `inject('table')` 拿上下文（table.vue:368-372 provide）
- `src/components/table/table.vue:382-384` — 组件名声明方式之一：第二 `<script>` 块 `export default { name: 'MusselTable' }`（其余组件多用 `defineOptions({ name: 'MusselXxx' })`，如 form-field.vue:31）
- `src/components/table/table.scss:114-119` — `.mu-table--empty` 仅调整边框阴影；**mu-table 无空状态文案 UI/插槽**
- `src/components/table/table.vue:84,195` — `placeholder` prop 作为列级空值占位下发（`col.placeholder ??= props.placeholder`）
- 目录组织：`src/components/table/` 仅 `table.vue / table-row.vue / table.scss / utils.js / column-types/`，**无 index.js**（经 `src/components/index.js:20` 直接注册）

### 公共样式

- `src/styles/root.scss:134-151` — 间距/尺寸/字号变量：`--mu-base-spacing:8px / --mu-half-spacing / --mu-inline-spacing:6px / --mu-control-height-{small:24,normal:32,large:40}px / --mu-radius-{control:4,panel:8,modal:12}px / --mu-font-size-{small:12,normal:14,large:16}px / --mu-list-item-height:32px`
- `src/styles/root.scss:127-132` — z-index 变量：`--mu-z-index-{float:1, above:1, layer:10, modal:100, popup:1000, ontop:10000}`
- `src/styles/root.scss:42-62` — 语义变量：`--mu-text-color-{strong,normal,subtle,soft,muted}`、`--mu-border-color-{strong,normal,soft}`、`--mu-bg-{normal,muted,strong,disabled,mask,overlay,fill,stripe}`
- `src/styles/root.scss:88-121` — 暗色模式：`.mu-dark` 覆盖同名变量（仅换值，类挂在 root 元素）
- `src/components/common/props.js:3-12` — 共享 prop 定义先例：`autoOrBool`、`colorProp`（validator 校验色名）

### 国际化

- `src/langs/index.js:15-28` — `t(path, ...args)`：点路径查表 + `{0}` 占位符格式化；未命中返回 path 本身
- `src/langs/index.js:30-43` — `setupLocale(locale, data)` 仅安装时调用一次；运行时不可切换（知识库条目佐证：`agent-docs/knowledge/project/langs-locale-not-reactive.md`）
- `src/langs/zh.js:1-115` — 现有键空间：`Button / Message / Datetime / Validation / SideMenu / Menu / Pagination`；**无「暂无数据/空状态」类文案**
- 组件内使用先例：`src/components/form/validation.js:40-44` `t('Validation.REQUIRED', label)`

### demo 页面惯例

- `demo/src/common/app.js:20-24` — 每页 `main.js` 调 `createVueApp(MainView)`（createApp + install(mussel) + mount）
- `demo/src/common/demo-page.vue:45-50` — 页面根组件 `<demo-page path="...">`，从 catalog 取标题/面包屑/上下页导航
- `demo/src/common/demo-section.vue:34-47` — 演示块 props：`title / note / vertical / wide / regression / code`
- `demo/src/catalog.js:9` 起 — 页面清单单一事实源（category/title/desc/pages[].path）
- `vite.demo.config.js:58-105` — 构建期从 catalog 枚举多页 input（L61-83）；未登记的页面目录打警告（L96-101）；路径必须以分类前缀开头（L66-68）
- `demo/src/form/form/main-view.vue:163-253` — 配置式表单 items 完整示例（select/radio-group/segmented/check-group/color/date 的 options 形状与 `input: { type, options }` 写法）
- `demo/src/form/selection/main-view.vue:7-90` — switch/check/radio/segmented 的 `v-model` 用法示例

### 构建配置

- `vite.config.js:62-65` — alias：`@` → `src/`，`~icons` → `node_modules/@tabler/icons/icons`
- `vite.config.js:81-107` — UMD lib 构建，external 仅 `vue`（L90）；scss `root.scss` 编译期注入 `$colors` map（L72-78）
- `package.json:10-17` — scripts 仅 `build / demo:build / docs:dev / docs:build / docs:preview / pub`；**无 lint / typecheck / test**

### 可复用工具（`src/utils/`、`src/components/common/`）

- `src/utils/type.js:60-74` — `isEmpty(value, { skipString, skipBoolean })`
- `src/utils/size.js:8-22` — `resolveSize(s)`：数字 >1 → px，≤1 → 百分比，'auto' 原样（form-field width 用，form-field.vue:47-49）
- `src/utils/key-builder.js` — `autoIncrementKeyBuilder()`（items.js:4、table.vue:56 使用，为列表项生成稳定 key）

## 现有约定

- **命名**：内部名 `MusselXxx`（`defineOptions({ name })` 或第二 script 块）；注册名 `Mu` 前缀（注册机制按 `Mu` 开头过滤，components/index.js:31）；模板用 kebab-case（`mu-input`）
- **目录**：与 AGENTS.md「每组件一目录（xxx.vue + xxx.scss + index.js）」的描述不同，V4 实际为**按域聚合目录**：form/ 一个目录装全部输入与表单组件，共享一个 `index.js` 命名导出；table/ 目录无 index.js，由根 index.js 直挂。新组件两种挂载路径均存在先例
- **状态与变更通知**：输入组件统一 `defineModel()`（v-model），**库内（canvas-table 除外）没有任何组件 emit `change` 事件**（grep `emit('change')`、`'change'` 均为 0 命中）；父子通信用 `update:*` 事件（table.vue:87-95）或 provide/inject 上下文（form.vue:110、table.vue:368）
- **disabled/readonly**：控件级 prop（`inputProps.disabled/readonly`，input.js:9-10）；容器级（MuForm/MuFormField）不存在，靠 provide 上下文下发的只有 model/labelWidth/labelAlign/rules
- **字段描述渲染**：既有方案 = MuForm `items` DSL（items.js）+ `INPUT_TYPES` 映射表（input-types.js），title/hr/row/field 四类布局节点 + `input: { type, options, ...attrs }`
- **type 注册表模式**：`ColumnTypes`（column-types/index.js）与 `INPUT_TYPES`（input-types.js）两处先例，均「字符串 type → 实现/组件，未知回落默认」
- **样式**：BEM + `mu-` 前缀；scss 就近 import（`import './xxx.scss'` 在 script setup 首行，switch.vue:9）；间距/高度/字号/圆角/z-index/颜色全走 `--mu-*` 变量；暗色 = `.mu-dark` 同名变量覆盖
- **文案**：组件内硬编码文案走 `t('Domain.KEY')`，键空间按组件域名组织；无空状态类文案键
- **demo 验证**：`demo/src/<category>/<path>/main.js + main-view.vue`，登记 catalog.js，访问 `http://localhost:3000/<path>/`
- **测试方式**：无测试框架；组件行为经 demo 页面人工/playwright 验证（AGENTS.md 与 package.json 证实）

## 约束与风险

- **无 InputNumber 组件**：需求文档 `number → InputNumber`（ref-inspector.md:24）在 mussel 无对应物；最接近的是 `mu-input` 透传原生 `type="number"`（input.js:55），且 `INPUT_TYPES` 亦无 number 类型（input-types.js:1-17）
- **无 change 事件惯例**：inspector 需求的 `change(fieldName, fieldValue, nextValue)`（ref-inspector.md:51）须由 inspector 自身实现（基于 v-model 写入后 watch/对比），不能依赖底层组件 emit
- **MuForm/MuFormField 无 disabled**：全局禁用（ref-inspector.md:34）需 inspector 自行逐控件下发 `disabled`，或新增 provide 机制；不能假设 MuForm 已支持
- **MuForm 直接改外部 model**：`v-model="form.model[prop]"`（form-field.vue:12）直接写父级对象；若 inspector 复用 MuForm，其 `change` 检测只能 watch 深度对比，拿不到「哪个字段变了」的精确来源
- **i18n 非响应式**：`t()` 结果不随 locale 运行时切换（knowledge：langs-locale-not-reactive.md）；emptyText 若走 i18n 仅安装时确定
- **新增包裹层惯例**：新增包裹层默认 `display: contents` 保扁平布局，`& > *` 子选择器会失效（knowledge：wrapper-display-contents-legacy-layout.md）——inspector 若包裹 mu-form 需注意
- **同特异性覆盖顺序坑**：跨文件样式覆盖随 import 顺序漂移失效，覆盖规则须与被覆盖选择器同文件置尾（knowledge：css-split-equal-specificity-order.md）
- **demo 新页面需重启构建**：watch 模式 input 启动时枚举，新增 demo 页后须重启 `npm run demo:build`（vite.demo.config.js:58-83 + knowledge：demo-watch-new-entry-restart.md）
- **canvas-table 排除**（decisions.md:3）：`src/components/canvas-table/` 与 `demo/src/data/canvas-table/` 全部内容未读取、不作为事实来源；grep 命中的 canvas-table 相关行（含其 emptyText/#empty 空状态实现）均已跳过
- **依赖外置仅 vue**：新组件只能 import 库内 `@/utils/*`、`@/langs`、`@/components/*`；`throttle-debounce` 已在库内使用（input.js:4）但为 devDependency（构建打包进产物）

## 验证方式

- `npm run build` — 库构建（dev + prod 两遍 vite build），验证编译与打包（package.json:11）
- `npm run demo:build` — demo watch 构建 + `:3000` 静态服务；新页面须登记 catalog 并重启（package.json:12、vite.demo.config.js）
- 文档站（非本轮）：`npm run docs:dev` / `docs:build`（package.json:13-15）
- **无 lint / typecheck / test 命令与测试文件**（package.json:10-17；AGENTS.md「无测试框架」）
- demo 页面位置：`demo/src/<category>/<path>/`（main.js + main-view.vue），登记于 `demo/src/catalog.js`

## 未解问题

1. 【设计决策】`number` 类型字段映射到哪个控件——`mu-input` 原生 `type="number"`，还是设计新增数字输入？（mussel 无 InputNumber）
2. 【设计决策】inspector 基于 MuForm `items` DSL 复用（title/hr 机制现成，但 change 源头定位与全局 disabled 缺失），还是独立渲染循环 + 逐字段 v-model——两方案事实均已列于上文
3. 【设计决策】`change` 事件与 v-model 协议的关系：是否同时提供 `v-model:value`（table 的 `update:*` 先例存在，table.vue:87-95）
4. 【用户回答类】emptyText 默认值走 i18n（需在 `src/langs/zh.js`/`en.js` 新增键，当前无空状态文案）还是纯 prop 默认中文字符串（ref-inspector.md:46 默认 `'暂无选中对象'`）
5. 【范围外，存在性已知】canvas-table 中存在 `emptyText` prop 与 `#empty` 插槽的空状态实现（grep 命中文件行），按约束未读取内容；如设计想参考须用户解除限制
6. 【补探索】`docs-site/components/*.md` 文档页 frontmatter/结构未读取——设计文档若含文档更新清单可能需要；`src/langs/en.js` 未逐键核对（结构与 zh.js 平行为推测）
