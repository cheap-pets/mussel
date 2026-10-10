<template>
  <div v-if="!keyless" class="mu-side-menu__node">
    <div
      class="mu-side-menu__item"
      :style="{ '--mu-side-menu_level': level }"
      :inert="isDisabled || null"
      :active="isRowActive || null"
      :group="isGroup || null"
      :expanded="(!popupRow && expanded) || null"
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
    <div v-if="isGroup && !popupRow" class="mu-side-menu__group" :expanded="expanded || null">
      <div class="mu-side-menu__sublist" :inert="!expanded || null">
        <side-menu-node
          v-for="(child, index) in node.items"
          :key="child.id ?? index"
          :node="child"
          :level="level + 1"
          :in-favorites="inFavoritesGroup"
          @item-enter="onChildItemEnter"
          @item-leave="onChildItemLeave" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, shallowRef, inject } from 'vue'

  import { FAVORITES_KEY, warnDeepLevel } from './side-menu'
  import { isDev } from '@/env'

  defineOptions({ name: 'MusselSideMenuNode' })

  const props = defineProps(['node', 'level', 'inFavorites', 'expanded'])
  const emit = defineEmits(['itemEnter', 'itemLeave'])
  const menu = inject('sideMenu')

  const { collapsed, popup, activeItem, activePath } = menu

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

  const expandIcon = computed(() => {
    if (!isGroup.value || railMode.value) return null

    return (popupRow.value || !props.expanded)
      ? 'chevronRight'
      : 'chevronDown'
  })

  const keyless = computed(() => node.value.id == null)
  const starred = computed(() => !!menu.favoritesSet.value?.has(node.value.id))

  const showFavoriteBtn = computed(() =>
    !!menu.favoritesSet.value &&
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
      menu.toggleExpand(props.node)
    }
  }

  // popupRow 行 hover 上报 itemEnter(itemLeave)：node 随事件携带（内联子树
  // 行经转发上报，外层循环变量取不到该行 node），锚点行由父级取自
  // event.currentTarget；由 side-menu / 所在弹层处理下级浮出与待关。tooltip
  // 已由原生 title 属性替代。主树锚点为折叠态一级组 / 展开态二级组（R2 定稿），
  // 弹层内组行逐层级联

  function onMouseEnter (event) {
    if (isDisabled.value) return

    // 同步检测并更新响应式 overflowed，浏览器 title 计时从指针进入起算，同步赋值不误显示时机
    if (!railMode.value) checkOverflow()

    if (popupRow.value) {
      emit('itemEnter', props.node, event)
    }
  }

  function onMouseLeave (event) {
    if (popupRow.value) {
      emit('itemLeave', event)
    }
  }

  // 主树内联子树（展开态二级组行）的上报逐级转发至 side-menu
  function onChildItemEnter (childNode, event) {
    emit('itemEnter', childNode, event)
  }

  function onChildItemLeave (event) {
    emit('itemLeave', event)
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
