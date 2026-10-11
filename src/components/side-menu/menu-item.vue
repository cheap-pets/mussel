<template>
  <div
    v-if="!keyless"
    class="mu-menu-item"
    :style="{ '--mu-menu-item_level': level }"
    :data-key="group?.isFavoriteGroup ? null : node.id"
    :active="isRowActive || null"
    :inert="isDisabled || null"
    :group="isGroup || null"
    :title="rowTitle"
    @click="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <mu-icon class="mu-menu-item__icon" :icon="node.icon" />
    <template v-if="!rail">
      <span ref="labelEl" class="mu-menu-item__label">{{ node.label }}</span>
      <mu-icon v-if="expandIcon" class="mu-menu-item__expand-icon" :icon="expandIcon" />
      <mu-icon
        v-else-if="showFavoriteBtn"
        class="mu-menu-item__star"
        :icon="starred ? 'starred' : 'star'"
        :starred="starred || null"
        @click.stop="onFavoriteClick" />
      <span v-else class="mu-menu-item__icon" />
    </template>
  </div>
</template>

<script setup>
  import './menu-item.scss'

  import { computed, shallowRef, inject } from 'vue'

  import { isDev } from '@/env'

  defineOptions({ name: 'MusselMenuItem' })

  const props = defineProps({
    node: Object,
    rail: Boolean,
    popup: Boolean,
    group: Object,
    level: { type: Number, default: 0 },
    expanded: Boolean
  })
  const emit = defineEmits(['itemEnter', 'itemLeave', 'rowClick', 'favoriteToggle'])
  const menu = inject('menu')

  const { activeItem, activePath } = menu

  const labelEl = shallowRef()
  const labelOverflowed = shallowRef(false)

  const isGroup = computed(() => props.node.isGroup || !!props.node.items?.length)
  const isDisabled = computed(() => !!props.node.disabled)

  const rowTitle = computed(() => (
    (props.rail ? !isGroup.value : labelOverflowed.value) && props.node.label) ||
    null
  )

  // 组行的浮出形态：弹层内行恒弹层；主栏行按宿主与层级——横向主栏一级组、
  // 纵向收拢态一级组 / 展开态二级组为弹层锚点，其余内联展开
  const isPopupRow = computed(() => {
    if (!isGroup.value) return false
    if (props.popup) return true

    return props.rail || props.level === 1 || menu.direction === 'horizontal'
  })

  const active = computed(() =>
    !isGroup.value &&
    props.node.id === activeItem.value
  )

  const isRowActive = computed(() =>
    active.value || activePath.value.has(props.node.id)
  )

  const expandIcon = computed(() => {
    if (!isGroup.value || props.rail) return null

    // isPopupRow 行的箭头指向弹出方向：弹层内行向右级联，主栏行按宿主——
    // 横向主栏向下弹、纵向侧栏二级组向右。主栏行受 menu.vue 的 expand-icon
    // 属性控制（上下文键，side-menu 恒显示）
    if (isPopupRow.value) {
      if (props.popup) return 'chevronRight'
      if (menu.barExpandIcon?.value === false) return null

      return menu.direction === 'horizontal' ? 'chevronDown' : 'chevronRight'
    }

    return props.expanded ? 'chevronDown' : 'chevronRight'
  })

  const keyless = computed(() => props.node.id == null && !props.group?.isFavoriteGroup)
  const starred = computed(() => !!menu.favoritesSet?.value?.has(props.node.id))

  const showFavoriteBtn = computed(() =>
    !!menu.favoritesSet?.value &&
    !isGroup.value
  )

  function checkLabelOverflow () {
    const el = labelEl.value
    labelOverflowed.value = !!el && el.scrollWidth > el.clientWidth
  }

  function onClick (event) {
    if (!isDisabled.value) {
      emit('rowClick', event)
    }
  }

  function onMouseEnter (event) {
    if (isDisabled.value) return
    if (!props.rail) checkLabelOverflow()

    emit('itemEnter', event)
  }

  function onMouseLeave () {
    emit('itemLeave')
  }

  function onFavoriteClick () {
    emit('favoriteToggle')
  }

  if (isDev && keyless.value) {
    console.warn(
      '[MUSSEL:SideMenu]',
      'Node is missing the "id" field and has been skipped:',
      props.node
    )
  }
</script>
