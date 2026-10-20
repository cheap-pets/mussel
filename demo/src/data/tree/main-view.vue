<template>
  <demo-page path="data/tree">
    <demo-section
      title="基础用法"
      note="data 传节点数组（childNodes 为子节点、label 为文本、icon 为图标），active-node 绑定当前节点，点击触发 node-click"
      :code="basicCode"
      vertical>
      <mu-tree
        :data="treeData"
        :active-node="activeNode"
        class="demo-tree"
        @node-click="onNodeClick" />
      <span class="demo-log">选中节点：{{ activeNode?.label ?? '无' }} {{ lastEvent }}</span>
    </demo-section>

    <demo-section
      title="数据字段映射"
      note="props 自定义节点字段名（label/title/icon/childNodes 等），适配既有数据结构">
      <mu-tree
        :data="aliasData"
        :active-node="activeNode"
        :props="{ label: 'alias', title: 'label', icon: 'icon2' }"
        class="demo-tree" />
    </demo-section>

    <demo-section
      title="节点图标"
      note="node-icons 为 false 隐藏图标；传对象可按 folder/folderOpen/leaf 指定默认图标；expand-icons 控制展开箭头（false 隐藏成列表形态）"
      vertical>
      <div class="demo-columns">
        <div class="demo-column">
          <p class="demo-column__title">隐藏图标</p>
          <mu-tree
            :data="treeData"
            :node-icons="false"
            class="demo-tree" />
        </div>
        <div class="demo-column">
          <p class="demo-column__title">自定义默认图标</p>
          <mu-tree
            :data="treeData"
            :node-icons="{ folder: 'folder', folderOpen: 'folderOpen', leaf: 'file' }"
            class="demo-tree" />
        </div>
        <div class="demo-column">
          <p class="demo-column__title">自定义展开箭头</p>
          <mu-tree
            :data="treeData"
            :expand-icons="{ expanded: 'chevronDown', collapsed: 'chevronRight', leaf: 'file' }"
            :node-icons="{ folder: 'calendar', folderOpen: 'clock', leaf: 'file' }"
            class="demo-tree" />
        </div>
        <div class="demo-column">
          <p class="demo-column__title">隐藏展开箭头</p>
          <mu-tree
            :data="treeData"
            :expand-icons="false"
            :props="{ childNodes: '' }"
            class="demo-tree" />
        </div>
      </div>
    </demo-section>

    <demo-section
      title="自定义节点模板"
      note="#default 作用域插槽完全接管节点内容（scope.node 为节点数据）；#buttons 自定义悬停按钮区"
      vertical>
      <mu-tree
        :data="treeData"
        class="demo-tree">
        <template #default="scoped">
          <mu-icon
            icon="info"
            :style="{ color: scoped.node.id % 5 === 0 ? 'red' : undefined }" />
          <label
            class="mu-tree-node__label"
            :style="{ color: scoped.node.id % 5 === 0 ? 'red' : undefined }">
            自定义：{{ scoped.node.label }}（id: {{ scoped.node.id }}）
          </label>
        </template>
        <template #buttons="scoped">
          <mu-icon-button
            v-if="scoped.node.id % 3 > 0"
            icon="x"
            color="danger"
            hover
            button-style="text"
            class="mu-tree-node__button" />
        </template>
      </mu-tree>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="disabled 节点不可选中、单根节点、深层嵌套展开"
      regression
      vertical>
      <div class="demo-columns">
        <div class="demo-column">
          <p class="demo-column__title">disabled 节点（id 为 7 的倍数）</p>
          <mu-tree
            :data="treeData"
            :active-node="activeNode"
            class="demo-tree demo-tree--short" />
        </div>
        <div class="demo-column">
          <p class="demo-column__title">深层嵌套</p>
          <mu-tree
            :data="deepData"
            :auto-expand-level="2"
            class="demo-tree demo-tree--short" />
        </div>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-tree v-model:active-node="activeNode" :data="data" @node-click="..." />

const data = [
  { label: '节点一', icon: 'folder', childNodes: [
    { label: '子节点' }
  ] },
  { label: '节点二' }
]`

  const activeNode = ref()
  const lastEvent = ref('')

  let count = 0

  // 确定性生成树：固定容量与层级，保证 demo 可重复断言
  function createNode (level, maxLevel) {
    const node = {
      id: count,
      icon: count % 5 === 0 ? 'flag' : undefined,
      icon2: 'star',
      alias: `Node Alias ${count}`,
      label: `Node ${count}`,
      disabled: count % 7 === 0
    }

    count++

    // 子节点数按 id 固定：0~3 个，保证部分叶子、部分分支
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
  const aliasData = ref([])

  for (let i = 0; i < 8; i++) treeData.value.push(createNode(0, 2))
  count = 0
  for (let i = 0; i < 5; i++) aliasData.value.push(createNode(0, 2))

  const deepData = ref([createDeep(0, 5)])

  function createDeep (level, maxLevel) {
    const node = { id: `d-${level}-${count}`, label: `Level ${level}` }

    count++

    if (level < maxLevel) node.childNodes = [createDeep(level + 1, maxLevel)]

    return node
  }

  function onNodeClick (node) {
    activeNode.value = node
    lastEvent.value = `node-click: ${node.label}`
  }
</script>

<style>
  .demo-tree {
    --mu-tree_node-height: 32px;

    width: 100%;
    height: 280px;
    border: 1px solid var(--mu-border-color-soft);
  }

  .demo-tree--short {
    height: 200px;
  }

  .demo-columns {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .demo-column {
    flex: 1 1 240px;
    min-width: 0;
  }

  .demo-column__title {
    margin: 0 0 4px;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
