<script setup>
  import { ref } from 'vue'

  const activeNode = ref()
  const checkedNodesKeys = ref(new Set())
  const treeRef = ref()

  const treeData = [
    {
      id: 1,
      label: 'src',
      icon: 'folderOpen',
      childNodes: [
        { id: 11, label: 'components', icon: 'folder', childNodes: [
          { id: 111, label: 'button', icon: 'file' },
          { id: 112, label: 'table', icon: 'file' },
          { id: 113, label: 'tree', icon: 'file' }
        ]},
        { id: 12, label: 'styles', icon: 'folder', childNodes: [
          { id: 121, label: 'root.scss', icon: 'file' }
        ]},
        { id: 13, label: 'index.js', icon: 'file' }
      ]
    },
    { id: 2, label: 'demo', icon: 'folder', childNodes: [
      { id: 21, label: 'main.js', icon: 'file' }
    ]},
    { id: 3, label: 'package.json', icon: 'file' }
  ]

  function expandAll () {
    treeRef.value?.expandAll()
  }

  function collapseAll () {
    treeRef.value?.collapseAll()
  }
</script>

# 树 MuTree

树形控件，用于展示层级数据（目录、组织架构、分类等）。支持节点图标、勾选、选中、节点工具按钮、自定义节点内容、展开控制与懒加载。

## 基础用法

节点数据通过 `props` 映射字段，默认 `{ key: 'id', icon: 'icon', label: 'label', title: 'title', disabled: 'disabled', childNodes: 'childNodes' }`：

<client-only>
  <div class="mu-demo" style="align-items: stretch;">
    <mu-tree
      style="width: 100%; height: 260px;"
      :data="treeData"
      :active-node="activeNode"
      :auto-expand-level="2"
      @node-click="node => activeNode = node" />
  </div>
</client-only>

```html
<mu-tree :data="data" :active-node="activeNode" @node-click="onNodeClick" />
```

```javascript
const data = [
  {
    id: 1,
    label: 'src',
    icon: 'folderOpen',
    childNodes: [
      { id: 11, label: 'components', icon: 'folder', childNodes: [...] },
      { id: 12, label: 'index.js', icon: 'file' }
    ]
  }
]
```

字段名不同的情况用 `props` 显式映射（设为空字符串表示不映射）：

```javascript
const data = [{ id: 1, name: '节点', children: [...] }]

<mu-tree :data="data" :props="{ label: 'name', childNodes: 'children' }" />
```

## 勾选 `checkbox`

`checkbox` 显示勾选框。勾选状态两种管理方式：节点数据内的 `checked` 字段（需在 `props` 中映射），或 `checked-nodes-keys`（Set 集合，按 key 管理）：

<client-only>
  <div class="mu-demo" style="align-items: stretch;">
    <mu-tree
      style="width: 100%; height: 260px;"
      :data="treeData"
      checkbox
      :auto-expand-level="2"
      :checked-nodes-keys="checkedNodesKeys"
      @node-check-change="(node, checked) => checked ? checkedNodesKeys.add(node.id) : checkedNodesKeys.delete(node.id)" />
  </div>
</client-only>

```html
<mu-tree
  :data="data"
  checkbox
  :checked-nodes-keys="checkedNodesKeys"
  @node-check-change="onCheckChange" />
```

```javascript
const checkedNodesKeys = ref(new Set())

function onCheckChange (node, checked) {
  checked
    ? checkedNodesKeys.value.add(node.id)
    : checkedNodesKeys.value.delete(node.id)
}
```

::: warning
`cascaded-check` prop 已声明但**当前版本未实现**，父子勾选不级联，勾选为独立行为。
:::

## 自定义节点内容与工具按钮

`#default` 插槽作用域参数为 `node`；`#buttons` 插槽自定义节点 hover 出现的工具按钮，也可用 `buttons` 属性数据驱动：

<client-only>
  <div class="mu-demo" style="align-items: stretch;">
    <mu-tree
      style="width: 100%; height: 260px;"
      :data="treeData"
      :auto-expand-level="2"
      :buttons="[{ icon: 'delete', title: '删除', danger: true, hover: true }]"
      @node-click="node => activeNode = node"
      @node-button-click="(node, btn) => console.log(node.label, btn.title)">
      <template #default="{ node }">
        <label class="mu-tree-node__label">{{ node.label }}</label>
      </template>
    </mu-tree>
  </div>
</client-only>

```html
<mu-tree :data="data" :buttons="buttons" @node-button-click="onNodeButtonClick">
  <template #default="{ node }">
    <label class="mu-tree-node__label">{{ node.label }}</label>
  </template>
</mu-tree>
```

```javascript
const buttons = [
  { icon: 'delete', title: '删除', danger: true, hover: true },
  { icon: 'chevronRight' }
]
```

## 展开控制与方法

`auto-expand-level` 自动展开层级；通过 ref 调用展开/收拢方法：

<client-only>
  <div class="mu-demo">
    <mu-button size="small" caption="全部展开" @click="expandAll" />
    <mu-button size="small" caption="全部收拢" @click="collapseAll" />
    <mu-tree
      ref="treeRef"
      style="width: 100%; height: 260px;"
      :data="treeData"
      :active-node="activeNode" />
  </div>
</client-only>

```javascript
treeRef.value.expand(node)          // 展开指定节点
treeRef.value.collapse(node)        // 收拢指定节点
treeRef.value.expandTo(target)      // 展开到目标节点的路径（节点对象或 key）
treeRef.value.expandAll({ level })  // 全部展开到指定层级
treeRef.value.collapseAll()         // 全部收拢
```

## 懒加载

配合 `node-expand` 事件：首次展开时按需加载子节点（`isLeaf` 标记叶子）：

```javascript
const data = [
  { id: 1, label: '根节点', isLeaf: false }
]

<mu-tree
  :data="data"
  :props="{ childNodes: 'children', isLeaf: 'isLeaf' }"
  @node-expand="loadChildren" />

function loadChildren (node) {
  if (!node.children && !node.isLeaf) {
    fetchChildren(node.id).then(children => {
      node.children = children
    })
  }
}
```

## 图标定制 `node-icons` / `expand-icons`

默认节点图标集 `{ leaf: 'file', folder: 'folder', folderOpen: 'folderOpen' }`，展开图标默认 `{ expanded: 'treeNodeExpand', collapsed: 'treeNodeExpand' }`。传 `false` 隐藏对应图标，传对象自定义：

```html
<!-- 自定义节点图标 -->
<mu-tree :data="data" :node-icons="{ folder: 'lock', folderOpen: 'lockOpen', leaf: 'calendar' }" />

<!-- 隐藏节点图标 -->
<mu-tree :data="data" :node-icons="false" />

<!-- 列表形态（隐藏展开图标） -->
<mu-tree :data="data" :expand-icons="false" />
```

> 图标集也可全局经 `$mussel.options.tree.nodeIcons` / `tree.expandIcons` 定制。

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `data` | Array | — | 树节点数据 |
| `props` | Object | — | 节点数据字段映射，默认 `{ key: 'id', icon: 'icon', label: 'label', title: 'title', disabled: 'disabled', childNodes: 'childNodes' }`（`isLeaf`/`checked` 默认不映射，可显式指定字段名） |
| `buttons` | Array | — | 节点工具按钮 |
| `checkbox` | Boolean | — | 是否显示勾选框 |
| `checked-nodes-keys` | Set | — | 已勾选节点 key 集合 |
| `auto-expand-level` | Number | — | 自动展开层级数 |
| `active-node` | Object\|Number\|String | — | 当前选中节点 |
| `node-icons` | Boolean\|Object | `true` | 是否显示节点图标及自定义图标集 |
| `expand-icons` | Boolean\|Object | `true` | 是否显示展开图标及自定义 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-click` | `node` | 节点点击（不含展开按钮） |
| `node-expand` / `node-collapse` | `node` | 展开/收拢（可用于懒加载）|
| `node-button-click` | `node, button` | 节点工具按钮点击 |
| `node-check-change` | `node, checked` | 勾选状态变更 |

| 插槽 | 说明 |
|------|------|
| `default` | 节点内容模板，作用域参数为 `node` |
| `buttons` | 节点工具按钮模板，作用域参数为 `node` |

**方法（通过 ref 调用）：**

| 方法 | 说明 |
|------|------|
| `expand(...nodes)` | 展开指定节点（传节点对象） |
| `collapse(...nodes)` | 收拢指定节点 |
| `expandTo(target)` | 展开到目标节点的路径（target 为节点对象或 key） |
| `expandAll({ level })` | 全部展开到指定层级（缺省用 `auto-expand-level` 或全展） |
| `collapseAll()` | 全部收拢 |

> 内部节点渲染组件 `MuTreeNode` 虽有导出，但强依赖 MuTree 上下文（脱离使用会报错），请勿单独使用；自定义节点一律通过 MuTree 的插槽实现。
