<template>
  <div
    v-if="!isInvalid"
    class="mu-menu-item"
    :data-key="group?.isFavoriteGroup ? null : item.id"
    :style="{ '--mu-menu-item_level': level }"
    :title="rowTitle"
    :group="isGroup || null"
    :active="isActive || null"
    :inert="isDisabled || null"
    @click="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <mu-icon class="mu-menu-item__icon" :icon="item.icon" />
    <template v-if="!rail">
      <span ref="labelEl" class="mu-menu-item__label">{{ item.label }}</span>
      <mu-icon
        v-if="expandIcon"
        class="mu-menu-item__expand-icon"
        :icon="expandIcon"
        :expanded="expanded || null" />
      <mu-icon
        v-else-if="showFavoriteBtn"
        class="mu-menu-item__star"
        :icon="isStarred ? 'starred' : 'star'"
        :starred="isStarred || null"
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
    item: Object,
    rail: Boolean,
    group: Object,
    level: { type: Number, default: 0 },
    expanded: Boolean
  })
  const emit = defineEmits(['itemEnter', 'itemLeave'])
  const menu = inject('menu')

  const { activeItem, activePath } = menu

  const labelEl = shallowRef()
  const labelOverflowed = shallowRef(false)

  const isHorizontalTop = computed(() => menu.direction === 'horizontal' && props.top)
  const isGroup = computed(() => props.item.isGroup || !!props.item.items?.length)
  const isDisabled = computed(() => !!props.item.disabled)

  const isActive = computed(() =>
    (!isGroup.value && props.item.id === activeItem.value) ||
    activePath.value.has(props.item.id)
  )

  const rowTitle = computed(() =>
    ((props.rail ? !isGroup.value : labelOverflowed.value) && props.item.label) ||
    null
  )

  const expandIcon = computed(() => {
    return isGroup.value && !props.rail && (
      isHorizontalTop.value
        ? menu.barExpandIcon?.value && 'dropdownExpand'
        : props.top ? 'treeNodeExpand' : 'chevronRight'
    )
  })

  const isInvalid = computed(() => props.item.id == null && !props.item.isFavoriteGroup)
  const isStarred = computed(() => !!menu.favoritesSet?.value?.has(props.item.id))

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
      menu.onItemClick(props.item, { anchorEl: event.currentTarget, top: props.top })
    }
  }

  function onMouseEnter (event) {
    if (isDisabled.value) return
    if (!props.rail) checkLabelOverflow()

    emit('itemEnter', event.currentTarget)
  }

  function onMouseLeave () {
    emit('itemLeave')
  }

  function onFavoriteClick () {
    menu.toggleFavorited?.(props.item)
  }

  if (isDev && isInvalid.value) {
    console.warn(
      '[MUSSEL:SideMenu]',
      'Item is missing the "id" field and has been skipped:',
      props.item
    )
  }
</script>
