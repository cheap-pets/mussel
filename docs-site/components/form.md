<script setup>
  import { ref } from 'vue'

  const formRef = ref()

  const form = ref({
    name: '',
    phone: '',
    birthday: '',
    role: '',
    memo: ''
  })

  const rules = {
    name: 'required',
    phone: { required: true, requiredMessage: '手机号不能为空' },
    role: { required: true, message: '请选择角色' }
  }

  const items = [
    '基本信息',
    { prop: 'name', label: '姓名', width: 1 / 2, required: true },
    { prop: 'phone', label: '手机号', width: 1 / 2, required: true },
    'hr',
    [
      { prop: 'birthday', label: '生日', input: 'date' },
      {
        prop: 'role',
        label: '角色',
        input: {
          type: 'select',
          options: [{ value: 'admin', label: '管理员' }, { value: 'user', label: '用户' }]
        }
      }
    ],
    { prop: 'memo', label: '备注', input: { type: 'memo', style: 'height: 80px' } }
  ]

  function validate () {
    const result = formRef.value?.validate()
    console.log('validate:', result)
  }

  function resetValidation () {
    formRef.value?.resetValidation()
  }
</script>

# 表单 MuForm

表单容器，统一管理表单字段的布局与校验。支持两种用法：

- **声明式**：`MuFormRow` / `MuFormField` 子组件组合，自由度最高
- **数据驱动**：`items` 数组描述表单结构，自动绑定 `model` 并渲染对应输入组件，适合配置化的中后台表单

## 声明式用法

`label-width` / `label-align` 统一控制标签；`MuFormRow` 在一行内水平排列多个字段；`required` 添加必填样式并参与校验；`error` 手动设置错误状态（字符串显示文案，`true` 仅显示错误样式）。

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-form label-width="80px" label-align="right" style="max-width: 640px;">
    <mu-form-row>
      <mu-form-field label="姓名" :width="1/2">
        <mu-input v-model="form.name" />
      </mu-form-field>
      <mu-form-field label="手机号" :width="1/2" required>
        <mu-input v-model="form.phone" type="tel" />
      </mu-form-field>
    </mu-form-row>
    <mu-form-field label="备注" error="备注格式不正确">
      <textarea class="mu-input" style="height: 60px;" />
    </mu-form-field>
  </mu-form>
</div>

```html
<mu-form label-width="80px" label-align="right">
  <mu-form-row>
    <mu-form-field label="姓名" :width="1/2">
      <mu-input v-model="form.name" />
    </mu-form-field>
    <mu-form-field label="手机号" :width="1/2" required>
      <mu-input v-model="form.phone" type="tel" />
    </mu-form-field>
  </mu-form-row>
  <mu-form-field label="备注" error="备注格式不正确">
    <textarea class="mu-input" style="height: 60px" />
  </mu-form-field>
</mu-form>
```

> 字段内也可直接放原生元素（如 `<input class="mu-input">`、`<textarea class="mu-input">`），此时无自动校验联动。

## 数据驱动用法

`items` 数组描述表单结构，字段通过 `prop` 自动双向绑定 `model`：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-form
    ref="formRef"
    :model="form"
    :items="items"
    :rules="rules"
    label-width="80px"
    label-align="left"
    style="max-width: 640px;" />
  <div class="flex gap-1x">
    <mu-button color="primary" caption="校验" @click="validate" />
    <mu-button caption="重置校验" @click="resetValidation" />
  </div>
</div>

```html
<mu-form ref="formRef" :model="form" :items="items" :rules="rules" label-width="80px" label-align="left" />
<mu-button color="primary" @click="formRef.validate()">提交</mu-button>
```

```javascript
const form = ref({ name: '', phone: '', birthday: '', memo: '', role: '' })

const rules = {
  name: 'required',
  phone: { required: true, requiredMessage: '手机号不能为空' },
  role: { required: true, message: '请选择角色' }
}

const items = [
  '基本信息',                                             // 分组标题
  { prop: 'name', label: '姓名', width: 1 / 2, required: true },
  { prop: 'phone', label: '手机号', width: 1 / 2, required: true },
  'hr',                                                   // 分隔线
  [                                                       // 子行：两个元素排成一行
    { prop: 'birthday', label: '生日', input: 'date' },
    { prop: 'role', label: '角色', input: {
      type: 'select',
      options: [{ value: 'admin', label: '管理员' }, { value: 'user', label: '用户' }]
    }}
  ],
  { prop: 'memo', label: '备注', input: { type: 'memo', style: 'height: 120px' } }
]
```

## items 元素类型

| 类型 | 写法 | 说明 |
|------|------|------|
| 标题 | `'字符串'` | 渲染为表单分组标题 |
| 分隔线 | `'hr'` | 渲染为 `<hr>` |
| 换行 | `'->'` | 渲染为 `flex-break`，强制换行 |
| 子行 | `[...]` | 数组元素，渲染为一行 `mu-form-row` |
| 字段 | `{ prop, label, ... }` | 渲染为 `mu-form-field`，自动绑定 `model[prop]` |
| 自定义 | `{ is: '组件名', ... }` | 渲染为任意自定义组件 |

## 校验规则 rules

key 为字段名，value 支持三种格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| 字符串 | `'required'` | 必填校验 |
| 函数 | `(value) => false` | 自定义校验，返回 `false` 或错误消息字符串 |
| 对象 | `{ required: true, message }` | 支持更多配置 |

对象属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `required` | Boolean | 是否必填 |
| `validator` | Function | 自定义校验函数 `(value, params) => false \| string` |
| `message` | String | 校验失败时的提示消息 |
| `requiredMessage` | String | 必填校验失败的提示消息（优先于 message） |

字段置于 `MuFormField` 内时，输入值变更会**自动触发该字段校验**，错误状态自动同步到输入组件的 `invalid` 样式。

## 表单行 MuFormRow

一行内水平排列多个字段。支持 `items` 数组（行内字段定义，支持标题与自定义组件，不支持 `hr` / `->` / 子行）：

```html
<mu-form-row :items="[
  { prop: 'startDate', label: '开始', input: 'date' },
  { prop: 'endDate', label: '结束', input: 'date' }
]" />
```

## API

### MuForm

| 属性 | 类型 | 说明 |
|------|------|------|
| `model` | Object | 表单数据对象，用于 `items` 模式下的双向绑定 |
| `items` | Array | 表单项定义数组（数据驱动模式） |
| `rules` | Object | 表单校验规则，key 为字段名 |
| `label-width` | String | 默认标签宽度（子 `MuFormField` 继承） |
| `label-align` | String | 默认标签对齐：`left` \| `top` \| `right` |

**方法（通过 ref 调用）：**

| 方法 / 属性 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `validate()` | — | `{ ok: true }` \| `{ errors }` | 校验全部字段 |
| `resetValidation()` | — | — | 清除所有校验错误状态 |
| `errors` | — | Object | 各字段当前校验错误（`{ 字段名: 错误信息 }`） |

### MuFormRow

| 属性 | 类型 | 说明 |
|------|------|------|
| `items` | Array | 行内字段定义，支持标题、字段、自定义组件（不支持 `hr` / `->` / 子行） |
