# Form 数据校验方案

## 目标

为 `<mu-form>` 增加声明式数据校验能力：通过 `rules` prop 定义规则，通过暴露的 `validate()` / `resetValidation()` 方法触发/重置校验。

## 现状分析

- `form.vue` — 接收 `model`、`items`，provide `form` 上下文
- `form-field.vue` — inject `form`，已有 `required` / `invalid` prop 和对应 CSS 样式（红色 label、星号标记）
- 无校验逻辑，`invalid` 纯靠外部手动控制

## API 设计

### Form props

| Prop | 类型 | 说明 |
|------|------|------|
| `rules` | `Object` | 校验规则，key 对应 `model` 字段名 |

### Rule 定义格式

```js
{
  fieldName: [
    // 内置规则（字符串简写）
    'required',
    'email',
    'number',

    // 内置规则（对象配置）
    { type: 'required', message: '请输入用户名' },
    { type: 'min', value: 6, message: '最少6个字符' },
    { type: 'max', value: 20, message: '最多20个字符' },
    { type: 'pattern', value: /^1\d{10}$/, message: '手机号格式不正确' },

    // 自定义校验函数
    (value, model) => value !== model.password ? '两次密码不一致' : true
  ]
}
```

### Form 暴露方法

| 方法 | 签名 | 返回值 | 说明 |
|------|------|--------|------|
| `validate` | `validate(fieldNames?: string[])` | `Promise<{ valid: boolean, errors: Record<string, string[]> }>` | 校验全部或指定字段 |
| `resetValidation` | `resetValidation()` | `void` | 清除所有校验错误状态 |
| `validateField` | `validateField(field: string)` | `Promise<string[]>` | 校验单个字段，返回错误消息数组 |

### Form events

| 事件 | 参数 | 说明 |
|------|------|------|
| `validate-error` | `{ valid: false, errors: Record<string, string[]> }` | 校验不通过时触发 |

### Form-field 变化

- 新增 `errorMessage` prop（由 form 自动通过 provide/inject 传递）
- 显示错误消息区域（在输入组件下方）
- 新增 CSS 类 `.mu-form-field--error` 展示错误文本

## 实现步骤

### Step 1: 创建校验规则引擎 `src/components/form/validate-rules.js`

内置规则类型：

| type | 说明 | 参数 |
|------|------|------|
| `required` | 非空检查（`null`/`undefined`/`''`/`[]` 视为空） | — |
| `email` | 邮箱格式 | — |
| `number` | 纯数字 | — |
| `min` | 最小长度 | `value` |
| `max` | 最大长度 | `value` |
| `minValue` | 最小值（数值比较） | `value` |
| `maxValue` | 最大值（数值比较） | `value` |
| `pattern` | 正则匹配 | `value` (RegExp) |

导出函数：
```js
// 执行单条规则，返回 true | string(errorMessage)
export function applyRule(rule, value, model)

// 执行字段的所有规则，返回 string[]
export function applyFieldRules(rules, value, model)
```

### Step 2: 修改 `form.vue`

1. `rules` prop 定义
2. 响应式 `errors` 对象存储各字段校验错误
3. provide `errors` 给子组件
4. 实现 `validate()`、`validateField()`、`resetValidation()`
5. `defineExpose` 暴露方法

```js
// 核心逻辑伪码
const errors = reactive({})

async function validateField(field) {
  const fieldRules = rules.value?.[field]
  if (!fieldRules) return []
  const value = props.model?.[field]
  const result = applyFieldRules(fieldRules, value, props.model)
  errors[field] = result
  return result
}

async function validate(fields) {
  const fieldNames = fields ?? Object.keys(rules.value ?? {})
  const allErrors = {}
  let valid = true
  for (const f of fieldNames) {
    const errs = await validateField(f)
    if (errs.length) {
      allErrors[f] = errs
      valid = false
    }
  }
  if (!valid) emit('validate-error', { valid, errors: allErrors })
  return { valid, errors: allErrors }
}

function resetValidation() {
  for (const key of Object.keys(errors)) {
    delete errors[key]
  }
}

provide('formErrors', errors)
defineExpose({ validate, validateField, resetValidation })
```

### Step 3: 修改 `form-field.vue`

1. inject `formErrors`
2. 计算当前字段错误消息
3. 在模板中渲染错误提示
4. `invalid` 状态自动与 errors 联动（有错误即 invalid）

模板变化：
```html
<div class="mu-form-field" :class="fieldClasses" ...>
  <span class="mu-form-field__label">...</span>
  <slot>...</slot>
  <span v-if="fieldError" class="mu-form-field__error">{{ fieldError }}</span>
</div>
```

新增 computed：
```js
const formErrors = inject('formErrors', null)
const fieldError = computed(() => formErrors?.[props.prop]?.[0] ?? '')
const hasError = computed(() => Boolean(fieldError.value))
```

`invalid` class 逻辑调整：`invalid || hasError`。

### Step 4: 添加错误提示样式 `form-field.scss`

```scss
.mu-form-field--error {
  & > .mu-form-field__error {
    color: var(--mu-danger-color);
    font-size: var(--mu-common-font-size-small); // 如无此变量则用 12px 基准
    line-height: 1.5;
  }
}
```

当 `label-align="top"` 时错误消息紧跟输入组件下方；默认布局时错误消息换行显示。

### Step 5: 补充 `item-types.js` 的 rules 字段透传

items 数据驱动模式下，field 配置中可声明 `rules`：

```js
{ prop: 'name', label: '名称', input: 'text', rules: ['required'] }
```

`resolveFormItems` 需要把 `rules` 收集汇总为 form 级别的 `rules` 对象，或者直接传递给 form-field 由其自行校验。

**推荐方案**：rules 仍然收集到 form 层面统一管理。`resolveFormItems` 返回 items 时保留 `rules` 字段，form 在 `resolvedItems` 变化时自动提取合并到内部 rules。

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/components/form/validate-rules.js` | 新建 — 校验规则引擎 |
| `src/components/form/form.vue` | 修改 — 增加 rules prop、errors 状态、validate 方法、provide errors |
| `src/components/form/form-field.vue` | 修改 — inject errors、显示错误提示、invalid 联动 |
| `src/components/form/form-field.scss` | 修改 — 错误提示样式 |

## 使用示例

### 声明式用法（items 模式）

```vue
<mu-form
  ref="formRef"
  :model="formData"
  :items="formItems"
/>
<mu-button @click="handleSubmit">提交</mu-button>

<script setup>
const formRef = ref()
const formData = reactive({ name: '', email: '', age: '' })

const formItems = [
  { prop: 'name', label: '姓名', input: 'text', rules: ['required'] },
  { prop: 'email', label: '邮箱', input: 'text', rules: ['required', 'email'] },
  { prop: 'age', label: '年龄', input: 'text', rules: [{ type: 'number' }, { type: 'minValue', value: 0 }] }
]

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (valid) { /* 提交 */ }
}
</script>
```

### 手动布局用法（slot 模式）

```vue
<mu-form ref="formRef" :model="formData" :rules="formRules">
  <mu-form-field label="姓名" prop="name" required />
  <mu-form-field label="邮箱" prop="email" />
</mu-form>

<script setup>
const formRules = {
  name: ['required'],
  email: ['required', 'email']
}
</script>
```
