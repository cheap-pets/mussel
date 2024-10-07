<template>
  <a
    class="mu-tree-node"
    :expanded="expanded || null"
    :disabled="data.disabled || null"
    :active="active || null"
    :style="{ paddingLeft }"
    @click="tree.emit('nodeClick', node)"
    @dblclick="toggleExpand">
    <mu-icon
      v-if="expandIcon !== false"
      class="mu-tree-node_expand-icon"
      :icon="expandIcon"
      @click.stop="toggleExpand"
      @dblclick.stop />
    <mu-check
      v-if="checkbox"
      v-model="checked"
      class="mu-tree-node_check"
      @dblclick.stop />
    <slot :node="node">
      <mu-icon
        v-if="nodeIcon !==false"
        class="mu-tree-node_icon"
        :icon="nodeIcon" />
      <label class="mu-tree-node_label" :title="data.title">
        {{ data.label }}
      </label>
    </slot>
    <slot name="buttons" :node="node">
      <mu-icon
        v-for="btn in buttons"
        :key="btn"
        v-bind="btn"
        tag="a"
        class="mu-tool-button mu-tree-node_button"
        @click="tree.emit('nodeButtonClick', node, btn)" />
    </slot>
  </a>
  <template v-if="expanded">
    <mu-tree-nodes :nodes="data.childNodes" :level="level + 1">
      <template #default="scoped">
        <slot :node="scoped.node" />
      </template>
      <template #buttons="scoped">
        <slot name="buttons" :node="scoped.node" />
      </template>
    </mu-tree-nodes>
  </template>
</template>

<script setup>
  import { computed, toRaw, inject } from 'vue'

  const props = defineProps(['node', 'level'])
  const tree = inject('tree')

  const {
    buttons,
    nodeIcons,
    expandIcons,
    nodeProps,
    expandLevel,
    checkbox,
    checkedNodesKeys,
    activeNode
  } = tree

  const data = computed(() => Object.fromEntries(
    Object
      .entries(nodeProps.value)
      .map(([key, prop]) => [key, props.node[prop]])
  ))

  const isLeaf = computed(() =>
    !data.value.childNodes?.length &&
    (
      !nodeProps.value.isLeaf ||
      data.value.isLeaf
    )
  )

  const checked = computed({
    get () {
      return checkedNodesKeys.value
        ? checkedNodesKeys.value.has(data.value.key)
        : !!data.value.checked
    },
    set (v) {
      tree.emit('nodeCheckChange', props.node, v)
    }
  })

  const expanded = computed(() => {
    const level = expandLevel.value ?? -1
    const value = tree.getNodeExpanded(props.node)

    return value == null && level != null && props.level <= level
      ? tree.setNodeExpanded(props.node, !isLeaf.value)
      : value
  })

  const expandIcon = computed(() =>
    (expandIcons.value !== false) &&
    (
      (
        isLeaf.value
          ? expandIcons.value.leaf
          : (
            (
              expanded.value &&
              expandIcons.value.expanded
            ) || expandIcons.value.collapsed
          )
      ) ||
      null
    )
  )

  const nodeIcon = computed(() =>
    (nodeIcons.value !== false) &&
    (
      data.value.icon ||
      (
        isLeaf.value
          ? nodeIcons.value.leaf
          : ((expanded.value && nodeIcons.value.folderOpen) || nodeIcons.value.folder)
      ) ||
      null
    )
  )

  const paddingLeft = computed(() =>
    `calc(var(--mu-tree_node-indent) * ${props.level})`
  )

  const active = computed(() =>
    (toRaw(props.node) === toRaw(activeNode.value)) ||
    (data.value.key != null && data.value.key === activeNode.value)
  )

  function toggleExpand () {
    if (!isLeaf.value) {
      tree.setNodeExpanded(props.node, !expanded.value, true)
    }
  }
</script>
