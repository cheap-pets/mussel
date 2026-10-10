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
        v-for="(node, index) in topItems"
        :key="node.id ?? index"
        :node="node"
        :level="0"
        :expanded="isExpanded(node)"
        class="mu-side-menu__node--top"
        @item-enter="onNodeItemEnter"
        @item-leave="onNodeItemLeave" />
    </mu-scroll-box>
    <div v-if="!isCollapsed && $slots.footer" class="mu-side-menu__footer">
      <slot name="footer" :collapsed="isCollapsed" />
    </div>
    <!-- 弹层链：全部层级实例统一挂在本组件下，不逐层嵌套自引用；按层序惰性生成，生成后常驻复用 -->
    <side-menu-popup
      v-for="i in popupLayerCount"
      :key="i"
      :ref="el => setLayer(i - 1, el)"
      :layer="i - 1" />
  </nav>
</template>

<script setup>
  import './side-menu.scss'

  import { shallowRef, computed, provide, onMounted, watch, nextTick } from 'vue'

  import { t } from '@/langs'
  import { usePopupChain } from './popup-chain'
  import { FAVORITES_KEY, useSideMenuExpand, walk, walkTo } from './side-menu'

  import SideMenuNode from './side-menu-node.vue'
  import SideMenuPopup from './side-menu-popup.vue'

  defineOptions({ name: 'MusselSideMenu' })

  const props = defineProps({
    rail: Boolean,
    disabled: Boolean,
    accordion: Boolean,
    autoExpandTop: Boolean,
    collapseButton: Boolean,
    items: { type: Array, default: () => [] },
    width: { type: [String, Number], default: '240px' }
  })

  const emit = defineEmits(['select', 'itemClick', 'favoriteToggle'])

  const activeItem = defineModel('activeItem', { type: [String, Number] })
  const collapsed = defineModel('collapsed', { type: Boolean })
  const favorites = defineModel('favorites', { type: Array, default: () => [] })

  const {
    popupLayers,
    popupLayerCount,
    setLayer,
    showLayer
  } = usePopupChain()

  const rootEl = shallowRef()

  const { isExpanded, setExpanded } = useSideMenuExpand()

  const isCollapsed = computed(() => props.rail || !!collapsed.value)

  const favoritesSet = computed(() =>
    Array.isArray(favorites.value)
      ? new Set(favorites.value)
      : null
  )

  const favoriteItems = computed(() => {
    if (!favoritesSet.value) return []

    const set = favoritesSet.value
    const result = []

    walk(props.items, 0, node => {
      if (!node.items?.length && set.has(node.id)) result.push(node)
    })

    return result
  })

  // 顶层列表（含收藏内置组）：accordion 互斥的同级集合
  const topItems = computed(() => [
    {
      id: FAVORITES_KEY,
      icon: 'star',
      label: t('SideMenu.FAVORITES'),
      items: favoriteItems.value
    },
    ...props.items
  ])

  // 激活项在原树中的祖先组 key 集合：组头「后代激活」半强度态的下发数据，
  // 替代各节点各自递归子树的判定；激活目标为组 key 时无后代激活语义（激活目标是叶子）
  const activePath = computed(() => {
    if (activeItem.value == null) return new Set()

    const path = walkTo(activeItem.value, props.items)

    return path.at(-1)?.items?.length
      ? new Set()
      : new Set(path.slice(0, -1).map(node => node.id))
  })

  function onSelectItem (node) {
    popupLayers[0]?.hide()
    activeItem.value = node.id
  }

  function onItemClick (node) {
    emit('itemClick', node)
  }

  // 主树 popupRow 行（折叠态一级组 / 展开态二级组）hover：浮出 / 待关链头
  // 弹层。node 随事件携带（内联子树行经转发上报，循环变量取不到该行 node）；
  // 锚点行取 event.currentTarget（上报链同步，读值时仍在原生事件派发中）
  function onNodeItemEnter (node, event) {
    showLayer(0, event.currentTarget, node)
  }

  function onNodeItemLeave () {
    popupLayers[0]?.delayHide()
  }

  function toggleFavorite (node) {
    const set = favoritesSet.value
    if (!set) return

    const key = node.id
    const favorited = !set.has(key)

    favorites.value = favorited
      ? [...set, key]
      : favorites.value.filter(item => item !== key)

    emit('favoriteToggle', node, favorited)
  }

  // 一级组展开 toggle：accordion 下展开时互斥同级（含收藏内置组）。
  // 仅展开态主树的一级组行走此路径，二级及以下为弹层行无内联展开
  function toggleExpand (node) {
    if (isExpanded(node)) {
      setExpanded(node, false)
      return
    }

    if (props.accordion) {
      topItems.value.forEach(sibling => {
        if (sibling !== node && sibling.items?.length) setExpanded(sibling, false)
      })
    }

    setExpanded(node, true)
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

    // 仅一级祖先有内联展开态：二级及以下为弹层行，展开无面板呈现
    const top = path.length > 1 && !isExpanded(path[0]) ? path[0] : null

    if (top) toggleExpand(top)

    nextTick(() => {
      const run = () => scrollToKey(activeItem.value)

      // 首挂载延迟 100ms 避开初始渲染抖动；组刚展开时等动画结束再滚，
      // 否则 scrollIntoView 按动画中间态计算会错位
      if (firstScroll) {
        firstScroll = false
        setTimeout(run, 100)
      } else if (top) {
        setTimeout(run, 200)
      } else {
        run()
      }
    })
  }

  function resetItemsStatus () {
    if (!props.autoExpandTop || !props.items.length) return

    topItems.value.forEach(node => node.items?.length && setExpanded(node, true))
    nextTick(syncActive)
  }

  watch(() => props.items, resetItemsStatus)
  watch(activeItem, syncActive)
  watch(isCollapsed, () => popupLayers[0]?.hide())

  onMounted(resetItemsStatus)

  const menuContext = {
    popup: false,
    collapsed: isCollapsed,

    activeItem,
    activePath,

    favoritesSet,
    toggleFavorite,
    toggleExpand,

    onSelectItem,
    onItemClick
  }

  provide('sideMenu', menuContext)
</script>
