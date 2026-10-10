<template>
  <nav
    ref="rootEl"
    :class="[
      'mu-side-menu',
      disabled && 'mu-side-menu--disabled',
      isCollapsed && 'mu-side-menu--collapsed',
    ]"
    :inert="disabled || null">
    <div class="mu-side-menu__header">
      <slot v-if="!isCollapsed" name="header" />
    </div>
    <mu-scroll-box class="mu-side-menu__body">
      <side-menu-node
        v-if="favoritesEnabled"
        :node="favoritesGroup"
        :level="0" />
      <side-menu-node
        v-for="(node, index) in items"
        :key="node.id ?? index"
        :node="node"
        :level="0" />
    </mu-scroll-box>
    <div v-if="!isCollapsed && $slots.footer" class="mu-side-menu__footer">
      <slot name="footer" :collapsed="isCollapsed" />
    </div>
    <!-- 弹层链：全部层级实例统一挂在本组件下，不逐层嵌套自引用；按层序惰性生成，生成后常驻复用 -->
    <side-menu-popup
      v-for="i in popupLayerCount"
      :key="i"
      :layer="i - 1"
      :ref="el => setPopupLayer(i - 1, el)" />
  </nav>
</template>

<script setup>
  import './side-menu.scss'

  import { ref, shallowRef, shallowReactive, toRef, computed, provide, onMounted, watch, watchEffect, nextTick } from 'vue'

  import { t } from '@/langs'
  import {
    FAVORITES_KEY,
    useSideMenuExpand,
    walk,
    walkTo,
    expandExclusive,
    createExpandToggle
  } from './side-menu'

  import SideMenuNode from './side-menu-node.vue'
  import SideMenuPopup from './side-menu-popup.vue'

  defineOptions({ name: 'MusselSideMenu' })

  const props = defineProps({
    items: { type: Array, default: () => [] },
    rail: Boolean,
    disabled: Boolean,
    accordion: Boolean,
    collapseButton: Boolean,
    autoExpandLevel: Number,
    width: { type: [String, Number], default: '240px' }
  })

  const emit = defineEmits(['select', 'itemClick', 'favoriteToggle'])

  const activeItem = defineModel('activeItem', { type: [String, Number] })
  const collapsed = defineModel('collapsed', { type: Boolean })
  const favorites = defineModel('favorites', { type: Array, default: () => [] })

  // 弹层链实例表（按层序）：非响应式数组，仅命令式访问（show/hide/链式级联）
  const popupLayerCount = ref(1)
  const popupLayers = []

  function setPopupLayer (index, instance) {
    popupLayers[index] = instance
  }

  // 生成或复用层实例并弹出：新层首次触发时先扩容 v-for，待实例挂载后 show
  async function openPopupLayer (index, anchorEl, node) {
    if (popupLayerCount.value <= index) {
      popupLayerCount.value = index + 1
      await nextTick()
    }

    popupLayers[index]?.show(anchorEl, node)
  }

  provide('sideMenuPopupChain', {
    open: openPopupLayer,
    getLayer: index => popupLayers[index]
  })

  const rootEl = shallowRef()

  const { isExpanded, setExpanded } = useSideMenuExpand()

  const isCollapsed = computed(() => props.rail || !!collapsed.value)
  const favoritesEnabled = computed(() => Array.isArray(favorites.value))
  const favoritesSet = computed(() => new Set(favorites.value))

  const favoriteItems = computed(() => {
    if (!favoritesEnabled.value) return []

    const set = favoritesSet.value
    const result = []

    walk(props.items, 0, node => {
      if (!node.items?.length && set.has(node.id)) result.push(node)
    })

    return result
  })

  const favoritesGroup = shallowReactive({
    id: FAVORITES_KEY,
    icon: 'star',
    label: t('SideMenu.FAVORITES'),
    items: []
  })

  // 顶层列表（含收藏内置组）：accordion 互斥的同级集合
  const topList = computed(() => [favoritesGroup, ...props.items])

  // 激活项在原树中的祖先组 key 集合：组头「后代激活」半强度态的下发数据，
  // 替代各节点各自递归子树的判定；激活目标为组 key 时无后代激活语义（激活目标是叶子）
  const activePath = computed(() => {
    if (activeItem.value == null) return new Set()

    const path = walkTo(activeItem.value, props.items)

    return path.at(-1)?.items?.length
      ? new Set()
      : new Set(path.slice(0, -1).map(node => node.id))
  })

  function doAutoExpand () {
    const level = props.autoExpandLevel

    if (!level || !props.items.length) return

    walk(props.items, 1, (node, depth) => {
      if (depth <= level && node.items?.length) setExpanded(node, true)
    })

    setExpanded(favoritesGroup, true)
  }

  function onSelectItem (node) {
    popupLayers[0]?.hide()
    activeItem.value = node.id
  }

  function onItemClick (node) {
    emit('itemClick', node)
  }

  function toggleFavorite (node) {
    const key = node.id
    const favorited = !favoritesSet.value.has(key)

    favorites.value = favorited
      ? [...favoritesSet.value, key]
      : favorites.value.filter(item => item !== key)

    emit('favoriteToggle', node, favorited)
  }

  function scrollToKey (key) {
    if (key == null) return

    const el = rootEl.value?.querySelector(`[data-key="${CSS.escape(String(key))}"]`)

    if (!el?.getBoundingClientRect().height) return

    if (el.scrollIntoViewIfNeeded) el.scrollIntoViewIfNeeded()
    else el.scrollIntoView({ block: 'nearest' })
  }

  let firstScroll = true

  function syncActive () {
    if (activeItem.value == null) return

    const path = walkTo(activeItem.value, props.items)
    const target = path.at(-1)

    if (!target || target.items?.length) return

    let expandedSomething = false

    path.slice(0, -1).forEach((node, index) => {
      if (isExpanded(node)) return

      // 展开前互斥同级已展开组（首层的同级含收藏内置组）
      expandExclusive(
        menuContext,
        index ? path[index - 1].items : topList.value,
        node
      )
      expandedSomething = true
    })

    nextTick(() => {
      const run = () => scrollToKey(activeItem.value)

      // 首挂载延迟 100ms 避开初始渲染抖动；父链刚展开时等组动画结束再滚，
      // 否则 scrollIntoView 按动画中间态计算会错位
      if (firstScroll) {
        firstScroll = false
        setTimeout(run, 100)
      } else if (expandedSomething) {
        setTimeout(run, 200)
      } else {
        run()
      }
    })
  }

  function resetItemsStatus () {
    doAutoExpand()
    nextTick(syncActive)
  }

  watchEffect(() => {
    favoritesGroup.items = favoriteItems.value
  })

  watch(() => props.items, resetItemsStatus)
  watch(activeItem, syncActive)
  watch(isCollapsed, () => popupLayers[0]?.hide())

  onMounted(resetItemsStatus)

  const menuContext = {
    collapsed: isCollapsed,
    popup: false,
    accordion: toRef(props, 'accordion'),

    activeItem,
    activePath,

    isExpanded,
    setExpanded,

    favoritesEnabled,
    favoritesSet,
    toggleFavorite,

    onSelectItem,
    onItemClick,

    openPopup: (anchor, node) => openPopupLayer(0, anchor, node),
    delayPopupHide: () => popupLayers[0]?.delayHide()
  }

  provide('sideMenu', menuContext)

  // 顶层列表的组展开 toggle（含收藏内置组的同级互斥）
  provide('sideMenuExpandToggle', createExpandToggle(menuContext, () => topList.value))
</script>
