<script setup>
  import { ref, computed } from 'vue'

  const selected = ref('mozart')
  const normalValue = ref()
  const compositeValue = ref()
  const slotItem = ref()
  const searchKey = ref('')

  const artists = [
    { value: 'beethoven', label: '贝多芬' },
    { value: 'mozart', label: '莫扎特' },
    { value: 'chopin', label: '肖邦', disabled: true },
    '-',
    { value: 'strauss', label: '斯特劳斯' }
  ]

  const items = ['admin', 'user', 'editor', 'viewer']
  const filteredItems = computed(() =>
    items.filter(item => !searchKey.value || item.includes(searchKey.value))
  )
</script>

# 下拉选择 MuSelect

单选下拉框。**不需要用户输入时优先使用 MuSelect**（而非 [MuComboBox](/components/combo-box)）。下拉面板默认与锚点同宽，弹出位置自动计算（锚点下方优先、空间不足时翻转）。

## 基础用法

`options` 为选项数组：`[{ label, value, disabled? }]`。规则与 `dropdown-items` 一致：`-` 为分隔线、`{ is: '-' }` 分隔项带标题、纯字符串项视为 `{ value }`。

<div class="mu-demo">
  <mu-select
    v-model="selected"
    placeholder="select an artist"
    prefix="Artist:"
    :options="artists" />
  <span class="text-subtle">选中值：{{ selected || '（空）' }}</span>
</div>

```html
<mu-select v-model="selected" :options="artists" />
```

```javascript
const artists = [
  { value: 'beethoven', label: '贝多芬' },
  { value: 'chopin', label: '肖邦', disabled: true },  // 禁用项
  '-',                                                  // 分隔线
  { value: 'strauss', label: '斯特劳斯' }
]
```

回显规则：modelValue 为纯 `value` 时，从当前 `options` 反查 `label` 显示；查不到时直接显示原始 `value`。

## value-mode

`value-mode="composite"` 后 modelValue 为 `{ value, label }` 结构，选中时 `label` 随值一并存储，**回显不再依赖 options**。

适用场景：

- **options 动态变化 / 异步加载**（搜索过滤、级联联动、懒加载）：`normal` 模式下选中后 options 被替换或清空时，回显会退化为原始 value；`composite` 始终稳定回显
- **提交数据需同时携带 `label`**：直接提交 modelValue，免去二次查表

<div class="mu-demo">
  <mu-select
    v-model="compositeValue"
    value-mode="composite"
    :options="[{ value: 'admin', label: '管理员' }, { value: 'user', label: '用户' }]"
    placeholder="composite 模式" />
  <span class="text-subtle">{{ JSON.stringify(compositeValue) || '（空）' }}</span>
</div>

```javascript
const role = ref('admin')                              // normal：modelValue 为纯 value
const role = ref({ value: 'admin', label: '管理员' })   // composite：modelValue 为 { value, label }
```

::: warning
`composite` 的初始值 / 回填值应提供完整 `{ value, label }`，缺 `label` 时回退显示 `value`。
:::

## 带搜索框的可过滤下拉

`options` 传入过滤结果，`#dropdown-header` 插槽放 `MuSearchInput`。选项渲染、限高（`--mu-list-item-height` × 8）与滚动由面板内置滚动容器接管：

<div class="mu-demo">
  <mu-select
    v-model="slotItem"
    placeholder="search & select"
    :options="filteredItems">
    <template #dropdown-header>
      <mu-search-input
        v-model="searchKey"
        input-style="solid"
        class="mb-half"
        style="width: 100%;" />
    </template>
  </mu-select>
</div>

```html
<mu-select v-model="selected" placeholder="search & select" :options="filteredItems">
  <template #dropdown-header>
    <mu-search-input v-model="searchKey" input-style="solid" class="mb-half" style="width: 100%;" />
  </template>
</mu-select>
```

::: warning
**不要用 `#dropdown` 插槽实现带搜索框的下拉列表**——`#dropdown` 用于完全接管面板（嵌入树、表格等非选项型内容），此模式下无 `dropdown-header` / 内置滚动容器。统一使用上面的 `options` + `#dropdown-header` 方式。
:::

## 自定义选项 `#dropdown-items` 与 MuOption

自定义项内容时优先使用 `#dropdown-items` 插槽（享受内置滚动容器）；`MuOption` 必须置于 `MuSelect` / `MuMultiSelect` / `MuComboBox` 的插槽内使用。通过 `options` 属性渲染时内部自动生成 `MuOption`，无需手写。

```html
<mu-select v-model="selected">
  <template #dropdown-items>
    <mu-option value="admin" label="管理员" icon="settings" />
    <mu-option value="user" label="用户" />
  </template>
</mu-select>
```

### MuOption

| 属性 | 类型 | 说明 |
|------|------|------|
| `value` | — | 选项值，必填（选中匹配的依据） |
| `label` | String | 显示文字，缺省时回退到 `value` |
| `icon` | String | 选项前置图标 |
| (其他) | — | 继承 `MuDropdownItem` 属性 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义选项内容，作用域插槽暴露 `{ selected }`（是否处于选中态，Boolean） |

> 多选模式（父级为 `MuMultiSelect`）下，默认内容会在选中项前显示 `check` 图标；单选模式不显示。

## 插槽

| 插槽 | 说明 |
|------|------|
| `dropdown-header` / `dropdown-footer` | 下拉面板顶部 / 底部区域（搜索框 / 操作按钮），仅 items 模式渲染 |
| `dropdown-items` | 自定义下拉项内容，渲染于面板内置滚动容器内；**自定义项内容时优先使用** |
| `dropdown` | 完全自定义下拉面板整体内容（仅当需要非选项型内容时使用），此模式下 `dropdown-header` / `dropdown-footer` 与内置滚动容器均不渲染 |

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `options` | Array | 下拉选项列表 |
| `option-key` | String | 选项的 key 属性，默认 `value` |
| `value-mode` | String | `normal`（默认）\| `composite`（modelValue 为 `{label, value}`）|
| `dropdown-scrollbar` | Boolean | 是否渲染下拉面板自定义滚动条，默认 `false`；仅当使用 `#dropdown` 插槽时生效，items 模式下由面板内置滚动容器接管 |
| (其他) | — | 继承全部 `MuInput` 属性及 `MuDropdown` 的 `dropdown-` 前缀属性（如 `dropdown-width`、`dropdown-disabled`） |
