# Mussel 3 → 4 升级评估用例

每个用例包含 **输入**（Mussel 3 代码）和 **预期输出**（Mussel 4 代码）。
评估时将输入提供给 skill，对比输出与预期是否一致。

评分维度：
- **正确性**：所有迁移点是否都被正确转换
- **完整性**：是否遗漏了任何迁移点
- **纯净性**：是否只改了 mussel 相关内容，未改变业务逻辑

---

## 用例 1：Dialog 基础迁移

**测试重点**：Dialog 属性/事件/插槽变更 + body 内边距

### 输入

```vue
<template>
  <mu-dialog
    :visible.sync="dialogVisible"
    title="编辑用户"
    mask-action="hide"
    :moveable="true"
    dialog-style="width: 600px"
    container="body"
    @close-button-click="onClose"
    @mask-click="onMaskClick"
  >
    <template #header-prepend>
      <span>自定义标题</span>
    </template>
    <mu-form label-width="80px">
      <mu-form-field label="姓名">
        <mu-editor v-model="form.name" :clear-button="true" solid />
      </mu-form-field>
    </mu-form>
    <template #footer-append>
      <mu-button primary @click="onSave">保存</mu-button>
      <mu-button @click="onClose">取消</mu-button>
    </template>
  </mu-dialog>
</template>
```

### 预期输出

```vue
<template>
  <mu-dialog
    v-model:visible="dialogVisible"
    title="编辑用户"
    dismissible
    body-style="padding: 16px 24px"
    style="width: 600px"
  >
    <template #header>
      <span>自定义标题</span>
    </template>
    <mu-form label-width="80px">
      <mu-form-field label="姓名">
        <mu-input v-model="form.name" clearable input-style="solid" />
      </mu-form-field>
    </mu-form>
    <template #footer>
      <mu-button color="primary" @click="onSave">保存</mu-button>
      <mu-button @click="onClose">取消</mu-button>
    </template>
  </mu-dialog>
</template>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `:visible.sync` → `v-model:visible` |
| 2 | `mask-action="hide"` → `dismissible` |
| 3 | `:moveable` 已移除（删除） |
| 4 | `dialog-style` → `style`（$attrs fallthrough） |
| 5 | `container` 已移除（删除） |
| 6 | `@close-button-click` 已移除（删除） |
| 7 | `@mask-click` 已移除（删除） |
| 8 | `#header-prepend` → `#header` |
| 9 | `#footer-append` → `#footer` |
| 10 | body 内边距：添加 `body-style="padding: 16px 24px"` |
| 11 | `<mu-editor>` → `<mu-input>` |
| 12 | `:clear-button="true"` → `clearable` |
| 13 | `solid` → `input-style="solid"` |
| 14 | `primary` → `color="primary"` |

---

## 用例 2：Box 布局系统迁移

**测试重点**：mu-box/mu-h-box/mu-v-box 组件和属性选择器 → 原子类

### 输入

```vue
<template>
  <mu-v-box position="fixed fit" padding="1x">
    <mu-toolbar>
      <span>标题</span>
      <div class="mu-space" />
      <mu-button primary>操作</mu-button>
    </mu-toolbar>
    <mu-h-box flex="1" gap="2x" padding="2x">
      <div class="mu-box mu-v-box" flex="0" width="240" border-right>
        <div class="mu-box mu-v-box" padding="2x">
          <mu-combo-box
            v-model="selected"
            :clear-button="true"
            class="mu-box"
            width="100%"
            dropdown-align="bottom"
          />
        </div>
      </div>
      <div class="mu-box mu-v-box" flex="1" overflow="auto">
        <div class="mu-box" padding="2x">
          内容区域
        </div>
      </div>
    </mu-h-box>
  </mu-v-box>
</template>
```

### 预期输出

```vue
<template>
  <div class="flex flex-col fixed p-1x" style="inset: 0;">
    <mu-toolbar>
      <span>标题</span>
      <div class="flex-space" />
      <mu-button color="primary">操作</mu-button>
    </mu-toolbar>
    <div class="flex flex-1 gap-2x p-2x">
      <div class="flex flex-col flex-none border-r" style="width: 240px">
        <div class="flex flex-col p-2x">
          <mu-combo-box
            v-model="selected"
            clearable
            style="width: 100%"
            dropdown-position="bottom"
          />
        </div>
      </div>
      <div class="flex flex-col flex-1 overflow-auto">
        <div class="p-2x">
          内容区域
        </div>
      </div>
    </div>
  </div>
</template>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `<mu-v-box>` → `<div class="flex flex-col ...">` |
| 2 | `position="fixed fit"` → `class="fixed"` + `style="inset: 0"` |
| 3 | `padding="1x"` → `class="p-1x"` |
| 4 | `<mu-h-box>` → `<div class="flex ...">` |
| 5 | `flex="1"` → `class="flex-1"` |
| 6 | `gap="2x"` → `class="gap-2x"` |
| 7 | `class="mu-space"` → `class="flex-space"` |
| 8 | `flex="0"` → `class="flex-none"` |
| 9 | `width="240"` → `style="width: 240px"` |
| 10 | `border-right` → `class="border-r"` |
| 11 | `class="mu-box"` 移除 |
| 12 | `overflow="auto"` → `class="overflow-auto"` |
| 13 | `:clear-button="true"` → `clearable` |
| 14 | `class="mu-box"` 移除（ComboBox 上） |
| 15 | `width="100%"` → `style="width: 100%"` |
| 16 | `dropdown-align` → `dropdown-position` |
| 17 | `primary` → `color="primary"` |

---

## 用例 3：Dialog CSS 选择器迁移

**测试重点**：`> .mu-dialog` 子选择器去除 + 内部 class 重命名

### 输入

```scss
.user-edit-dialog {
  & > .mu-dialog {
    width: 800px;
    height: 90%;

    & > .mu-dialog-body {
      overflow: auto;
      display: flex;
      flex-direction: column;
    }

    & .mu-dialog_header, .mu-dialog_footer {
      padding: 16px;
    }
  }
}
```

### 预期输出

```scss
.user-edit-dialog {
  width: 800px;
  height: 90%;

  .mu-dialog__body {
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .mu-dialog__header, .mu-dialog__footer {
    padding: 16px;
  }
}
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | 去除 `& > .mu-dialog` 嵌套层（$attrs 现在绑在 dialog 层） |
| 2 | `mu-dialog-body` → `mu-dialog__body` |
| 3 | `mu-dialog_header` → `mu-dialog__header` |
| 4 | `mu-dialog_footer` → `mu-dialog__footer` |

---

## 用例 4：Dialog 带包裹 div + JS DOM 操作

**测试重点**：body-class/body-style 消除包裹 div + $el → dialogEl/maskEl

### 输入

```vue
<template>
  <mu-dialog ref="detailDialog" :visible.sync="visible" title="详情">
    <div class="mu-box mu-v-box" padding="2x" overflow="auto" style="min-height: 400px;">
      <div ref="contentPanel" class="content-panel">
        <p>内容加载中...</p>
      </div>
    </div>
  </mu-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const detailDialog = ref(null)
const contentPanel = ref(null)

onMounted(() => {
  const maskEl = detailDialog.value.$el
  const dialogEl = detailDialog.value.$el.querySelector('.mu-dialog')
  maskEl.addEventListener('click', handleMaskClick)
  dialogEl.focus()
})
</script>
```

### 预期输出

```vue
<template>
  <mu-dialog
    ref="detailDialog"
    v-model:visible="visible"
    title="详情"
    body-class="flex flex-col p-2x overflow-auto"
    body-style="min-height: 400px"
  >
    <div ref="contentPanel" class="content-panel">
      <p>内容加载中...</p>
    </div>
  </mu-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const detailDialog = ref(null)
const contentPanel = ref(null)

onMounted(() => {
  const maskEl = detailDialog.value.maskEl
  const dialogEl = detailDialog.value.dialogEl
  maskEl.addEventListener('click', handleMaskClick)
  dialogEl.focus()
})
</script>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | 包裹 div 的布局属性合并到 `body-class`（`flex flex-col p-2x overflow-auto`） |
| 2 | 包裹 div 的内联样式合并到 `body-style` |
| 3 | 包裹 div 消除，子元素直接在 slot 内 |
| 4 | `$el` → `maskEl` |
| 5 | `$el.querySelector('.mu-dialog')` → `dialogEl` |

---

## 用例 5：Tabs + 下拉菜单迁移

**测试重点**：Tabs 事件/属性重命名 + DropdownButton + DropdownItem

### 输入

```vue
<template>
  <mu-tabs
    v-model="activeTab"
    :tab-bar-params="{ compact: true }"
    @tab-click="onTabClick"
    @tab-change="onTabChange"
  >
    <template #tab-bar>
      <mu-tab-bar :tab-items="tabs" />
    </template>
    <mu-tab-panel name="list">
      <mu-dropdown>
        <mu-dropdown-button trigger-action="click" dropdown-icon="dropdown">
          操作
        </mu-dropdown-button>
        <template #dropdown>
          <mu-dropdown-item caption="编辑" />
          <mu-dropdown-item caption="删除" />
        </template>
      </mu-dropdown>
    </mu-tab-panel>
  </mu-tabs>
</template>
```

### 预期输出

```vue
<template>
  <mu-tabs
    v-model="activeTab"
    :tab-bar-attrs="{ compact: true }"
    @button-click="onTabClick"
    @update:active-tab="onTabChange"
  >
    <mu-tab-bar :tab-buttons="tabs" />
    <mu-tab-panel name="list">
      <mu-dropdown :dropdown-items="[
        { caption: '编辑', action: 'edit' },
        { caption: '删除', action: 'delete' }
      ]">
        <mu-dropdown-button dropdown-trigger="click" dropdown-icon="dropdownExpand">
          操作
        </mu-dropdown-button>
      </mu-dropdown>
    </mu-tab-panel>
  </mu-tabs>
</template>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `:tab-bar-params` → `:tab-bar-attrs` |
| 2 | `@tab-click` → `@button-click` |
| 3 | `@tab-change` → `@update:active-tab` |
| 4 | `<template #tab-bar>` 整体替换已移除 → 直接放 `<mu-tab-bar>` |
| 5 | `:tab-items` → `:tab-buttons` |
| 6 | `trigger-action="click"` → `dropdown-trigger="click"` |
| 7 | `dropdown-icon="dropdown"` → `dropdown-icon="dropdownExpand"` |
| 8 | `<mu-dropdown-item>` → `dropdown-items` 数组属性 |

---

## 用例 6：CSS 变量 + CSS 类混合迁移

**测试重点**：SCSS 中的变量和类名替换

### 输入

```scss
.user-panel {
  background: var(--mu-background-normal);
  color: var(--mu-text-color-weak);
  border: 1px solid var(--mu-border-color);

  & .title {
    color: var(--mu-gray-dark);
  }

  & .status {
    background: var(--mu-primary-color-shadow);
    color: var(--mu-text-color-reversed);
  }

  & .divider {
    border-color: var(--mu-divider-color);
  }

  & .description {
    color: var(--mu-text-color-placeholder);
  }

  & .label {
    background: var(--mu-background-hover);
  }
}
```

### 预期输出

```scss
.user-panel {
  background: var(--mu-bg-normal);
  color: var(--mu-text-color-muted);
  border: 1px solid var(--mu-border-color-normal);

  & .title {
    color: var(--mu-text-color-normal);
  }

  & .status {
    background: var(--mu-primary-translucent);
    color: #fff;
  }

  & .divider {
    border-color: var(--mu-border-color-soft);
  }

  & .description {
    color: var(--mu-text-color-muted);
  }

  & .label {
    background: var(--mu-gray-translucent);
  }
}
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `--mu-background-normal` → `--mu-bg-normal` |
| 2 | `--mu-text-color-weak` → `--mu-text-color-muted` |
| 3 | `--mu-border-color` → `--mu-border-color-normal` |
| 4 | `--mu-gray-dark` → `--mu-text-color-normal` |
| 5 | `--mu-primary-color-shadow` → `--mu-primary-translucent` |
| 6 | `--mu-text-color-reversed` → `#fff` |
| 7 | `--mu-divider-color` → `--mu-border-color-soft` |
| 8 | `--mu-text-color-placeholder` 已移除 → `--mu-text-color-muted`（占位符属于弱化文本） |
| 9 | `--mu-background-hover` → `--mu-gray-translucent` |

---

## 用例 7：ComboBox 多选拆分 + MuEditor 图标

**测试重点**：`mu-combo-box multiple` → `mu-multi-select` + editor 插槽 → 属性

### 输入

```vue
<template>
  <div class="mu-box mu-bg-normal" layout="flex" gap="2x" padding="2x" width="100%">
    <mu-editor v-model="keyword" solid width="100%">
      <template #prefix>
        <mu-icon icon="search" />
      </template>
    </mu-editor>

    <mu-combo-box
      v-model="selectedItems"
      :multiple="true"
      :clear-button="true"
      width="100%"
    >
      <template #left>
        <span>标签：</span>
      </template>
    </mu-combo-box>
  </div>
</template>
```

### 预期输出

```vue
<template>
  <div class="bg-normal flex gap-2x p-2x" style="width: 100%">
    <mu-input v-model="keyword" input-style="solid" style="width: 100%" prefix=":icon=search" />

    <mu-multi-select
      v-model="selectedItems"
      clearable
      style="width: 100%"
      prefix="标签："
    />
  </div>
</template>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `mu-box mu-bg-normal` + `layout="flex"` + `gap` + `padding` + `width` → 原子类 + style |
| 2 | `<mu-editor>` → `<mu-input>` |
| 3 | `solid` → `input-style="solid"` |
| 4 | `<template #prefix>` 插槽 → `prefix=":icon=search"` 属性 |
| 5 | `<mu-combo-box :multiple="true">` → `<mu-multi-select>` |
| 6 | `:clear-button="true"` → `clearable` |
| 7 | `<template #left>` → `prefix` 属性 |

---

## 用例 8：Tree 迁移

**测试重点**：TreeView/TreeNode/TreeNodes → 数据驱动 Tree

### 输入

```vue
<template>
  <mu-tree-view>
    <mu-tree-node
      v-for="item in treeData"
      :key="item.id"
      :label="item.name"
      :icon="item.icon"
      :expanded="item.expanded"
    >
      <mu-tree-nodes v-if="item.children">
        <mu-tree-node
          v-for="child in item.children"
          :key="child.id"
          :label="child.name"
        />
      </mu-tree-nodes>
    </mu-tree-node>
  </mu-tree-view>
</template>
```

### 预期输出

```vue
<template>
  <mu-tree
    :data="treeData"
    :props="{ label: 'name', children: 'children' }"
  />
</template>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `<mu-tree-view>` + `<mu-tree-nodes>` 已移除 → `<mu-tree>` |
| 2 | 手动 `v-for` 遍历 → 数据驱动 `:data` + `:props` |

---

## 用例 9：完整页面混合迁移

**测试重点**：多种迁移类型在同一文件中交叉

### 输入

```vue
<template>
  <mu-v-box position="fixed fit">
    <mu-toolbar>
      <mu-tool-button icon="menu" />
      <span>管理系统</span>
      <div class="mu-space" />
      <mu-dropdown>
        <mu-button primary>
          <mu-icon icon="dropdown" />
          新建
        </mu-button>
        <template #dropdown>
          <mu-dropdown-item caption="新建项目" />
          <mu-dropdown-item caption="新建任务" />
        </template>
      </mu-dropdown>
    </mu-toolbar>

    <mu-h-box flex="1">
      <div class="mu-box mu-v-box" width="200" border-right>
        <mu-tabs
          v-model="sideTab"
          :tab-bar-params="{ compact: true }"
          @tab-click="onSideTabClick"
        >
          <mu-tab-panel name="tree">
            <mu-tree-view>
              <mu-tree-node label="根节点">
                <mu-tree-nodes>
                  <mu-tree-node label="子节点1" />
                  <mu-tree-node label="子节点2" />
                </mu-tree-nodes>
              </mu-tree-node>
            </mu-tree-view>
          </mu-tab-panel>
        </mu-tabs>
      </div>

      <div class="mu-box mu-v-box" flex="1">
        <mu-toolbar>
          <mu-editor v-model="search" :clear-button="true" solid width="200">
            <template #prefix>
              <mu-icon icon="search" />
            </template>
          </mu-editor>
        </mu-toolbar>

        <div class="mu-box" flex="1" overflow="auto" padding="2x">
          <div class="mu-text-ellipsis mu-text-color-weak" style="margin-bottom: 8px;">
            搜索结果
          </div>
          <mu-table :data="tableData">
            <!-- columns -->
          </mu-table>
        </div>
      </div>
    </mu-h-box>
  </mu-v-box>
</template>
```

### 预期输出

```vue
<template>
  <div class="flex flex-col fixed" style="inset: 0;">
    <mu-toolbar>
      <mu-tool-button icon="menu" />
      <span>管理系统</span>
      <div class="flex-space" />
      <mu-dropdown :dropdown-items="[
        { caption: '新建项目', action: 'new-project' },
        { caption: '新建任务', action: 'new-task' }
      ]">
        <mu-button color="primary">
          <mu-icon icon="chevronDown" />
          新建
        </mu-button>
      </mu-dropdown>
    </mu-toolbar>

    <div class="flex flex-1">
      <div class="flex flex-col border-r" style="width: 200px">
        <mu-tabs
          v-model="sideTab"
          :tab-bar-attrs="{ compact: true }"
          @button-click="onSideTabClick"
        >
          <mu-tab-panel name="tree">
            <mu-tree :data="treeData" :props="{ label: 'name', children: 'children' }" />
          </mu-tab-panel>
        </mu-tabs>
      </div>

      <div class="flex flex-col flex-1">
        <mu-toolbar>
          <mu-input
            v-model="search"
            clearable
            input-style="solid"
            style="width: 200px"
            prefix=":icon=search"
          />
        </mu-toolbar>

        <div class="flex-1 overflow-auto p-2x">
          <div class="text-ellipsis text-muted" style="margin-bottom: 8px;">
            搜索结果
          </div>
          <mu-table :data="tableData">
            <!-- columns -->
          </mu-table>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `<mu-v-box position="fixed fit">` → `<div class="flex flex-col fixed" style="inset: 0">` |
| 2 | `class="mu-space"` → `class="flex-space"` |
| 3 | `<mu-dropdown-item>` → `dropdown-items` 数组 |
| 4 | `icon="dropdown"` → `icon="chevronDown"` |
| 5 | `primary` → `color="primary"` |
| 6 | `<mu-h-box flex="1">` → `<div class="flex flex-1">` |
| 7 | `mu-box mu-v-box` + `width` + `border-right` → 原子类 |
| 8 | `:tab-bar-params` → `:tab-bar-attrs` |
| 9 | `@tab-click` → `@button-click` |
| 10 | `<mu-tree-view>` + `<mu-tree-node>` + `<mu-tree-nodes>` → `<mu-tree>` 数据驱动 |
| 11 | `<mu-editor>` → `<mu-input>` |
| 12 | `#prefix` 插槽 → `prefix` 属性 |
| 13 | `mu-text-ellipsis` → `text-ellipsis` |
| 14 | `mu-text-color-weak` → `text-muted` |
| 15 | `flex="1"` → `class="flex-1"` |
| 16 | `overflow="auto"` → `class="overflow-auto"` |
| 17 | `padding="2x"` → `class="p-2x"` |

---

## 用例 10：全局配置迁移

**测试重点**：插件注册 theme 配置变更

### 输入

```js
import { createApp } from 'vue'
import Mussel from 'mussel'
import App from './App.vue'

const app = createApp(App)

app.use(Mussel, {
  icons: { /* ... */ },
  theme: {
    primaryColor: '#008CD6',
    primaryColorDark: '#006db0',
    primaryColorLight: '#24a7e3',
    dangerColor: '#f57a79',
    successColor: '#00b25a',
    warningColor: '#f4af61'
  }
})

app.mount('#app')
```

### 预期输出

```js
import { createApp } from 'vue'
import Mussel from 'mussel'
import App from './App.vue'

const app = createApp(App)

app.use(Mussel, {
  icons: { /* ... */ },
  theme: {
    primary: '#008CD6',
    primaryColorDark: '#006db0',
    primaryColorLight: '#24a7e3',
    danger: '#f57a79',
    success: '#00b25a',
    warning: '#f4af61'
  }
})

app.mount('#app')
```

### 迁移点清单

| # | 变更 |
|---|------|
| 1 | `primaryColor` → `primary` |
| 2 | `dangerColor` → `danger` |
| 3 | `successColor` → `success` |
| 4 | `warningColor` → `warning` |
