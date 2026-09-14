<script setup>
  import { ref } from 'vue'

  const checkedArtists = ref([])
</script>

# 下拉按钮 MuDropdownButton

带下拉菜单的按钮，支持分割形式（`split-button`）。自身仅定义 `icon` / `caption` / `splitButton` 三个 prop，其他 MuButton 属性（如 `color`、`button-style`、`size`）通过 `$attrs` 透传；下拉能力（`dropdown-items` / `dropdown-trigger` 等）继承自 [MuDropdown](/components/dropdown)。

默认 **click 触发、显示下箭头**。

## 基础用法

<div class="mu-demo">
  <mu-dropdown-button
    caption="新建"
    color="primary"
    :dropdown-items="[
      { label: '从模板创建', action: 'from-template' },
      { label: '导入文件', action: 'import' }
    ]"
    @action="onAction" />
  <mu-dropdown-button caption="更多操作" :dropdown-items="menuItems" @action="onAction" />
</div>

```html
<mu-dropdown-button
  caption="新建"
  color="primary"
  :dropdown-items="[
    { label: '从模板创建', action: 'from-template' },
    { label: '导入文件',   action: 'import' }
  ]"
  @click="onCreate"
  @action="onDropdownAction" />
```

## 分割按钮 `split-button`

主按钮与箭头分离：点击主按钮区触发 `@click`，点击箭头区展开下拉：

<div class="mu-demo">
  <mu-dropdown-button
    split-button
    caption="Split Button"
    color="primary"
    :dropdown-items="menuItems"
    @click="() => {}"
    @action="onAction" />
</div>

```html
<mu-dropdown-button
  split-button
  caption="Split Button"
  color="primary"
  :dropdown-items="items"
  @click="onMainClick"
  @action="onDropdownAction" />
```

## 透传按钮属性

MuButton 的 `color` / `button-style` / `size` 等直接透传；`class="mu-icon-button"` 可变为纯图标下拉按钮：

<div class="mu-demo">
  <mu-dropdown-button
    class="mu-icon-button"
    button-style="text"
    icon="more"
    :dropdown-items="menuItems" />
  <mu-dropdown-button
    color="danger"
    button-style="outline"
    size="small"
    caption="危险操作"
    :dropdown-items="menuItems" />
</div>

```html
<!-- 纯图标形式 -->
<mu-dropdown-button
  class="mu-icon-button"
  button-style="text"
  icon="more"
  :dropdown-items="items" />

<!-- 透传 color / button-style / size -->
<mu-dropdown-button color="danger" button-style="outline" size="small" caption="危险操作" />
```

## 面板 header / items / footer

`#dropdown-header` / `#dropdown-items` / `#dropdown-footer` 组合出带勾选统计与操作栏的菜单：

<div class="mu-demo">
  <mu-dropdown-button split-button caption="已选菜单" @action="onAction">
    <template #dropdown-header>
      已选 {{ checkedArtists.length }} 项
    </template>
    <template #dropdown-items>
      <mu-dropdown-check-item v-model="checkedArtists" value="beethoven" label="贝多芬" />
      <mu-dropdown-check-item v-model="checkedArtists" value="mozart" label="莫扎特" />
      <mu-dropdown-check-item v-model="checkedArtists" value="chopin" label="肖邦" />
    </template>
    <template #dropdown-footer>
      <mu-button block caption="Clear" @click="checkedArtists = []" />
    </template>
  </mu-dropdown-button>
</div>

```html
<mu-dropdown-button split-button caption="已选菜单">
  <template #dropdown-header>
    已选 {{ checked.length }} 项
  </template>
  <template #dropdown-items>
    <mu-dropdown-check-item v-model="checked" value="a" label="选项 A" />
  </template>
  <template #dropdown-footer>
    <mu-button block caption="Clear" @click="checked = []" />
  </template>
</mu-dropdown-button>
```

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 覆盖按钮内容（缺省渲染 icon + caption） |
| `dropdown-header` / `dropdown-footer` | 下拉面板顶部 / 底部区域，仅 items 模式渲染 |
| `dropdown-items` | 自定义下拉项，渲染于面板内置滚动容器内；**自定义菜单项时优先使用** |
| `dropdown` | 完全自定义下拉面板整体内容；与 `dropdown-items` 同时提供时优先渲染 `dropdown-items` |

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标 |
| `caption` | String | 按钮文字 |
| `split-button` | Boolean | 是否分割按钮形式 |
| (透传) | — | MuButton 属性（`color`、`button-style`、`size` 等）+ MuDropdown 属性 |

| 事件 | 说明 |
|------|------|
| `click` | 主按钮区点击（分割按钮时） |
| `action` | 含 action 的下拉项点击 |
| `dropdown:itemclick` / `dropdown:show` / `dropdown:hide` | 同 MuDropdown |
