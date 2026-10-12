<template>
  <nav
    :class="['mu-menu', disabled && 'mu-menu--disabled']"
    :inert="disabled || null"
    @sizechange="onSizeChange">
    <div ref="barEl" class="mu-menu__bar">
      <menu-item
        v-for="(node, index) in barItems"
        :key="node.id ?? index"
        :node="node"
        top
        @item-enter="onItemEnter(node, $event)"
        @item-leave="onItemLeave(node)"
        @row-click="onRowClick(node, $event)" />
      <div
        v-if="hasOverflow"
        ref="moreEl"
        class="mu-menu__more"
        :active="overflowActive || null"
        :title="t('Menu.MORE')"
        @mouseenter="onMoreEnter"
        @mouseleave="onMoreLeave"
        @click="onMoreClick">
        <mu-icon icon="dots" />
      </div>
    </div>
    <popup-menu
      v-for="i in popupLayerCount"
      :key="i"
      :layer="i - 1"
      @row-click="onPopupRowClick" />
  </nav>
</template>

<script setup>
  import './menu.scss'

  import { shallowRef, computed, provide, onMounted, onUnmounted, nextTick, ref, watch } from 'vue'
  import { throttle } from 'throttle-debounce'

  import { t } from '@/langs'
  import { usePopupChain } from './popup-chain'
  import { walkTo } from './tree.js'

  import MenuItem from './menu-item.vue'
  import PopupMenu from './popup-menu.vue'

  defineOptions({ name: 'MusselMenu' })

  const props = defineProps({
    disabled: Boolean,
    items: { type: Array, default: () => [] },
    expandIcon: { type: Boolean, default: true },
    expandTrigger: { type: String, default: 'click' }
  })

  const emit = defineEmits(['itemClick'])

  const activeItem = defineModel('activeItem', { type: [String, Number] })

  const {
    popupLayers,
    popupLayerCount,
    showLayer
  } = usePopupChain()

  const barEl = shallowRef()
  const moreEl = shallowRef()

  const visibleCount = ref(props.items.length)

  const barItems = computed(() => props.items.slice(0, visibleCount.value))

  const hasOverflow = computed(() => visibleCount.value < props.items.length)

  // 祖先组 key 集合（行「后代激活」高亮的下发数据）；激活目标为组 key 时为空集
  const activePath = computed(() => {
    if (activeItem.value == null) return new Set()

    const path = walkTo(activeItem.value, props.items)

    return path.at(-1)?.items?.length
      ? new Set()
      : new Set(path.slice(0, -1).map(node => node.id))
  })

  // 激活项落在被折叠子树内 → 触发器高亮（不做激活项豁免，纯顺序折叠）
  const overflowActive = computed(() => {
    const key = activeItem.value

    if (key == null || !hasOverflow.value) return false

    return props.items
      .slice(visibleCount.value)
      .some(node => walkTo(key, [node]).length > 0)
  })

  // 折叠项合成组：走与栏内组行相同的 showLayer 弹层路径，面板内组行逐层级联
  const overflowNode = computed(() => ({
    id: '__overflow__',
    label: t('Menu.MORE'),
    items: props.items.slice(visibleCount.value)
  }))

  // ---------- 一级溢出折叠 ----------
  // 栏行 flex:none 无截断，宽度为内容内在宽：全量渲染测量一次缓存，容器尺寸
  // 变化按缓存直算；可见行宽度漂移（主题/字号变化类）升级为全量重测
  const widthCache = new Map()

  // 收敛代数：新的测量流程使进行中的旧流程作废（pagination 同款守卫）
  let generation = 0
  let destroyed = false

  function innerWidth () {
    return barEl.value?.clientWidth || 0
  }

  function barGap () {
    const gap = parseFloat(getComputedStyle(barEl.value).gap)

    return Number.isNaN(gap) ? 0 : gap
  }

  // 触发器定宽方形（menu.scss），宽度取行高变量，不参与 DOM 测量。变量默认值
  // 声明在行自身（menu-item.scss），从栏内行读取；无行（全折叠）按默认值兜底
  function triggerWidth () {
    const row = barEl.value?.querySelector('.mu-menu-item')
    const height = row && getComputedStyle(row).getPropertyValue('--mu-menu-item_height')

    return parseFloat(height) || 40
  }

  // 复测当前渲染行宽度入缓存（按行 data-key 关联；触发器无 data-key 跳过）。
  // 返回是否与缓存漂移
  function measureRendered () {
    let drifted = false

    for (const el of barEl.value.children) {
      const key = el.dataset.key

      if (key == null) continue

      const width = el.getBoundingClientRect().width
      const cached = widthCache.get(key)

      if (cached != null && Math.abs(cached - width) > 0.5) drifted = true

      widthCache.set(key, width)
    }

    return drifted
  }

  // 直算可容纳的一级项数：n 项占宽 Σw + gap·(n-1)，n < N 时另计触发器与
  // gap；缓存缺失返回 -1（走全量帧），innerWidth ≤ 0（隐藏挂载）全折叠
  function computeCount () {
    const inner = innerWidth()

    if (inner <= 0) return 0

    const gap = barGap()
    const trigger = triggerWidth() + gap
    const widths = props.items.map(node =>
      node.id == null ? 0 : widthCache.get(String(node.id))
    )

    if (widths.some(w => w == null)) return -1

    let sum = 0
    let count = 0

    for (let i = 0; i < widths.length; i++) {
      sum += widths[i]

      const total = sum + gap * i + (i < widths.length - 1 ? trigger : 0)

      if (total > inner) break

      count = i + 1
    }

    return count
  }

  function applyCount (count) {
    if (count >= 0) visibleCount.value = count
    else fullMeasure()
  }

  // 全量帧：渲染全部一级项，nextTick 后测量再应用收敛结果。首挂由 sizechange
  // 的 RO 初始回调承担（此时全量行已渲染，recompute 即全量测量）
  async function fullMeasure () {
    if (destroyed || !barEl.value) return

    const gen = ++generation

    visibleCount.value = props.items.length
    await nextTick()

    if (destroyed || gen !== generation || !barEl.value) return

    measureRendered()
    applyCount(computeCount())
  }

  function recompute () {
    if (destroyed || !barEl.value) return

    generation++

    if (measureRendered()) {
      fullMeasure()
      return
    }

    applyCount(computeCount())
  }

  const onSizeChange = throttle(50, recompute, { noLeading: true })

  watch(() => props.items, () => {
    widthCache.clear()
    fullMeasure()
  })

  onMounted(() => {
    // webfont 迟到导致字宽变化，fonts.ready 后全量重测一次
    document.fonts?.ready.then(() => fullMeasure())
  })

  onUnmounted(() => {
    destroyed = true
  })

  // ---------- 弹层链 ----------
  // 组行才浮出：click 触发模式下链头未开时 hover 不浮出（首次须点击打开），
  // 已开后 hover 恢复直接切换；hover 模式恒浮出
  function onItemEnter (node, event) {
    if (!node.items?.length) return
    if (props.expandTrigger === 'click' && !popupLayers[0]?.visible) return

    showLayer(0, event.currentTarget, node)
  }

  function onItemLeave (node) {
    if (node.items?.length) popupLayers[0]?.delayHide()
  }

  function onMoreEnter () {
    if (props.expandTrigger === 'click' && !popupLayers[0]?.visible) return

    showLayer(0, moreEl.value, overflowNode.value)
  }

  function onMoreLeave () {
    popupLayers[0]?.delayHide()
  }

  // click 触发模式下溢出触发器与主栏组行共用：点击浮出（hover 模式点击不触发）
  function onMoreClick () {
    if (props.expandTrigger !== 'click') return

    showLayer(0, moreEl.value, overflowNode.value)
  }

  // 叶子选中并收链头；组行 click 触发模式点击浮出，hover 模式点击无动作（hover 已浮出）
  function onRowClick (node, event) {
    emit('itemClick', node)

    if (node.items?.length) {
      if (props.expandTrigger === 'click') showLayer(0, event.currentTarget, node)
    } else {
      popupLayers[0]?.hide()
      activeItem.value = node.id
    }
  }

  // 弹层内行点击分派（popup-menu 转发）：叶子选中并收整链，组行 hover
  // 驱动下钻、点击无动作
  function onPopupRowClick (node) {
    emit('itemClick', node)

    if (!node.items?.length) {
      popupLayers[0]?.hide()
      activeItem.value = node.id
    }
  }

  provide('menu', {
    direction: 'horizontal',
    activeItem,
    activePath,
    barExpandIcon: computed(() => props.expandIcon)
  })
</script>
