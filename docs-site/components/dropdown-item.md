<script setup>
  import { ref } from 'vue'

  const checked = ref(['a'])
  const picked = ref('x')
</script>

# 下拉项 MuDropdownItem

下拉面板内的菜单项组件，即 `dropdown-items` 数据数组对应的组件形式。既可走数据驱动（`dropdown-items`），也可在 `#dropdown-items` 插槽中手写（优先）；`#dropdown` 插槽仅用于完全接管面板的场景。

点击后自动收起面板；若设置了 `action`，面板会额外向上触发 `action` 事件。

## 基础项 MuDropdownItem

<div class="mu-demo">
  <mu-dropdown>
    <mu-button>操作</mu-button>
    <template #dropdown-items>
      <mu-dropdown-item label="编辑" icon="edit" action="edit" />
      <mu-dropdown-item label="复制" icon="copy" action="copy" />
      <mu-dropdown-item label="删除" icon="delete" action="delete" />
      <mu-dropdown-item label="导出（禁用）" icon="download" disabled />
    </template>
  </mu-dropdown>
</div>

```html
<mu-dropdown-item label="编辑" icon="edit" action="edit" />
<mu-dropdown-item label="导出" disabled />
```

## 勾选项 MuDropdownCheckItem

带勾选框的下拉项，用于多选场景。`v-model` 绑定数组时结合 `value` 收集选中项：

<div class="mu-demo">
  <mu-dropdown-button split-button caption="多选菜单">
    <template #dropdown-items>
      <mu-dropdown-check-item v-model="checked" value="a" label="选项 A" />
      <mu-dropdown-check-item v-model="checked" value="b" label="选项 B" />
      <mu-dropdown-check-item v-model="checked" value="c" label="选项 C" disabled />
    </template>
  </mu-dropdown-button>
  <span class="text-subtle">已选：{{ checked.join('、') }}</span>
</div>

```html
<!-- 多选：用数组收集各勾选项的 value -->
<mu-dropdown-check-item v-model="checked" value="apple" label="苹果" />
<mu-dropdown-check-item v-model="checked" value="banana" label="香蕉" />
```

## 单选项 MuDropdownRadioItem

带单选框的下拉项，用于多选一场景。`v-model` 与被选中项的 `value` 匹配：

<div class="mu-demo">
  <mu-dropdown-button split-button caption="单选菜单">
    <template #dropdown-items>
      <mu-dropdown-radio-item v-model="picked" value="x" label="选项 X" />
      <mu-dropdown-radio-item v-model="picked" value="y" label="选项 Y" />
    </template>
  </mu-dropdown-button>
  <span class="text-subtle">选中：{{ picked }}</span>
</div>

```html
<mu-dropdown-radio-item v-model="picked" value="a" label="选项 A" />
<mu-dropdown-radio-item v-model="picked" value="b" label="选项 B" />
```

## dropdown-items 数据结构

`dropdown-items`（MuDropdownPanel / MuDropdown / MuDropdownButton）与 `menus`（MuContextMenu）共用的下拉项数组定义：

```javascript
[
  { label: '编辑', icon: 'edit', action: 'edit' },
  { label: '删除', icon: 'delete', action: 'delete' },
  '-',                                          // 分隔线快捷方式
  { is: '-', label: '分组标题' },                // 分隔项带标题
  { is: 'check', label: '全选', value: 'all' },  // 勾选项简写
  { label: '导出', disabled: true }
]
```

- 对象项的各字段即项组件的 prop（默认 `MuDropdownItem`），透传给渲染出的项组件
- `is`：覆写默认项组件，支持简写：`'-'`（分隔线）、`'item'`、`'check'`（勾选项，等价 `is: 'mu-dropdown-check-item'`）、`'radio'`（单选项）；也可写完整组件名
- `'-'`：纯字符串项的分隔线快捷方式，其余纯字符串项视为 `{ label: 字符串 }`

## API

### MuDropdownItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | String | 项文字 |
| `icon` | String | 前置图标 |
| `action` | — | 点击触发的动作标识，由父级面板向上 emit `action` |
| `disabled` | Boolean | 是否禁用 |

### MuDropdownCheckItem / MuDropdownRadioItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `v-model` | Boolean \| Array（Check）/ 任意（Radio） | 选中状态；Check 多选时绑定数组（结合 `value`） |
| `value` | — | 当前项标识；Check 多选模式下被收集进 `v-model` 数组；Radio **必填**，与 `v-model` 匹配 |
| `label` | String | 项文字；未设置时回退显示 `value` |
| `icon` | String | 前置图标 |
| `action` | — | 点击触发的动作标识 |
| `disabled` | Boolean | 是否禁用 |
