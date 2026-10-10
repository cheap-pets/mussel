<template>
  <div v-if="!keyless" class="mu-side-menu__node">
    <div
      ref="rowEl"
      class="mu-side-menu__item"
      :style="{ '--mu-side-menu_level': level }"
      :top="(!props.level && !popup) || null"
      :inert="isDisabled || null"
      :active="isRowActive || null"
      :group="isGroup || null"
      :expanded="(!popupRow && groupExpanded) || null"
      :data-key="inFavoritesGroup ? null : node.id"
      :title="rowTitle"
      @click="onClick"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave">
      <mu-icon class="mu-side-menu__item-icon" :icon="node.icon" />
      <span ref="labelEl" class="mu-side-menu__item-label">{{ node.label }}</span>
      <mu-icon v-if="expandIcon" class="mu-side-menu__item-expand-icon" :icon="expandIcon" />
      <div
        v-else-if="showFavoriteBtn"
        class="mu-side-menu__item-star"
        :starred="starred || null"
        @click.stop="onFavoriteClick">
        <mu-icon :icon="starred ? 'starred' : 'star'" />
      </div>
    </div>
    <div v-if="isGroup && !popupRow" class="mu-side-menu__group" :expanded="groupExpanded || null">
      <div class="mu-side-menu__sublist" :inert="!groupExpanded || null">
        <side-menu-node
          v-for="(child, index) in node.items"
          :key="child.id ?? index"
          :node="child"
          :level="level + 1"
          :in-favorites="inFavoritesGroup" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, shallowRef, inject, provide } from 'vue'

  import { FAVORITES_KEY, warnDeepLevel, createExpandToggle } from './side-menu'
  import { isDev } from '@/env'

  defineOptions({ name: 'MusselSideMenuNode' })

  const props = defineProps(['node', 'level', 'inFavorites'])
  const menu = inject('sideMenu')

  // 行所在列表的展开 toggle：accordion 互斥由渲染该级列表的组件处理
  const toggleExpand = inject('sideMenuExpandToggle')

  const {
    collapsed,
    popup,
    activeItem,
    activePath,
    favoritesEnabled
  } = menu

  const labelEl = shallowRef()
  const overflowed = shallowRef(false)

  const node = computed(() => props.node)
  const railMode = computed(() => collapsed.value && !popup && !props.level)
  const isDisabled = computed(() => !!node.value.disabled)
  const isGroup = computed(() => !!node.value.items?.length)

  const rowTitle = computed(() => (
    (railMode.value ? !isGroup.value : overflowed.value) && node.value.label) ||
    null
  )

  const popupRow = computed(() => {
    if (!isGroup.value) return false
    // 弹层内组行：hover 继续浮出下一层；主树：折叠态一级组 / 展开态二级组（R2 定稿）
    if (popup) return true
    return collapsed.value ? !props.level : props.level === 1
  })

  const active = computed(() =>
    !isGroup.value &&
    node.value.id != null &&
    node.value.id === activeItem.value
  )

  const isRowActive = computed(() =>
    active.value || activePath.value.has(node.value.id)
  )

  const groupExpanded = computed(() =>
    isGroup.value && menu.isExpanded(node.value)
  )

  const expandIcon = computed(() => {
    if (!isGroup.value || railMode.value) return null

    return (popupRow.value || !groupExpanded.value)
      ? 'chevronRight'
      : 'chevronDown'
  })

  const keyless = computed(() => node.value.id == null)
  const starred = computed(() => favoritesEnabled.value && menu.favoritesSet.value.has(node.value.id))

  const showFavoriteBtn = computed(() =>
    favoritesEnabled.value &&
    !isGroup.value &&
    node.value.id !== FAVORITES_KEY &&
    (!collapsed.value || popup)
  )

  const inFavoritesGroup = computed(() =>
    props.inFavorites || node.value.id === FAVORITES_KEY
  )

  function checkOverflow () {
    const el = labelEl.value
    overflowed.value = el.scrollWidth > el.clientWidth
  }

  function onClick () {
    if (isDisabled.value) return

    menu.onItemClick(props.node)

    if (!isGroup.value) {
      menu.onSelectItem(props.node)
    } else if (!popupRow.value) {
      toggleExpand(node.value)
    }
  }

  // 本组子列表：为其子行提供同级互斥的展开 toggle
  provide('sideMenuExpandToggle', createExpandToggle(menu, () => node.value.items))

  // 组行 hover 浮出下一层弹层；tooltip 已由原生 title 属性替代。
  // 主树锚点为折叠态一级组 / 展开态二级组（R2 定稿），弹层内组行逐层级联
  const rowEl = shallowRef()

  function onMouseEnter () {
    if (isDisabled.value) return

    // 同步检测并更新响应式 overflowed，浏览器 title 计时从指针进入起算，同步赋值不误显示时机
    if (!railMode.value) checkOverflow()

    if (popupRow.value) {
      menu.openPopup(rowEl.value, props.node)
    }
  }

  function onMouseLeave () {
    if (popupRow.value) {
      menu.delayPopupHide()
    }
  }

  function onFavoriteClick () {
    menu.toggleFavorite(props.node)
  }

  if (isDev) {
    if (keyless.value) {
      console.warn(
        '[MUSSEL:SideMenu]',
        'Node is missing the "id" field and has been skipped:',
        props.node
      )
    } else if (props.level > 2) {
      warnDeepLevel()
    }
  }
</script>
