VERDICT: AMENDED

# 设计审改记录（第 1 次）

被审对象：`02-design.md`（任务目录 `agent-docs/plans/20261028-inspector-design/`）
约束核对：`decisions.md` 四条均为已确认约束；设计采用独立渲染循环 + 受控 `update:value` + `change`，复用 `mu-form-field` 与既有输入控件，与「不照搬 ref、遵循 mussel 惯例、复用已有实现、不参考 table-ex」不冲突。审改过程中未读取、未引用 table-ex 任何实现。`未解问题` 第 2 项（文档同步不在本轮改动清单）按派发追加约束不作为异议。

## 检查项结论

1. **覆盖**：一致（改后）。原有 5 处验收手段不足以验证所声明标准：defaultValue 回显在 `null` / `{}` 下先命中空状态、`number` 小数/负数在 `type="number"` 下不可输入、"所有控件带 disabled 属性"对 radio 不成立、`update:value`（受控语义）无检查行、`empty-text` prop 无检查行。已逐条改入测试计划。
2. **事实一致**：一致（改后）。全部路径/符号已核（`src/components/form/form-field.vue`、`src/components/message/status-box.vue`（message/index.js:11 导出、components/index.js:51 注册）、`src/utils/type.js:60-74`、`column-types/index.js:7-25`、`input.js:7-21,54-59`、`select.js:4-11`、`switch.vue:24-25`、`catalog.js:45-95`、`vite.demo.config.js:60-106,108`）。修正 3 处行号引用与 1 处组件引用方式描述。
3. **约定一致**：一致。`defineOptions({ name: 'MusselInspector' })`、`Mu` 前缀注册过滤（components/index.js:31）、scss 就近 import（switch.vue:9）、BEM + `--mu-*`、`disabled || null`（switch.vue:2）、字符串标签控件（`INPUT_TYPES` 同法）均在库内有先例；`change` 事件为需求驱动首例，已注明。
4. **影响面**：一致（改后）。`src/index.js`、`vite.config.js`、`src/langs/*` 均无需改动；新增 `mu-select` 的 `disabled` 依赖 fallthrough（select.js:4-11 未声明，靠 combo-wrapper 的 `inputProps`），已由「仅 placeholder」补为「placeholder / disabled」并标注回归点。
5. **可实施**：一致（改后）。原步骤 3 用 `npx vite build` 做完成判据无效——该组件在步骤 5 之前未被 `src/components/index.js` 引用，构建图不含它；已改为可执行的 node 导入检查，并把 SFC/SCSS 编译验证挂到步骤 5 的 `npm run build`。原步骤 2 依赖不存在的本地 stylelint（`node_modules` 中无 stylelint，devDependencies 也无），已改为全局 `stylelint`。
6. **风险与回滚**：一致（改后）。回滚路径完整；补 `number` 原生输入的中间态丢失与 `componentProps: { type: 'text' }` 对策、`mu-radio-group` 禁用仅到容器层（键盘仍可切换）两项，二者原为无对策风险。
7. **范围**：一致。未超出验收标准 3 的六类字段；`componentProps` 逃生口沿用设计既有入口，未扩新 API。
8. **并行组**：一致。G1-a（`field-types.js`）与 G1-b（`inspector.scss`）文件不相交、无依赖；共享文件（`src/components/index.js`、`demo/src/catalog.js`）已在集成步骤 5 串行处理。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | 关键逻辑「分组」 | `key: title ?? '__none__'` → `key: \`${index}:${title ?? '__none__'}\`` | 同名 `group` 在 fields 中不相邻时会产生多个组，组 key 重复 → Vue `:key` 冲突，渲染/复用错乱。分组算法本身允许该情形（相邻判定），key 必须带位置信息 | 是 |
| 2 | 类型注册表 `number.normalize` | `'' \|\| null → null，否则 Number(v)` → 数值正则匹配合法值才 `Number(v)`，未完成输入（`-`、`1.`）保留字符串 | 原写法把 `'1.'`、`'-'` 变成 `NaN`，一旦该字段经 `componentProps: { type: 'text' }` 走文本输入，中间态会写入 `NaN` 并回传宿主 | 是 |
| 3 | 实施步骤 3 完成判据 | `npx vite build`（或步骤 6 的 `npm run build`）无编译错误 → `node -e "import('./src/components/inspector/field-types.js')..."` 校验导出；SFC/SCSS 编译移至步骤 5 | 步骤 3 时 `src/components/index.js` 尚未引用 inspector（步骤 5 才改），`vite build` 入口是 `src/index.js`（vite.config.js:84-87），构建图不包含 `inspector.vue`，该判据永远通过却验证不到任何新代码 | 是 |
| 4 | 实施步骤 3 补充 | 追加：`<script setup>` 首行须 `import './inspector.scss'` | 该样式不被其它文件引用，漏 import 不报错但产物无样式（switch.vue:9 为库内写法先例） | 是 |
| 5 | 实施步骤 2 完成判据 | 「stylelint 或人工核对」 → `stylelint src/components/inspector/inspector.scss` 无报错，并注明用全局 `/usr/local/bin/stylelint`、不要用 `npx` | `package.json:10-17` 无 lint 脚本，`node_modules/.bin` 无 stylelint（仓库只有 `.stylelintrc.json`），`npx stylelint` 会拉取远端包 | 是 |
| 6 | 实施步骤 5 完成判据 | 追加 `npm run build` 通过 | 步骤 5 才把 `inspector.vue`/`inspector.scss` 接入构建图（src/components/index.js:4,47 的 `import * as` + `_install` 模式），编译与打包错误只能在此步暴露 | 是 |
| 7 | 实施步骤 6 | 追加「demo 页面在步骤 5 登记后才进入 demo 构建图」 | `buildInputs()` 只枚举 catalog 登记项（vite.demo.config.js:60-106），未登记页不会被编译，编译错误只会在重启后暴露 | 是 |
| 8 | 改动清单 `main-view.vue` 行 | 演示节 → 补「`v-model:value` 受控回写、空状态含 `empty-text` 覆盖、分组含非相邻同名 group」 | 与测试计划新增/修改的检查行保持一致（清单、测试计划须互相对齐） | 是 |
| 9 | 测试计划「值回显」 | 「value 缺键的字段显示 defaultValue」 → 追加：演示 value 需保留一个非缺省键，因 `null` / `{}` 先命中空状态 | `isEmpty({})` 为真（type.js:60-74）、Props 注释同样规定 `{}` → 空状态；全缺键的 value 根本渲染不出字段，原检查方式无法执行 | 是 |
| 10 | 测试计划「分组」 | 追加相邻语义一节 | JSDoc 规定「相同 group 且**相邻**」，算法（相邻才合并）与需求文档「相同 group 同组」不同，需以可观察方式固化该取舍 | 是 |
| 11 | 测试计划新增「受控回写」行 | 无 → 新增 | 验收标准 3 含「值回显」，设计的核心机制是受控 `update:value`（组件不改 `props.value`），原计划无任何行验证该事件生效 | 是 |
| 12 | 测试计划「空状态」 | 只测默认文案与 `#empty` → 增 `empty-text` 覆盖 | `emptyText` 是设计的 props（接口节），无对应验证行 | 是 |
| 13 | 测试计划「全局禁用 / 字段级禁用」 | 「所有控件带 `disabled` 属性且不可交互」 → 改为逐控件断言（`input[disabled]`、`.mu-switch[disabled]`、`.mu-radio-group[disabled]`），并注明 radio 仅容器层禁用 | `mu-radio-group` 只把 `disabled` 渲染为容器属性，组内 `mu-radio` 未接 `disabled`（radio-group.vue:2-9），原生 input 无该属性；原判据必然不通过 | 是 |
| 14 | 测试计划「number 规整」 | 「输入后为 number；清空为 null」 → 限定为整数输入，并注明小数/负数不在自动验收内 | `<input type="number">` 输入 `-` / `1.` 时 `value` 为空串，受控回写会清空中间态；原判据若含小数将无法通过 | 是 |
| 15 | 风险：number | 「无步进/精度控制」 → 部分状态丢失 + `componentProps: { type: 'text' }` 对策 + 大数/前导零单列 | 原条目未识别「小数/负数无法录入」这一实际能力缺失，且无对策；`type` 是 mu-input 已声明 prop（input.vue:21），componentProps 最后合入可覆盖（设计自身 `Object.assign(attrs, field.componentProps)`） | 是 |
| 16 | 风险：新增 radio 禁用条目 | 无 → 新增 | `check.scss:35-40` 仅 `pointer-events: none`，键盘可切换；验收标准 3 的「禁用」需限定口径并声明不修库组件 | 是 |
| 17 | 风险：mu-select | 「placeholder 依赖 attrs 透传」 → 「placeholder / disabled 依赖 attrs 透传」，并点明这是禁用生效的唯一路径 | `select.js:4-11` 无 `placeholder`/`disabled`，两者靠 fallthrough 到 combo-wrapper（`combo-wrapper.vue:52` 展开 `inputProps`，input.js:7-21）；disabled 是验收标准 3 的必需项，不能只记 placeholder | 否 |
| 18 | Emits 注释 | `nextValue = { ...value, [name]: newValue }` → `value = normalize(rawValue)`、`[name]: value` | 与实际派发（关键逻辑 `onFieldInput`）命名/顺序不一致，易误实现为未规整值 | 否 |
| 19 | 遵循约定：`status-box` | 「直接 import（`MuStatusBox`，message/index.js 已导出）」 → 「按全局注册标签 `<mu-status-box>` 使用」 | 模板节用标签 `<mu-status-box>`，而此处写直接 import 但模板无对应绑定，前后矛盾；`MuStatusBox` 由 components/index.js:51 的 `_install(MessageComponents)` 注册，标签可用 | 否 |
| 20 | 遵循约定：`form-field` 复用依据 | 「全部访问为 optional chaining（form-field.vue:45）」 → 列明 `inject('form', {})` 缺省下 `vModel=false` 走插槽、各 `?.` 调用点（45,64,83,91,101,107,112） | 原证据不足以支撑「可脱离 mu-form 单独使用」这一关键前提（若默认控件被渲染，插槽会被 bypass） | 否 |
| 21 | 遵循约定：ColumnTypes 行号 | `column-types/index.js:16-34` → `:7-25` | 实际 `ColumnTypes` 在 7-21、`resolveColumnType` 在 23-25；原范围未覆盖注册表定义 | 否 |
| 22 | demo 约定 / 风险行号 | `vite.demo.config.js:58-83` → `:60-106`，并注 `input` 于 L108 固化 | 实际 `buildInputs()` 起于 60、止于 106，`const input = buildInputs()` 在 108 | 否 |
| 23 | 实施步骤 5 catalog 引用 | 「form 分类之后」 → 「form 分类（L45-95，其后为 data 分类）之后」，并补 `category/title/desc` 与 `title` 缺失时回退路径（demo-page.vue:54） | 定位需可执行；catalog 分类块的必填字段是构建/导航前提 | 否 |
| 24 | 实施步骤 1 完成判据 | 「`node -e` 或后续步骤 3 编译验证」 → 「由步骤 3 的 node 导入检查验证」 | 「步骤 3 编译验证」已不成立（见 #3），措辞与改后步骤对齐 | 否 |
| 25 | 实施步骤 4 完成判据 | 追加「该页面在步骤 5 后才进入 demo 构建图，编译验证在步骤 6」 | 避免把未登记页的编译失败误判为步骤 4 失败 | 否 |
| 26 | 测试计划「change 事件」 | 追加 color 提交时机（color-input.vue:73-100）、defaultValue 键不进 nextValue | 前者决定该行能否复现，后者是 ref 5.2 语义的直接推论，避免验收时误判为缺陷 | 否 |
| 27 | 样式要点 `group-title` | 单独 `&__group-title:first-child` → 并入 `&:first-child, .mu-inspector__header + &` | header 插槽渲染时组标题不是 `:first-child`，首组会多出 `margin-top`；header 自身已有 `margin-bottom` 时会出现双倍间距 | 否 |
| 28 | 被拒绝的备选 3 | 「`Number()` 转换」 → 「完整数值 `Number()`、未完成输入保留字符串」 | 与 #2 改后的 normalize 口径一致 | 否 |

实质改动 16 项（#1-#16），非实质 12 项（#17-#28）。

## 异议

无。
