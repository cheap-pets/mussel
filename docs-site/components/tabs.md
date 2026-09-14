<script setup>
  import { ref } from 'vue'

  const activeTab = ref('Tab_1')
</script>

# 页签 MuTabs / MuTabPanel

多页签容器。`MuTabPanel` 为单个页签内容容器，**必须置于 MuTabs 中**；页签按钮由内部 `MuTabPanel` 自动生成。

未设置 `active-tab` 时组件挂载后自动选中第一个页签。页签按钮溢出时自动显示位移按钮（轻点位移一步，按住连续滚动）与列表下拉按钮；活动页签变化时自动滚动到可视区。

## 基础用法

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-tabs v-model:active-tab="activeTab" style="height: 160px;">
    <mu-tab-panel name="list" caption="列表" icon="list">
      列表内容（Tab 1）
    </mu-tab-panel>
    <mu-tab-panel name="detail" caption="详情">
      详情内容（Tab 2）
    </mu-tab-panel>
    <mu-tab-panel name="settings" caption="设置" disabled>
      禁用页签（Tab 3）
    </mu-tab-panel>
  </mu-tabs>
</div>

```html
<mu-tabs v-model:active-tab="activeTab">
  <mu-tab-panel name="list" caption="列表" icon="list">
    <!-- 列表内容 -->
  </mu-tab-panel>
  <mu-tab-panel name="detail" caption="详情" :disabled="!selectedId">
    <!-- 详情内容 -->
  </mu-tab-panel>
</mu-tabs>
```

## 页签风格 `tab-style`

`button`（默认）/ `small-button` / `simple` / `lined-simple` / `card`：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-tabs active-tab="Tab_1" tab-style="small-button">
    <mu-tab-panel name="Tab_1" caption="small-button" />
    <mu-tab-panel name="Tab_2" caption="Tab 2" />
  </mu-tabs>
  <mu-tabs active-tab="Tab_1" tab-style="simple">
    <mu-tab-panel name="Tab_1" caption="simple" />
    <mu-tab-panel name="Tab_2" caption="Tab 2" />
  </mu-tabs>
  <mu-tabs active-tab="Tab_1" tab-style="lined-simple">
    <mu-tab-panel name="Tab_1" caption="lined-simple" />
    <mu-tab-panel name="Tab_2" caption="Tab 2" />
  </mu-tabs>
  <mu-tabs active-tab="Tab_1" tab-style="card">
    <mu-tab-panel name="Tab_1" caption="card" />
    <mu-tab-panel name="Tab_2" caption="Tab 2" />
  </mu-tabs>
</div>

```html
<mu-tabs v-model:active-tab="active" tab-style="card">...</mu-tabs>
```

## 页签位置 `tab-position`

`top`（默认）/ `bottom` / `left` / `right`：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-tabs active-tab="Tab_1" tab-position="left" style="height: 140px;">
    <mu-tab-panel name="Tab_1" caption="左侧页签">Tab 1 内容</mu-tab-panel>
    <mu-tab-panel name="Tab_2" caption="Tab 2">Tab 2 内容</mu-tab-panel>
  </mu-tabs>
</div>

```html
<mu-tabs v-model:active-tab="active" tab-position="left">...</mu-tabs>
```

## 页签栏前置 / 后置内容

`#tab-bar-prepend` / `#tab-bar-append` 插槽用于在页签按钮栏前后插入内容（常用于放置工具按钮）：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-tabs v-model:active-tab="activeTab" style="height: 160px;">
    <template #tab-bar-prepend>
      <label class="text-subtle">自定义：</label>
      <div class="flex-space" />
    </template>
    <template #tab-bar-append>
      <mu-icon-button icon="refresh" @click="() => {}" />
    </template>
    <mu-tab-panel name="Tab_1" caption="Tab 1">Tab 1 内容</mu-tab-panel>
    <mu-tab-panel name="Tab_2" caption="Tab 2">Tab 2 内容</mu-tab-panel>
  </mu-tabs>
</div>

```html
<mu-tabs v-model:active-tab="activeTab">
  <template #tab-bar-prepend>
    <label>自定义内容</label>
  </template>
  <template #tab-bar-append>
    <mu-icon-button icon="refresh" @click="reload" />
  </template>
  <mu-tab-panel name="list" caption="列表">...</mu-tab-panel>
</mu-tabs>
```

## API

### MuTabs

| 属性 | 类型 | 说明 |
|------|------|------|
| `active-tab` | String | 双向绑定，当前活动页签；未设置时组件挂载后自动选中第一个页签 |
| `tab-style` | String | `button`（默认）\| `small-button` \| `simple` \| `lined-simple` \| `card` |
| `tab-buttons` | Array | 手动指定页签按钮，默认由内部 `MuTabPanel` 自动生成 |
| `tab-position` | String | `top`（默认）\| `bottom` \| `left` \| `right` |

| 插槽 | 说明 |
|------|------|
| `tab-bar-prepend` | 页签按钮栏前置内容 |
| `tab-bar-append` | 页签按钮栏后置内容（常用于放置工具按钮） |

| 事件 | 参数 | 说明 |
|------|------|------|
| `tab-click` | `name` | 页签按钮点击 |

### MuTabPanel

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 页签唯一标识；建议显式设置（省略时无法被 `active-tab` 匹配） |
| `caption` | String | 页签按钮标题 |
| `icon` | String | 页签按钮图标 |
| `title` | String | 页签按钮 tooltip |
| `disabled` | Boolean | 是否禁用 |
| `tab-order` | Number | 手动排序（默认按 DOM 顺序） |
