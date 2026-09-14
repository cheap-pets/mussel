<script setup>
  import { ref } from 'vue'

  const activeItem = ref(1)
</script>

# 按钮组 MuButtonGroup

将多个 `MuButton` 包装为视觉整体，常用于成组的互斥选择（视图切换、分段筛选）或工具按钮集合。组上设置的 `size`、`button-style`、`color`、`pill`、`disabled` 会覆盖内部所有按钮的对应属性。

## 基础用法

配合 `active` + `@click` 实现互斥选中：

<div class="mu-demo">
  <mu-button-group>
    <mu-button :active="activeItem === 1" @click="activeItem = 1">One</mu-button>
    <mu-button :active="activeItem === 2" @click="activeItem = 2">Two</mu-button>
    <mu-button :active="activeItem === 3" @click="activeItem = 3">Three</mu-button>
  </mu-button-group>
</div>

```html
<mu-button-group>
  <mu-button :active="activeItem === 1" @click="activeItem = 1">One</mu-button>
  <mu-button :active="activeItem === 2" @click="activeItem = 2">Two</mu-button>
  <mu-button :active="activeItem === 3" @click="activeItem = 3">Three</mu-button>
</mu-button-group>
```

## 组属性覆盖

组属性作用于组内全部按钮；组内按钮显式设置的属性优先生效（如下例中第二个按钮 `size="large"`）。

<div class="mu-demo">
  <mu-button-group color="primary" button-style="outline">
    <mu-button :active="activeItem === 1" @click="activeItem = 1">One</mu-button>
    <mu-button :active="activeItem === 2" @click="activeItem = 2">Two</mu-button>
    <mu-button :active="activeItem === 3" @click="activeItem = 3">Three</mu-button>
  </mu-button-group>
  <mu-button-group color="danger" pill button-style="outline" size="small">
    <mu-button icon="copy" caption="复制" />
    <mu-button icon="cut" caption="剪切" />
  </mu-button-group>
  <mu-button-group disabled>
    <mu-button caption="One" />
    <mu-button caption="Two" />
  </mu-button-group>
</div>

```html
<!-- 整组主色 + 描边 -->
<mu-button-group color="primary" button-style="outline">...</mu-button-group>

<!-- 危险色 + 圆弧 + 小尺寸 -->
<mu-button-group color="danger" pill button-style="outline" size="small">
  <mu-button icon="copy" caption="复制" />
  <mu-button icon="cut" caption="剪切" />
</mu-button-group>

<!-- 整组禁用 -->
<mu-button-group disabled>...</mu-button-group>
```

::: info
组内按钮位于 `mu-button-group` 内时，完全不消费 `MuToolbar` 注入的 `tool-size` / `default-button-style`，由 button-group 自身的 props 接管。
:::

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | String | 覆盖内部所有按钮的尺寸：`small` \| `normal` \| `large` |
| `button-style` | String | `normal` \| `outline` |
| `color` | String | 整组按钮颜色：`normal` \| `primary` \| `secondary` \| `danger` |
| `primary` / `danger` / `secondary` | Boolean | 设置整组按钮颜色（已废弃，用 `color`） |
| `pill` | Boolean | 圆弧形态 |
| `disabled` | Boolean | 禁用整组 |
