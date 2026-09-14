<script setup>
  import { ref } from 'vue'

  const keyword = ref('')
</script>

# 搜索输入框 MuSearchInput

带防抖与默认搜索图标的输入框，常作为列表/表格或下拉选项的过滤搜索框。基于 [MuInput](/components/input) 封装，继承其全部属性与事件。

## 基础用法

输入即时显示（内部维护 `localValue`）；`update:modelValue` 仅在**停止输入 `debounce-delay` 毫秒后**触发，且仅当值确实变化时——避免每 keystroke 触发查询。

其余事件（`input`、`focus`、`blur`、`enter` 等）不受防抖影响，即时触发。

<div class="mu-demo">
  <mu-search-input v-model="keyword" placeholder="防抖 500ms（默认）" style="width: 260px;" />
  <span class="text-subtle">绑定值：{{ keyword || '（空）' }}</span>
</div>

```html
<mu-search-input v-model="keyword" />
```

## 自定义防抖延迟 `debounce-delay`

```html
<!-- 200ms 防抖 -->
<mu-search-input v-model="keyword" :debounce-delay="200" />

<!-- 0 即为不防抖 -->
<mu-search-input v-model="keyword" :debounce-delay="0" />
```

<div class="mu-demo">
  <mu-search-input v-model="keyword" :debounce-delay="0" placeholder="无防抖" style="width: 260px;" />
</div>

## 作为下拉过滤框

配合 `MuSelect` 的 `#dropdown-header` 插槽实现可搜索下拉（推荐方式，见 [MuSelect](/components/select)）：

```html
<mu-select v-model="selected" :options="filteredItems">
  <template #dropdown-header>
    <mu-search-input
      v-model="searchKey"
      input-style="solid"
      class="mb-half"
      style="width: 100%;" />
  </template>
</mu-select>
```

::: info
点击清除按钮会把值置为空字符串 `''`。
:::

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `debounce-delay` | Number | `500` | 值变更后触发 `update:modelValue` 的防抖延迟（毫秒） |
| `prefix` | String\|Object | `':icon=search'` | 默认渲染搜索图标（覆盖 MuInput 默认值） |
| `clearable` | Boolean | `true` | 默认显示清除按钮 |
| (其他) | — | — | 继承全部 `MuInput` 属性与事件 |
