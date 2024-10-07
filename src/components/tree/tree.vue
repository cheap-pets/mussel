<template>
  <div class="mu-tree">
    <mu-tree-nodes :nodes="data" :level="0">
      <template #default="{ node }">
        <slot :node="node" />
      </template>
      <template #buttons="{ node }">
        <slot name="buttons" :node="node" />
      </template>
    </mu-tree-nodes>
  </div>
</template>

<script setup>
  import './tree.scss'

  import { toRef, computed, provide, inject } from 'vue'
  import { DEFAULT_DATA_PROPS, DEFAULT_EXPAND_ICONS, DEFAULT_NODE_ICONS } from './default-options'
  import { useExpand } from './tree'

  defineOptions({ name: 'MusselTree' })

  const props = defineProps({
    ui: Object,
    data: Array,
    props: Object,
    buttons: Array,
    checkbox: Boolean,
    cascadedCheck: Boolean,
    checkedNodesKeys: Set,
    autoExpandLevel: Number,
    activeNode: [Object, String, Number],
    nodeIcons: {
      type: [Boolean, Object],
      default: true
    },
    expandIcons: {
      type: [Boolean, Object],
      default: true
    }
  })

  const emit = defineEmits([
    'nodeClick',
    'nodeExpand',
    'nodeCollapse',
    'nodeButtonClick',
    'nodeCheckChange'
  ])

  const { tree: treeOptions = {} } = inject('$mussel').options

  const nodeProps = computed(() =>
    Object.fromEntries(
      Object
        .entries({ ...DEFAULT_DATA_PROPS, ...props.props })
        .filter(([key, prop]) => !!prop)
    )
  )

  const keyProp = computed(() => nodeProps.value.key)

  const nodeIcons = computed(() => (
    (props.nodeIcons !== false) &&
    { ...DEFAULT_NODE_ICONS, ...treeOptions.nodeIcons, ...props.nodeIcons }
  ))

  const expandIcons = computed(() => (
    (props.expandIcons !== false) &&
    { ...DEFAULT_EXPAND_ICONS, ...treeOptions.expandIcons, ...props.expandIcons }
  ))

  const checkbox = toRef(props, 'checkbox')
  const cascadedCheck = toRef(props, 'cascadedCheck')
  const checkedNodesKeys = toRef(props, 'checkedNodesKeys')

  const activeNode = toRef(props, 'activeNode')
  const buttons = toRef(props, 'buttons')

  function onNodeExpandedChange (node, value) {
    emit(value ? 'nodeExpand' : 'nodeCollapse', node)
  }

  const {
    expandLevel,
    getNodeExpanded,
    setNodeExpanded,
    resetExpandLevel,
    walkTo,
    expand,
    collapse
  } = useExpand({
    keyProp: keyProp.value,
    expandLevel: props.autoExpandLevel,
    onNodeExpandedChange
  })

  function expandTo (target) {
    expand(...walkTo(props.data, target))
  }

  function expandAll (options = {}) {
    resetExpandLevel(options.level || props.autoExpandLevel || 0)
  }

  function collapseAll () {
    resetExpandLevel(null)
  }

  provide('tree', {
    emit,

    nodeProps,
    keyProp,

    buttons,
    nodeIcons,
    expandIcons,

    activeNode,

    checkbox,
    cascadedCheck,
    checkedNodesKeys,

    expandLevel,
    getNodeExpanded,
    setNodeExpanded
  })

  defineExpose({
    expand,
    collapse,
    expandTo,
    expandAll,
    collapseAll
  })
</script>
