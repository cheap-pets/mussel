<template>
  <div
    class="mu-menu-item"
    :style="{ '--mu-menu-item_level': level }"
    :title="itemTitle || null"
    :group="isGroup || null"
    :active="isActive || null"
    :inert="isDisabled || null"
    @click="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <mu-icon class="mu-menu-item__icon" :icon="item.icon" />
    <template v-if="!rail">
      <span ref="labelRef" class="mu-menu-item__label">{{ item.label }}</span>
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

  import { computed, shallowRef, inject, toRaw } from 'vue'

  defineOptions({ name: 'MusselMenuItem' })

  const props = defineProps({
    top: Boolean,
    item: Object,
    rail: Boolean,
    level: { type: Number, default: 0 },
    expanded: Boolean
  })

  const emit = defineEmits(['itemEnter', 'itemLeave'])

  const menu = inject('menu')

  const labelRef = shallowRef()
  const isLabelOverflowed = shallowRef(false)

  const isHorizontalTop = computed(() => menu.direction === 'horizontal' && props.top)
  const isGroup = computed(() => props.item.isGroup || !!props.item.items?.length)
  const isDisabled = computed(() => !!props.item.disabled)

  const isActive = computed(() => {
    const active = menu.activeItem.value
    const node = props.item

    return (!isGroup.value && (
      toRaw(node) === toRaw(active) ||
      (node.id != null && node.id === active)
    )) || menu.activePath.value.has(node)
  })

  const itemTitle = computed(() =>
    (props.rail ? !isGroup.value : isLabelOverflowed.value) &&
    props.item.label
  )

  const expandIcon = computed(() =>
    isGroup.value && !props.rail && (
      isHorizontalTop.value
        ? menu.barExpandIcon?.value && 'dropdownExpand'
        : props.top ? 'treeNodeExpand' : 'chevronRight'
    )
  )

  const isStarred = computed(() => !!menu.favoritesSet?.value?.has(props.item.id))

  // 收藏按 id 键控，无 id 项不出星标
  const showFavoriteBtn = computed(() =>
    !!menu.favoritesSet?.value &&
    !isGroup.value &&
    props.item.id != null
  )

  function checkLabelOverflow () {
    const el = labelRef.value

    isLabelOverflowed.value = !!el && el.scrollWidth > el.clientWidth
  }

  function onClick (event) {
    if (isDisabled.value) return

    menu.onItemClick(props.item, { anchorEl: event.currentTarget, top: props.top })
  }

  function onFavoriteClick () {
    menu.toggleFavorited?.(props.item)
  }

  function onMouseEnter (event) {
    if (isDisabled.value) return
    if (!props.rail) checkLabelOverflow()

    emit('itemEnter', event.currentTarget)
  }

  function onMouseLeave () {
    emit('itemLeave')
  }
</script>
