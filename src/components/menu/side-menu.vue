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
      <template v-for="(item, index) in topItems" :key="item.id ?? index">
        <menu-item
          top
          :item="item"
          :rail="isCollapsed"
          :class="!index && 'mu-menu-item--first'"
          :expanded="isExpanded(item)"
          @item-enter="onItemEnter(item, 0, $event)"
          @item-leave="onItemLeave(item)" />
        <div
          v-if="item.items?.length && !isCollapsed"
          class="mu-menu-group"
          :expanded="isExpanded(item) || null">
          <div class="overflow-hidden" :inert="!isExpanded(item) || null">
            <menu-item
              v-for="(child, childIndex) in item.items"
              :key="child.id ?? childIndex"
              :item="child"
              :level="1"
              @item-enter="onItemEnter(child, 1, $event)"
              @item-leave="onItemLeave(child)" />
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
      :layer="i - 1" />
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
    items: { type: Array, default: () => [] }
  })

  const emit = defineEmits(['itemClick', 'favoriteToggle'])

  const collapsed = defineModel('collapsed', { type: Boolean })
  const favorites = defineModel('favorites', { type: Array })
  const activeItem = defineModel('activeItem', { type: Object })

  const {
    popupLayers,
    popupLayerCount,
    showLayer
  } = usePopupChain()

  const rootEl = shallowRef()

  const expandedItems = new WeakSet()
  const expandTick = ref(0)

  function isExpanded (item) {
    void expandTick.value
    return expandedItems.has(item)
  }

  function setExpanded (item, value) {
    if (!item || expandedItems.has(item) === value) return

    if (value) expandedItems.add(item)
    else expandedItems.delete(item)

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

    walk(props.items, item => {
      if (!item.items?.length && set.has(item.id)) result.push(item)
    })

    return result
  })

  const favoritesGroup = reactive({
    isGroup: true,
    icon: 'star',
    label: t('SideMenu.FAVORITES'),
    items: []
  })

  const topItems = computed(() => favoritesSet.value
    ? [favoritesGroup, ...props.items]
    : props.items
  )

  // 祖先组对象集合（组头「后代激活」态的下发数据）；激活目标为组时为空集
  const activePath = computed(() => {
    if (activeItem.value == null) return new WeakSet()

    const path = walkTo(activeItem.value, props.items)

    return path.at(-1)?.items?.length
      ? new WeakSet()
      : new WeakSet(path.slice(0, -1))
  })

  function onItemEnter (item, level, itemEl) {
    if (
      item.items?.length &&
      (isCollapsed.value ? level === 0 : level === 1)
    ) {
      showLayer(0, item, itemEl, { showHeader: isCollapsed.value })
    }
  }

  function onItemLeave (item) {
    if (item.items?.length) popupLayers[0]?.delayHide()
  }

  function onItemClick (item, { top }) {
    emit('itemClick', item)

    if (item === favoritesGroup || item.items?.length) {
      if (top && !isCollapsed.value) toggleExpand(item)
    } else {
      popupLayers[0]?.hide()
      activeItem.value = item
    }
  }

  function toggleFavorited (item) {
    const set = favoritesSet.value
    if (!set) return

    const key = item.id
    const favorited = !set.has(key)

    favorites.value = favorited
      ? [...set, key]
      : favorites.value.filter(id => id !== key)

    emit('favoriteToggle', item, favorited)
  }

  // accordion 下展开时互斥同级（含收藏内置组）
  function toggleExpand (item) {
    if (isExpanded(item)) {
      setExpanded(item, false)
      return
    }

    if (props.accordion) {
      topItems.value.forEach(sibling => {
        if (sibling !== item && sibling.items?.length) setExpanded(sibling, false)
      })
    }

    setExpanded(item, true)
  }

  function scrollToActive () {
    const el = [...rootEl.value?.querySelectorAll('.mu-menu-item[active]') ?? []].at(-1)
    const rect = el?.getBoundingClientRect()
    const clipper = el?.closest('.mu-scroll-box')

    if (!rect?.height || !clipper) return

    const clip = clipper.getBoundingClientRect()

    let delta = 0

    if (rect.top < clip.top) delta = rect.top - clip.top
    else if (rect.bottom > clip.bottom) delta = rect.bottom - clip.bottom

    if (delta) clipper.scrollTop += delta
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
      const run = () => scrollToActive()

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

    topItems.value.forEach(item => item.items?.length && setExpanded(item, true))
    nextTick(syncActive)
  }

  provide('menu', {
    direction: 'vertical',
    activeItem,
    activePath,
    favoritesSet,
    toggleFavorited,
    onItemClick
  })

  watchEffect(() => {
    favoritesGroup.items = favoriteItems.value
  })

  watch(activeItem, syncActive)
  watch(isCollapsed, () => popupLayers[0]?.hide())
  watch(() => props.items, resetItemsStatus)

  onMounted(resetItemsStatus)
</script>
