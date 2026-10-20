<template>
  <demo-page path="data/tree-advanced">
    <demo-section
      title="节点按钮"
      note="buttons 声明悬停按钮组（icon/title/danger/success/hover），点击触发 node-button-click"
      :code="buttonsCode"
      vertical>
      <mu-tree
        :data="treeData"
        :active-node="activeNode"
        :buttons="buttons"
        class="demo-tree"
        @node-click="onNodeClick"
        @node-button-click="onNodeButtonClick" />
      <span class="demo-log">最近按钮：{{ lastButton }}</span>
    </demo-section>

    <demo-section
      title="展开控制"
      note="auto-expand-level 自动展开层级；ref 方法 expandAll / collapseAll / expand(...nodes) / expandTo(node)"
      vertical>
      <div class="demo-row">
        <mu-button caption="全部展开" @click="expandTree.expandAll()" />
        <mu-button caption="全部收起" @click="expandTree.collapseAll()" />
        <mu-button caption="展开到选中" @click="expandTree.expandTo(activeNode)" />
        <span class="demo-log">先点选一个深层节点，再点「展开到选中」</span>
      </div>
      <mu-tree
        ref="expandTree"
        :data="treeData"
        :active-node="activeNode"
        class="demo-tree"
        @node-click="onNodeClick" />
    </demo-section>

    <demo-section
      title="节点菜单"
      note="节点内嵌 mu-dropdown（click 触发）引用外部 mu-dropdown-panel 渲染菜单项"
      vertical>
      <mu-dropdown-panel
        ref="dropdownMenu"
        :style="{ minWidth: '150px' }"
        :dropdown-items="contextMenus" />
      <mu-tree
        :data="treeData"
        :active-node="activeNode"
        class="demo-tree"
        @node-click="onNodeClick">
        <template #default="{ node }">
          <label class="mu-tree-node__label">
            {{ node.label }}
          </label>
          <mu-dropdown
            class="mu-tree-node__button"
            dropdown-trigger="click"
            :dropdown-panel="dropdownMenu">
            <mu-icon class="mu-icon-button" icon="dots" />
          </mu-dropdown>
        </template>
      </mu-tree>
      <span class="demo-log">点击节点右侧 dots 图标打开菜单</span>
    </demo-section>

    <demo-section
      title="复选框（checked 字段）"
      note="checkbox 开启复选；props.checked 指定选中字段，勾选触发 node-check-change"
      vertical>
      <mu-tree
        checkbox
        :data="treeData"
        :active-node="activeNode"
        :props="{ checked: 'checked' }"
        class="demo-tree"
        @node-check-change="onUpdateNodeChecked" />
      <span class="demo-log">勾选状态回写到节点 checked 字段</span>
    </demo-section>

    <demo-section
      title="复选框（checked-nodes-keys）"
      note="checked-nodes-keys 传 Set 集合按 key 收集勾选节点；点击「清空」取消全部勾选"
      vertical>
      <div class="demo-row">
        <mu-button caption="清空勾选" @click="clearChecked" />
        <span class="demo-log">已勾选数：{{ checkedNodesKeys.size }}</span>
      </div>
      <mu-tree
        checkbox
        :data="treeData"
        :active-node="activeNode"
        :checked-nodes-keys="checkedNodesKeys"
        class="demo-tree"
        @node-check-change="onUpdateCheckedNodesKeys" />
    </demo-section>

    <demo-section
      title="懒加载"
      note="子节点数据缺失时展开触发 node-expand，按需填充 children 或标记 isLeaf"
      vertical>
      <mu-tree
        checkbox
        :data="lazyData"
        :active-node="activeNode"
        :props="{ childNodes: 'children', isLeaf: 'isLeaf' }"
        class="demo-tree"
        @node-expand="loadChildren" />
      <span class="demo-log">展开无子节点的分支时模拟异步加载（最近加载：{{ lastLoaded }}）</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="懒加载节点勾选、展开后收起再展开不重复加载、禁用节点按钮"
      regression
      vertical>
      <div class="demo-row">
        <span>重复展开同一懒加载节点，控制台不应重复输出加载日志</span>
      </div>
      <div class="demo-row">
        <span>勾选懒加载出的子节点，勾选数应正确累计：{{ checkedNodesKeys.size }}</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const buttonsCode = `<mu-tree :data="data" :buttons="buttons" @node-button-click="..." />

const buttons = [
  { icon: 'x', title: '删除', danger: true, hover: true },
  { icon: 'ok', title: '确认', success: true, hover: true }
]`

  const activeNode = ref()
  const expandTree = ref()
  const dropdownMenu = ref()
  const lastButton = ref('无')
  const lastLoaded = ref('无')

  let count = 0

  // 确定性生成树：固定容量与层级，保证 demo 可重复断言
  function createNode (level, maxLevel) {
    const node = {
      id: count,
      label: `Node ${count}`,
      disabled: count % 7 === 0
    }

    count++

    const childrenCount = level < maxLevel ? node.id % 4 : 0

    if (childrenCount > 0) {
      node.childNodes = []

      for (let i = 0; i < childrenCount; i++) {
        node.childNodes.push(createNode(level + 1, maxLevel))
      }
    }

    return node
  }

  const treeData = ref([])

  for (let i = 0; i < 8; i++) treeData.value.push(createNode(0, 3))

  // 懒加载树：一层目录均无 children，展开时填充
  const lazyData = ref([
    { id: 'l0', label: '异步目录 A', children: [] },
    { id: 'l1', label: '异步目录 B', children: [] },
    { id: 'l2', label: '叶子节点', isLeaf: true }
  ])

  const buttons = [
    { icon: 'x', title: 'button 1', color: 'danger', hover: true },
    { icon: 'ok', title: 'button 2', color: 'secondary', hover: true },
    { icon: 'chevronRight' }
  ]

  const contextMenus = [
    { is: '-', label: 'File' },
    { label: 'Copy' },
    { label: 'Move' },
    { label: 'Remove' },
    { is: '-', label: 'Follow' },
    { label: 'WeChat' },
    { label: 'FaceBook' }
  ]

  const checkedNodesKeys = ref(new Set())

  function onNodeClick (node) {
    activeNode.value = node
  }

  function onNodeButtonClick (node, button) {
    lastButton.value = `${node.label} / ${button.title}`
  }

  function onUpdateNodeChecked (node, checked) {
    node.checked = checked
  }

  function onUpdateCheckedNodesKeys (node, checked) {
    if (checked) checkedNodesKeys.value.add(node.id)
    else checkedNodesKeys.value.delete(node.id)

    // Set 原地变更后手动触发响应（size 依赖）
    checkedNodesKeys.value = new Set(checkedNodesKeys.value)
  }

  function clearChecked () {
    checkedNodesKeys.value = new Set()
  }

  function loadChildren (node) {
    if (node.children?.length || node.isLeaf) return

    lastLoaded.value = node.label

    // 模拟异步子节点
    node.children = [
      { id: `${node.id}-c0`, label: `${node.label} 子项 1` },
      { id: `${node.id}-c1`, label: `${node.label} 子项 2` }
    ]
  }
</script>

<style>
  .demo-tree {
    --mu-tree_node-height: 32px;

    width: 100%;
    height: 260px;
    border: 1px solid var(--mu-border-color-soft);
  }

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
