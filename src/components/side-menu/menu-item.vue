<template>
  <div
    v-if="!keyless"
    class="mu-menu-item"
    :data-key="group?.isFavoriteGroup ? null : node.id"
    :style="{ '--mu-menu-item_level': level }"
    :title="rowTitle"
    :group="isGroup || null"
    :active="isActive || null"
    :inert="isDisabled || null"
    @click="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <mu-icon class="mu-menu-item__icon" :icon="node.icon" />
    <template v-if="!rail">
      <span ref="labelEl" class="mu-menu-item__label">{{ node.label }}</span>
      <mu-icon
        v-if="expandIcon"
        class="mu-menu-item__expand-icon"
        :icon="expandIcon"
        :expanded="expanded || null" />
      <mu-icon
        v-else-if="showFavoriteBtn"
        class="mu-menu-item__star"
        :icon="starred ? 'starred' : 'star'"
        :starred="starred || null"
        @click.stop="onFavoriteClick" />
      <span v-else-if="!isHorizontalTop" class="mu-menu-item__icon" />
    </template>
  </div>
</template>

<script setup>
  import './menu-item.scss'

  import { computed, shallowRef, inject } from 'vue'

  import { isDev } from '@/env'

  defineOptions({ name: 'MusselMenuItem' })

  const props = defineProps({
    top: Boolean,
    node: Object,
    rail: Boolean,
    group: Object,
    level: { type: Number, default: 0 },
    expanded: Boolean
  })
  const emit = defineEmits(['itemEnter', 'itemLeave', 'rowClick', 'favoriteToggle'])
  const menu = inject('menu')

  const { activeItem, activePath } = menu

  const labelEl = shallowRef()
  const labelOverflowed = shallowRef(false)

  const isHorizontalTop = computed(() => menu.direction === 'horizontal' && props.top)
  const isGroup = computed(() => props.node.isGroup || !!props.node.items?.length)
  const isDisabled = computed(() => !!props.node.disabled)

  const isActive = computed(() =>
    (!isGroup.value && props.node.id === activeItem.value) ||
    activePath.value.has(props.node.id)
  )

  const rowTitle = computed(() =>
    ((props.rail ? !isGroup.value : labelOverflowed.value) && props.node.label) ||
    null
  )

  const expandIcon = computed(() => {
    return isGroup.value && !props.rail && (
      isHorizontalTop.value
        ? menu.barExpandIcon?.value && 'dropdownExpand'
        : props.top ? 'treeNodeExpand' : 'chevronRight'
    )
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
