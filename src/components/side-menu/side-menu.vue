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
      <template v-for="(node, index) in topItems" :key="node.id ?? index">
        <menu-item
          :node="node"
          :rail="isCollapsed"
          :expanded="isExpanded(node)"
          @item-enter="onItemEnter(node, 0, $event)"
          @item-leave="onItemLeave(node)"
          @row-click="onRowClick(node, 0)"
          @favorite-toggle="toggleFavorite(node)" />
        <div
          v-if="(node.isFavoriteGroup || node.id != null) && node.items?.length && !isCollapsed"
          class="mu-menu-group"
          :expanded="isExpanded(node) || null">
          <div class="overflow-hidden" :inert="!isExpanded(node) || null">
            <menu-item
              v-for="(child, childIndex) in node.items"
              :key="child.id ?? childIndex"
              :node="child"
              :level="1"
              :group="node"
              @item-enter="onItemEnter(child, 1, $event)"
              @item-leave="onItemLeave(child)"
              @row-click="onRowClick(child, 1)"
              @favorite-toggle="toggleFavorite(child)" />
          </div>
        </div>
      </template>
    </mu-scroll-box>
    <div v-if="!isCollapsed && $slots.footer" class="mu-side-menu__footer">
      <slot name="footer" :collapsed="isCollapsed" />
    </div>
    <popup-menu
      v-for="i in popupLayerCount"
      :key="i"
      :layer="i - 1"
      @row-click="onPopupRowClick"
      @favorite-toggle="toggleFavorite" />
  </nav>
</template>

<script setup>
  import './side-menu.scss'

  import { shallowRef, computed, provide, onMounted, watch, watchEffect, nextTick, ref, reactive } from 'vue'

  import { t } from '@/langs'
  import { usePopupChain } from './popup-chain'
  import { walk, walkTo } from './tree.js'

  import MenuItem from './menu-item.vue'
  import PopupMenu from './popup-menu.vue'

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
    showLayer
  } = usePopupChain()

  const rootEl = shallowRef()

  const expandedNodes = new WeakSet()
  const expandTick = ref(0)

  function isExpanded (node) {
    void expandTick.value
    return expandedNodes.has(node)
  }

  function setExpanded (node, value) {
    if (!node || expandedNodes.has(node) === value) return

    if (value) expandedNodes.add(node)
    else expandedNodes.delete(node)

    expandTick.value++
  }

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

  // 收藏内置组：常驻内部节点，无 id（不参与激活 / 滚动定位）。reactive 使
  // items 直驱更新，引用稳定使展开态不随收藏变化丢失；isFavoriteGroup
  // 标记下发收藏组识别（宿主组行为分派、行 data-key 置空与无 id 渲染豁免）
  const favoritesGroup = reactive({
    isGroup: true,
    isFavoriteGroup: true,
    icon: 'star',
    label: t('SideMenu.FAVORITES'),
    items: []
  })

  const topItems = computed(() => favoritesSet.value
    ? [favoritesGroup, ...props.items]
    : props.items
  )

  // 祖先组 key 集合（组头「后代激活」态的下发数据）；激活目标为组 key 时为空集
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

  // 组行为浮出锚点（折叠态一级组 / 展开态二级组）时浮出链头弹层；锚点行取
  // event.currentTarget（上报链同步，仍在原生事件派发中）
  function onItemEnter (node, level, event) {
    if (!node.items?.length) return

    if (isCollapsed.value ? level === 0 : level === 1) {
      showLayer(0, event.currentTarget, node)
    }
  }

  function onItemLeave (node) {
    if (node.items?.length) popupLayers[0]?.delayHide()
  }

  // 叶子选中并收链头；组行仅展开态一级组内联展开（收藏组头恒组，空组亦不
  // 当叶子），rail 组行与展开态二级组行点击无动作（hover 驱动浮出）
  function onRowClick (node, level) {
    emit('itemClick', node)

    if (node.isFavoriteGroup || node.items?.length) {
      if (!isCollapsed.value && !level) toggleExpand(node)
    } else {
      onSelectItem(node)
    }
  }

  // 弹层内行点击分派（popup-menu 转发）：叶子选中并收整链，组行 hover
  // 驱动下钻、点击无动作
  function onPopupRowClick (node) {
    emit('itemClick', node)

    if (!node.items?.length) onSelectItem(node)
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

  // accordion 下展开时互斥同级（含收藏内置组）
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

  watchEffect(() => {
    favoritesGroup.items = favoriteItems.value
  })

  watch(() => props.items, resetItemsStatus)
  watch(activeItem, syncActive)
  watch(isCollapsed, () => popupLayers[0]?.hide())

  onMounted(resetItemsStatus)

  provide('menu', {
    direction: 'vertical',
    activeItem,
    activePath,
    favoritesSet
  })
</script>
