# 设计者回应（第 1 次，针对 06-amend-1.md）

核对过程遵守「不参考 table-ex」约束：未读取、未引用 table-ex 任何实现，全部依据为库内其余源码与探索报告。

## 实质改动回应（#1–#16）

| # | 回应 | 说明 |
|---|---|---|
| 1 | 接受 | 分组按「相邻」判定，同名 group 被无 group 字段隔开时产生多个同名 title 组，仅以 title 作 key 会重复 → Vue `:key` 冲突。key 带 `${index}:` 前缀后唯一。改动已落实（关键逻辑 `groups`），无需进一步修改 |
| 2 | 接受（附实现修正） | 改动方向正确：`Number('-')` 为 `NaN`，原写法经 `componentProps: { type: 'text' }` 走文本输入时会把中间态写成 `NaN` 回传宿主。**但台账改后的正则未兑现其自身声称的语义**：`\d+(\.\d*)?` 中 `\.\d*` 允许小数点后零位，`'1.'` 匹配正则 → `Number('1.') === 1`，与同条注释「`'-'`、`'1.'` 等未完成输入原样保留字符串」矛盾，且使 #15 的 `type: 'text'` 对策失效一半（受控回写下小数点被吃掉，`'1.5'` 无法逐字符输入）。已在 `02-design.md` 类型注册表节修正：`\.\d*` → `\.\d+`（`/^[-+]?(\d+(\.\d+)?\|\.\d+)([eE][-+]?\d+)?$/`）并注明排除 `'1.'` 的理由。修正后逐例核验：`'-'` 不匹配保留、`'1.'` 不匹配保留、`'1.5'`/`'.5'`/`'1e5'`/`'1.5e-3'` 匹配转 number |
| 3 | 接受 | 依据已核实：`vite.config.js:86-87` 入口为 `src/index.js`，步骤 3 时 `src/components/index.js` 尚未引用 inspector（步骤 5 才挂入），构建图不含 `inspector.vue`，原 `vite build` 判据验证不到新代码。node 导入检查可行：`package.json:6` `"type": "module"`，node 按加载 ESM 解析 `.js`；`field-types.js` 为纯常量 + 函数无 `@/` 依赖，设计已注明此前提。已落实（步骤 3） |
| 4 | 接受 | scss 就近 import 是库内惯例（switch.vue:9），漏 import 不报错但产物无样式。已落实（步骤 3 补充） |
| 5 | 接受 | 已核实：`node_modules/.bin` 无 stylelint（grep 0 命中）、`package.json` devDependencies 无 stylelint（grep 0 命中）、全局 `/usr/local/bin/stylelint` 存在（`which` 确认）。`npx stylelint` 会触发远端拉取，警告正确。已落实（步骤 2） |
| 6 | 接受 | 步骤 5 挂入 `src/components/index.js` 后 `inspector.vue` / `inspector.scss` 才进入构建图，编译与打包错误只能在此步暴露。已落实（步骤 5 判据追加 `npm run build`） |
| 7 | 接受 | 已核实 `vite.demo.config.js:60-106`：`buildInputs()` 在配置加载期枚举 catalog 登记项生成 input，L108 `const input = buildInputs()` 固化；未登记页不编译，编译错误在重启后才暴露。已落实（步骤 6） |
| 8 | 接受 | 与测试计划新增/修改的检查行（受控回写、empty-text、非相邻同名 group）对齐，清单与测试计划互相对应。已落实（改动清单 main-view.vue 行） |
| 9 | 接受 | 已核实 `type.js:60-74`：`isEmpty({})` 为真（`Object.keys(value).length === 0` 分支），`value = {}` 先命中空状态，全缺键的 value 渲染不出字段，原检查方式不可执行。演示 value 保留一个非缺省键后缺键字段才可观察 defaultValue。已落实（测试计划「值回显」行） |
| 10 | 接受 | 分组算法（相邻才合并）与需求文档「相同 group 同组」不同，取舍需以可观察方式固化，「同名 group 被隔开渲染为两个同名组标题」检查行与 JSDoc、关键逻辑三方一致。已落实（测试计划「分组」行） |
| 11 | 接受 | 受控 `update:value` 是设计核心机制（组件不改 `props.value`），验收标准 3「值回显」隐含其生效验证，原计划缺失。已落实（测试计划新增「受控回写」行） |
| 12 | 接受 | `emptyText` 是接口节声明的 props，原计划无验证行。已落实（测试计划「空状态」行） |
| 13 | 接受 | 已核实 `radio-group.vue:2` 组级 `disabled` 仅落容器属性 `:disabled="disabled \|\| null"`，L9 仅下发选项级 `option.disabled`，组级禁用不下发给 `mu-radio`；`radio.vue:2-3` 的 `disabled` 落在 label 元素，原生 `<input type="radio">` 无 disabled 属性。「所有控件带 disabled 属性」对 radio 不成立，逐控件断言（`input[disabled]` / `.mu-switch[disabled]` / `.mu-radio-group[disabled]`）是唯一可执行口径。已落实（测试计划「全局禁用 / 字段级禁用」行） |
| 14 | 接受 | 与 #15 一致：`type="number"` 下 `'-'` / `'1.'` 中间态 `value` 为空串（浏览器行为），受控回写清空中间态，小数/负数无法逐字符输入，原判据含小数必不通过。限定整数并注明口径。已落实（测试计划「number 规整」行） |
| 15 | 接受 | 原条目只记「无步进/精度控制」，未识别「小数/负数无法录入」这一实际能力缺失且无对策。对策路径成立：`type` 是 mu-input 已声明 prop（input.vue:21），`resolveFieldControl` 中 `Object.assign(attrs, field.componentProps)` 最后合入可覆盖；`normalize` 对未完成输入保留字符串。注意：该对策的「保留字符串」承诺由 #2 回应中的正则修正后才真正成立（`\.\d*` 下 `'1.'` 仍被转为 1，小数点被吃掉）。已落实（风险 number 条），正则部分已按 #2 回应修正 |
| 16 | 接受 | 已核实 `check.scss:35-40`：`.mu-radio-group[disabled] > .mu-radio` 仅 `pointer-events: none`，拦截鼠标不拦截键盘；组内原生 input 未设 disabled。验收标准 3「禁用」需限定口径并声明不修库组件，与 #13 的断言口径一致。已落实（风险 radio 条） |

**汇总**：接受 16 / 不接受 0；其中 #2、#15 接受后在 `02-design.md` 附带 1 处实现级修正（`NUMERIC_PATTERN` 的 `\.\d*` → `\.\d+`，含注释），修正理由与逐例核验见 #2 行。

## 异议回应

无异议，无需回应。

## 接受后的一致性核查

- `NUMERIC_PATTERN` 修正后复核引用处：「被拒绝的备选」3（「完整数值 `Number()`、未完成输入保留字符串」）、风险 number 条、测试计划 number 行的口径均与修正后语义一致，无需改动。
- 实施步骤与测试计划、改动清单的对齐关系未受修正影响（正则改动位于 `field-types.js` 内部实现，不改文件集合、判据与验收行）。
- 遵循约定节引用（form-field.vue、column-types/index.js:7-25、components/index.js:51、check.scss:35-40、vite.demo.config.js:60-106/108）经抽查与源码一致，维持不动。
