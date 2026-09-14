<script setup>
  import { ref } from 'vue'

  const value = ref('莫扎特')
</script>

# 组合输入 MuComboBox

组合输入框，支持**输入**与**单选**。与 [MuSelect](/components/select) 的区别：MuComboBox 允许用户自由输入文本（`editable`），输入框可直接打字过滤或输入新值。

::: info 选型
若无需用户输入，使用 `MuSelect`。
:::

## 基础用法

<div class="mu-demo mu-demo-col">
  <mu-combo-box v-model="value" :options="artists" placeholder="combo box" />
  <span class="text-subtle">绑定值：{{ value || '（空）' }}</span>
</div>

```html
<mu-combo-box v-model="value" :options="artists" />
```

```javascript
const artists = [
  { value: 'beethoven', label: '贝多芬' },
  { value: 'mozart', label: '莫扎特' },
  '-',
  { value: 'strauss', label: '斯特劳斯' }
]
```

## 允许自由输入 `editable`

设置 `editable` 后输入框可直接输入；**此时不支持选项 `label`，直接用 `value` 显示**。

<div class="mu-demo mu-demo-col">
  <mu-combo-box v-model="value" editable :options="['Apple', 'Banana', 'Cherry']" placeholder="editable" />
</div>

```html
<mu-combo-box v-model="value" editable :options="options" />
```

## 自定义面板 `#dropdown`

与 MuSelect 共享插槽体系（`dropdown-header` / `dropdown-items` / `dropdown` / `dropdown-footer`）。`#dropdown` 完全接管面板内容：

```html
<mu-combo-box v-model="value">
  <template #dropdown>
    <mu-option value="Ludwig van Beethoven" />
    <mu-option value="Wolfgang Amadeus Mozart" />
    <mu-option value="Frédéric François Chopin" />
  </template>
</mu-combo-box>
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `editable` | Boolean | `false` | 是否允许用户输入（设为 `true` 后不支持选项 `label`，直接用 `value` 显示） |
| (其他) | — | — | 继承全部 `MuSelect` 属性 |

插槽同 `MuSelect`（`dropdown-header` / `dropdown-items` / `dropdown` / `dropdown-footer`）。
