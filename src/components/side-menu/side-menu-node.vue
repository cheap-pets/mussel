<template>
  <li v-if="renderable" class="mu-side-menu__node">
    <button
      ref="rowEl"
      type="button"
      class="mu-side-menu__item"
      :style="{ '--mu-side-menu_level': level }"
      :top="(!props.level && !popup) || null"
      :disabled="isDisabled || null"
      :active="isRowActive || null"
      :group="isGroup || null"
      :expanded="(isGroup && !popupRow && groupExpanded) || null"
      :aria-expanded="isGroup && !popupRow ? String(!!groupExpanded) : null"
      :aria-haspopup="popupRow ? 'menu' : null"
      :aria-current="active ? 'page' : null"
      :data-key="data.key"
      :title="(!railMode && data.title) || null"
      @click="onClick"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave">
      <component :is="itemRender" v-if="itemRender" />
      <template v-else>
        <mu-icon
          v-if="data.icon"
          class="mu-side-menu__item-icon"
          :icon="data.icon" />
        <span class="mu-side-menu__item-label">{{ data.label }}</span>
      </template>
      <mu-icon
        v-if="expandIcon"
        class="mu-side-menu__item-expand-icon"
        :icon="expandIcon"
        :rotate="sameExpandIcon || null"
        :expanded="(isGroup && groupExpanded) || null" />
    </button>
    <button
      v-if="showFavoriteBtn"
      type="button"
      class="mu-side-menu__favorite-btn"
      :favorited="favorited || null"
      @click.stop="onFavoriteClick">
      <mu-icon :icon="favorited ? 'starred' : 'star'" />
    </button>
    <div
      v-if="isGroup && !popupRow"
      class="mu-side-menu__group"
      :expanded="groupExpanded || null">
      <ul :inert="!groupExpanded || null">
        <side-menu-node
          v-for="(child, index) in data.childNodes"
          :key="child[keyProp] ?? index"
          :node="child"
          :level="level + 1"
          :parent-keys="keyPath" />
      </ul>
    </div>
  </li>
</template>

<script setup>
  import { computed, shallowRef, inject, watch } from 'vue'
  import { isDev } from '@/env'
  import { createTooltipAnchorHandlers } from '../tooltip/tooltip-core'
  import { FAVORITES_KEY } from './side-menu'

  defineOptions({ name: 'MusselSideMenuNode' })

  const props = defineProps(['node', 'level', 'parentKeys'])

  const menu = inject('sideMenu')

  const {
    nodeProps,
    keyProp,
    childProp,
    disabled,
    collapsed,
    popup,
    expandIcons,
    activeItem,
    slots
  } = menu

  const data = computed(() => Object.fromEntries(
    Object
      .entries(nodeProps.value)
      .map(([key, prop]) => [key, props.node[prop]])
  ))

  const isGroup = computed(() => !!data.value.childNodes?.length)

  // 折叠态图标条：仅一级项渲染（图标 + tooltip / 弹层），子树不渲染
  const railMode = computed(() => collapsed.value && !popup && !props.level)

  // hover 浮出子菜单的组头：折叠 rail 上的一级组、展开态下的二级组
  // （三级及更深不在体内展开，以浮层展示）；弹层内组仍为内联展开
  const popupRow = computed(() =>
    isGroup.value &&
    !popup &&
    (collapsed.value ? !props.level : props.level === 1)
  )

  const isDisabled = computed(() => disabled.value || !!data.value.disabled)

  const keyPath = computed(() => [...(props.parentKeys || []), data.value.key])

  const active = computed(() =>
    !isGroup.value &&
    data.value.key != null &&
    data.value.key === activeItem.value
  )

  const hasActiveDescendant = computed(() => {
    if (!isGroup.value || activeItem.value == null) return false

    const key = activeItem.value

    function walk (nodes) {
      return (nodes || []).some(node =>
        node[childProp.value]?.length
          ? walk(node[childProp.value])
          : node[keyProp.value] === key
      )
    }

    return walk(data.value.childNodes)
  })

  // 「我的收藏」为派生组，不显示激活态：激活项恰被收藏时组头保持普通样式
  const isRowActive = computed(() =>
    (active.value || hasActiveDescendant.value) &&
    !(menu.favoritesEnabled.value && data.value.key === FAVORITES_KEY)
  )

  const groupExpanded = computed(() =>
    isGroup.value && menu.isExpanded(data.value.key)
  )

  const expandIcon = computed(() => {
    if (!isGroup.value || railMode.value || expandIcons.value === false) return null

    // 浮出组无内联展开态，固定右向箭头指示浮出方向
    if (popupRow.value) return expandIcons.value.collapsed

    return groupExpanded.value
      ? expandIcons.value.expanded
      : expandIcons.value.collapsed
  })

  // expanded/collapsed 配置为同一图标时切换为旋转过渡
  const sameExpandIcon = computed(() =>
    expandIcons.value !== false &&
    expandIcons.value.expanded === expandIcons.value.collapsed
  )

  const favoritesEnabled = menu.favoritesEnabled

  const favorited = computed(() =>
    favoritesEnabled.value && menu.favoritedSet.value.has(data.value.key)
  )

  // 收藏星标：叶子行右缘；折叠图标条上不显示（弹层面板内同一组件行为一致）
  const showFavoriteBtn = computed(() =>
    favoritesEnabled.value &&
    !isGroup.value &&
    (!collapsed.value || popup)
  )

  const itemScope = computed(() => ({
    item: props.node,
    level: props.level,
    active: active.value,
    expanded: !!groupExpanded.value,
    favorited: favorited.value,
    collapsed: collapsed.value
  }))

  const itemRender = computed(() => {
    const slot = slots.item
    return slot && (() => slot(itemScope.value))
  })

  function onClick () {
    if (isDisabled.value) return

    menu.onItemClick(props.node, keyPath.value)

    if (isGroup.value) {
      // 浮出组点击无操作（浮层 hover 驱动），内联组切换展开
      if (!popupRow.value) menu.setExpanded(data.value.key, !groupExpanded.value)
    } else {
      menu.onSelectItem(props.node, keyPath.value)
    }
  }

  // 折叠图标条的 tooltip（一级叶子）与子菜单弹层（一级组）
  const tooltip = menu.tooltip
  const rowEl = shallowRef()

  const tipHandlers = tooltip && createTooltipAnchorHandlers(
    tooltip,
    () => rowEl.value,
    () => ({ content: data.value.title || data.value.label, placement: 'right' })
  )

  function releaseTip () {
    if (tooltip?.state.anchor === rowEl.value) tooltip.hide()
  }

  function onMouseEnter () {
    if (isDisabled.value) return

    if (popupRow.value) menu.openPopup(rowEl.value, props.node)
    else if (railMode.value) tipHandlers?.mouseenter()
  }

  function onMouseLeave () {
    if (popupRow.value) menu.delayPopupHide()
    else if (railMode.value) tipHandlers?.mouseleave()
  }

  watch(railMode, value => {
    if (!value) releaseTip()
  })

  function onFavoriteClick () {
    menu.toggleFavorite(props.node)
  }

  const renderable = computed(() => data.value.key != null)

  if (isDev && renderable.value && props.level > 2) {
    warnLevel()
  }

  if (isDev && !renderable.value) {
    console.warn(
      '[MUSSEL:SideMenu]',
      `Node is missing the "${keyProp.value}" field and has been skipped:`,
      props.node
    )
  }
</script>

<script>
  let levelWarned

  function warnLevel () {
    if (levelWarned) return
    levelWarned = true
    console.warn(
      '[MUSSEL:SideMenu]',
      'Menu data deeper than 3 levels is not recommended.'
    )
  }
</script>
