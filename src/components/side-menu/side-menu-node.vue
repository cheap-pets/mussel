<template>
  <li
    v-if="!keyless"
    class="mu-side-menu__node">
    <div
      ref="rowEl"
      class="mu-side-menu__item"
      :style="{ '--mu-side-menu_level': level }"
      :top="(!props.level && !popup) || null"
      :inert="isDisabled || null"
      :active="isRowActive || null"
      :group="isGroup || null"
      :expanded="(isGroup && !popupRow && groupExpanded) || null"
      :data-key="data.key"
      :data-favorites="inFavoritesGroup || null"
      :title="(!railMode && data.title) || null"
      @click="onClick"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave">
      <mu-icon
        v-if="data.icon"
        class="mu-side-menu__item-icon"
        :icon="data.icon" />
      <span class="mu-side-menu__item-label">{{ data.label }}</span>
      <mu-icon
        v-if="expandIcon"
        class="mu-side-menu__item-expand-icon"
        :icon="expandIcon" />
      <div
        v-if="showFavoriteBtn"
        class="mu-side-menu__star"
        :starred="starred || null"
        @click.stop="onFavoriteClick">
        <mu-icon :icon="starred ? 'starred' : 'star'" />
      </div>
    </div>
    <div v-if="isGroup && !popupRow" class="mu-side-menu__group" :expanded="groupExpanded || null">
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
  import { computed, shallowRef, inject, watch, onBeforeUnmount } from 'vue'
  import { isDev } from '@/env'
  import { createTooltipAnchorHandlers } from '../tooltip/tooltip-core'
  import { FAVORITES_KEY, warnDeepLevel } from './side-menu'

  defineOptions({ name: 'MusselSideMenuNode' })

  const props = defineProps(['node', 'level', 'parentKeys'])

  const menu = inject('sideMenu')

  const {
    nodeProps,
    keyProp,
    collapsed,
    popup,
    activeItem,
    activePath,
    favoritesEnabled
  } = menu

  const data = computed(() => Object.fromEntries(
    Object
      .entries(nodeProps.value)
      .map(([key, prop]) => [key, props.node[prop]])
  ))

  const isGroup = computed(() => !!data.value.childNodes?.length)

  // 折叠态图标条：仅一级项渲染（图标 + tooltip / 弹层），子树不渲染
  const railMode = computed(() => collapsed.value && !popup && !props.level)

  // hover 浮出子菜单面板的组头：折叠 rail 上的一级组、展开态下的二级组（浮出为既定交互，
  // 面板顶部带锚点组标题栏，见 side-menu-popup）；弹层内的组仍为内联展开
  const popupRow = computed(() =>
    isGroup.value &&
    !popup &&
    (collapsed.value ? !props.level : props.level === 1)
  )

  // 数据级 disabled；根级禁用由容器的 class + inert 整体控制
  const isDisabled = computed(() => !!data.value.disabled)

  const keyPath = computed(() => [...(props.parentKeys || []), data.value.key])

  const active = computed(() =>
    !isGroup.value &&
    data.value.key != null &&
    data.value.key === activeItem.value
  )

  // 激活行，或激活项祖先组头的半强度态；收藏组为派生组，由原树构造的
  // activePath 永不含 FAVORITES_KEY，组头天然不进入激活态
  const isRowActive = computed(() =>
    active.value || activePath.value.has(data.value.key)
  )

  const groupExpanded = computed(() =>
    isGroup.value && menu.isExpanded(data.value.key)
  )

  // 图标固定：展开为 chevronDown，收起为 chevronRight；
  // 浮出组无内联展开态，恒为 chevronRight 指示浮出方向
  const expandIcon = computed(() => {
    if (!isGroup.value || railMode.value) return null

    return (popupRow.value || !groupExpanded.value)
      ? 'chevronRight'
      : 'chevronDown'
  })

  const keyless = computed(() => data.value.key == null)

  const starred = computed(() =>
    favoritesEnabled.value && menu.favoritesSet.value.has(data.value.key)
  )

  // 收藏星标：叶子行右缘；折叠图标条上不显示（弹层面板内同一组件行为一致）。
  // 收藏组头不可收藏：无收藏项时组退化为伪叶子行，同样排除
  const showFavoriteBtn = computed(() =>
    favoritesEnabled.value &&
    !isGroup.value &&
    data.value.key !== FAVORITES_KEY &&
    (!collapsed.value || popup)
  )

  // 行位于收藏组内（收藏副本标记，容器的滚动定位据此排除）
  const inFavoritesGroup = computed(() => props.parentKeys?.[0] === FAVORITES_KEY)

  function onClick () {
    if (isDisabled.value) return

    menu.onItemClick(props.node, keyPath.value)

    if (!isGroup.value) {
      menu.onSelectItem(props.node, keyPath.value)
    } else if (!popupRow.value) {
      menu.setExpanded(data.value.key, !groupExpanded.value)
    }
  }

  // 折叠图标条的 tooltip（一级叶子）与子菜单弹层（一级组）。
  // rail 态仅存在于主菜单一级行，tooltip 处理器与监听据此收窄，深层与弹层内行不建
  const tooltip = menu.tooltip
  const rowEl = shallowRef()
  const railRow = !popup && !props.level

  // 恒为 handlers 或 undefined（布尔短路会得到 false，?. 不短路会炸掉）
  const tipHandlers = railRow && tooltip
    ? createTooltipAnchorHandlers(
      tooltip,
      () => rowEl.value,
      () => ({ content: data.value.title || data.value.label, placement: 'right' })
    )
    : undefined

  function releaseTip () {
    if (tooltip?.state.anchor === rowEl.value) {
      tooltip.hide()
    }
  }

  function onMouseEnter () {
    if (isDisabled.value) return

    if (popupRow.value) {
      menu.openPopup(rowEl.value, props.node)
    } else if (railMode.value) {
      tipHandlers?.mouseenter()
    }
  }

  function onMouseLeave () {
    if (popupRow.value) {
      menu.delayPopupHide()
    } else if (railMode.value) {
      tipHandlers?.mouseleave()
    }
  }

  if (railRow && tooltip) {
    watch(railMode, value => !value && releaseTip())
  }

  function onFavoriteClick () {
    menu.toggleFavorite(props.node)
  }

  // 卸载：行被移除不再派发 mouseleave，清 pending showTimer 并释放显示中的 tooltip
  onBeforeUnmount(() => {
    tipHandlers?.dispose()
    releaseTip()
  })

  if (isDev) {
    if (keyless.value) {
      console.warn(
        '[MUSSEL:SideMenu]',
        `Node is missing the "${keyProp.value}" field and has been skipped:`,
        props.node
      )
    } else if (props.level > 2) {
      warnDeepLevel()
    }
  }
</script>
