<script setup>
  import { ref } from 'vue'

  const selected = ref([{ value: 'beethoven' }])
</script>

# 多选下拉 MuMultiSelect

下拉多选框。modelValue 为选中值数组；已选项以标签形式显示在输入框内，超出 `max-tags` 后合并省略，并可下拉展开全部已选项。

## 基础用法

<div class="mu-demo">
  <mu-multi-select
    v-model="selected"
    :options="artists"
    style="width: 420px;"
    placeholder="multi select" />
</div>

```html
<mu-multi-select v-model="selected" :options="artists" />
```

```javascript
const artists = [
  { value: 'beethoven', label: '贝多芬' },
  { value: 'mozart', label: '莫扎特' },
  { value: 'chopin', label: '肖邦' },
  '-',
  { value: 'strauss', label: '斯特劳斯' }
]
```

## 已选标签 `max-tags` / `tag-shrink` / `tag-tooltip`

- `max-tags`：最大显示已选标签数，超出合并为「+N」省略
- `tag-shrink`：已选标签是否可缩小（默认 `true`）
- `tag-tooltip`：已选标签是否显示 tooltip（默认 `true`，悬停查看完整文字）

<div class="mu-demo">
  <mu-multi-select
    v-model="selected"
    :options="artists"
    :max-tags="2"
    value-mode="composite"
    style="width: 420px;"
    placeholder="max-tags=2" />
</div>

```html
<mu-multi-select v-model="selected" :options="artists" :max-tags="2" />
```

## value-mode

与 [MuSelect](/components/select) 一致：默认 `normal` 时 modelValue 为 value 数组；`composite` 时为 `[{ value, label }]` 数组（标签回显不依赖 options）。

```javascript
const selected = ref(['beethoven', 'mozart'])                       // normal
const selected = ref([{ value: 'beethoven', label: '贝多芬' }])      // composite
```

## 插槽

同 `MuSelect`（`dropdown-header` / `dropdown-items` / `dropdown` / `dropdown-footer`）。

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `max-tags` | Number | `2` | 最大显示已选标签数，超出合并省略 |
| `tag-shrink` | Boolean | `true` | 已选标签是否可缩小 |
| `tag-tooltip` | Boolean | `true` | 已选标签是否显示 tooltip |
| `disabled` / `readonly` | Boolean | — | 禁用 / 只读 |
| (其他) | — | — | 继承全部 `MuSelect` 属性 |
