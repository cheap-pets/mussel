<template>
  <nav
    ref="rootEl"
    :class="rootClass"
    :style="widthStyle"
    :inert="disabled || null">
    <div class="mu-side-menu__header">
      <slot name="header" :collapsed="collapsed" />
    </div>
    <mu-scroll-box class="mu-side-menu__body">
      <ul class="mu-side-menu__list">
        <side-menu-node
          v-for="(node, index) in rootData"
          :key="node[keyProp] ?? index"
          :node="node"
          :level="0"
          :parent-keys="[]" />
      </ul>
    </mu-scroll-box>
    <div v-if="$slots.footer" class="mu-side-menu__footer">
      <slot name="footer" :collapsed="collapsed" />
    </div>
    <button
      v-if="collapseButton"
      type="button"
      class="mu-side-menu__collapse-button"
      @click="collapsed = !collapsed">
      <mu-icon :icon="collapsed ? 'leftExpand' : 'leftCollapse'" />
    </button>
    <side-menu-popup ref="popupRef" />
  </nav>
</template>

<script setup>
  import './side-menu.scss'

  import {
    computed,
    getCurrentInstance,
    inject,
    nextTick,
    onMounted,
    provide,
    shallowRef,
    toRef,
    watch
  } from 'vue'
  import { resolveSize } from '@/utils/size'
  import { isDev } from '@/env'
  import { t } from '@/langs'

  import { DEFAULT_DATA_PROPS } from './default-options'
  import { FAVORITES_KEY, useSideMenuExpand } from './side-menu'
  import SideMenuNode from './side-menu-node.vue'
  import SideMenuPopup from './side-menu-popup.vue'

  defineOptions({ name: 'MusselSideMenu' })

  const props = defineProps({
    data: Array,
    props: Object,
    defaultExpandAll: Boolean,
    accordion: Boolean,
    width: { type: [String, Number], default: '240px' },
    collapseButton: Boolean,
    disabled: Boolean
  })

  const emit = defineEmits([
    'select',
    'itemClick',
    'groupExpand',
    'groupCollapse',
    'favoriteToggle'
  ])

  const activeItem = defineModel('activeItem', { type: [String, Number] })
  const expandedKeys = defineModel('expandedKeys', { type: Array })
  const collapsed = defineModel('collapsed', { type: Boolean })
  const favorites = defineModel('favorites', { type: Array })

  const $mussel = inject('$mussel')

  // 数据字段映射：逻辑键 → 数据字段名；dev 下未知映射键静默失效难排查，给出告警
  const nodeProps = computed(() => {
    const merged = { ...DEFAULT_DATA_PROPS, ...props.props }

    if (isDev && props.props) {
      Object.keys(props.props).forEach(key => {
        if (!(key in DEFAULT_DATA_PROPS)) {
          console.warn(
            '[MUSSEL:SideMenu]',
            `Unknown props mapping key "${key}", available keys: ` +
              Object.keys(DEFAULT_DATA_PROPS).join(', ')
          )
        }
      })
    }

    return Object.fromEntries(
      Object.entries(merged).filter(([, prop]) => !!prop)
    )
  })

  const keyProp = computed(() => nodeProps.value.key)
  const childProp = computed(() => nodeProps.value.childNodes)

  // 收藏启用条件：绑定 v-model:favorites 且值为数组（含空数组）。
  // "是否绑定"经 vnode props 是否含 onUpdate:favorites 判定，
  // 只传 :favorites 不绑 v-model 不启用——星标 UI 与收藏数据本为一体
  const vnodeProps = getCurrentInstance().vnode.props
  const favoritesBound = 'onUpdate:favorites' in (vnodeProps || {})

  const favoritesEnabled = computed(() =>
    favoritesBound && Array.isArray(favorites.value)
  )

  const favoritedSet = computed(() => new Set(favorites.value || []))

  // 从原树全量提取 key ∈ favorites 的叶子（平铺一级、保留原 key）
  const favoriteItems = computed(() => {
    if (!favoritesEnabled.value) return []

    const set = favoritedSet.value
    const kp = keyProp.value
    const cp = childProp.value
    const result = []

    function walk (nodes) {
      (nodes || []).forEach(node => {
        if (node[cp]?.length) walk(node[cp])
        else if (set.has(node[kp])) result.push(node)
      })
    }

    walk(props.data)
    return result
  })

  // 结构树 = 「我的收藏」内置组（启用时置顶）+ 原数据；
  // 展开状态 / 手风琴以结构树为准，walkTo / expandTo 仍走原树
  const rootData = computed(() => {
    if (!favoritesEnabled.value) return props.data

    return [{
      [keyProp.value]: FAVORITES_KEY,
      [nodeProps.value.icon]: 'star',
      [nodeProps.value.label]: t('SideMenu.FAVORITES'),
      [childProp.value]: favoriteItems.value
    }, ...(props.data || [])]
  })

  function onExpandChange (key, expanded) {
    emit(expanded ? 'groupExpand' : 'groupCollapse', key)
  }

  const {
    isExpanded,
    setExpanded,
    expand,
    collapse,
    expandTo,
    walkTo,
    prune
  } = useSideMenuExpand({
    data: rootData,
    sourceData: toRef(props, 'data'),
    keyProp,
    childProp,
    expandedKeys,
    defaultExpandAll: toRef(props, 'defaultExpandAll'),
    accordion: toRef(props, 'accordion'),
    onChange: onExpandChange
  })

  const popupRef = shallowRef()
  const rootEl = shallowRef()

  function onSelectItem (node, keyPath) {
    activeItem.value = node[keyProp.value]
    emit('select', node, keyPath)
    popupRef.value?.hide()
  }

  function onItemClick (node, keyPath) {
    emit('itemClick', node, keyPath)
  }

  function toggleFavorite (node) {
    const key = node[keyProp.value]
    const favorited = !favoritedSet.value.has(key)

    favorites.value = favorited
      ? [...favoritedSet.value, key]
      : favorites.value.filter(item => item !== key)

    emit('favoriteToggle', node, favorited)
  }

  function scrollToKey (key) {
    if (key == null) return

    // 排除收藏组内的副本行（收藏组在 DOM 上位于原数据之前，命中会滚错上下文）
    const el = rootEl.value?.querySelector(
      `[data-key="${CSS.escape(String(key))}"]:not([data-favorites])`
    )

    if (!el || !el.getBoundingClientRect().height) return

    if (el.scrollIntoViewIfNeeded) el.scrollIntoViewIfNeeded()
    else el.scrollIntoView({ block: 'nearest' })
  }

  let firstScroll = true

  // 激活项父链自动展开 + 滚入视区（激活 key 变化与 data 到达/刷新均触发）
  function syncActive () {
    let expandedSomething = false

    if (activeItem.value != null) {
      const path = walkTo(activeItem.value)

      const missing = path
        .slice(0, -1)
        .map(node => node[keyProp.value])
        .filter(key => !isExpanded(key))

      if (missing.length) {
        expand(...missing)
        expandedSomething = true
      }

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
  }

  // 激活项在原树中的祖先组 key 集合：组头「后代激活」半强度态的下发数据，
  // 替代各节点各自递归子树的判定；激活目标为组 key 时无后代激活语义（激活目标是叶子）
  const activePath = computed(() => {
    if (activeItem.value == null) return new Set()

    const path = walkTo(activeItem.value)

    return path.at(-1)?.[childProp.value]?.length
      ? new Set()
      : new Set(path.slice(0, -1).map(node => node[keyProp.value]))
  })

  // data 变化：清理失效展开 key + 重新定位激活项；激活变化：仅重新定位
  watch(() => props.data, () => {
    prune()
    syncActive()
  })

  watch(activeItem, syncActive)

  onMounted(() => {
    prune()
    syncActive()
  })

  // 折叠切换时先收起弹层与 tooltip，避免宽度过渡期间锚点错位
  watch(collapsed, () => {
    popupRef.value?.hide()

    if ($mussel.tooltip?.isAnchorIn(rootEl.value)) $mussel.tooltip.hide()
  })

  const rootClass = computed(() => [
    'mu-side-menu',
    {
      'mu-side-menu--collapsed': collapsed.value,
      'mu-side-menu--favorites': favoritesEnabled.value,
      'mu-side-menu--disabled': props.disabled
    }
  ])

  const widthStyle = computed(() => ({
    '--mu-side-menu_width': resolveSize(String(props.width))
  }))

  provide('sideMenu', {
    nodeProps,
    keyProp,
    childProp,

    collapsed,
    popup: false,

    activeItem,
    activePath,

    isExpanded,
    setExpanded,

    favoritesEnabled,
    favoritedSet,
    toggleFavorite,

    onSelectItem,
    onItemClick,

    tooltip: $mussel.tooltip,

    openPopup: (anchor, node, keyPath) => popupRef.value?.show(anchor, node, keyPath),
    delayPopupHide: () => popupRef.value?.delayHide()
  })

  defineExpose({
    expand,
    collapse,
    expandTo,
    scrollIntoView (key = activeItem.value) {
      scrollToKey(key)
    }
  })
</script>
