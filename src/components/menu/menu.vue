<template>
  <nav
    :class="['mu-menu', disabled && 'mu-menu--disabled']"
    :inert="disabled || null"
    @sizechange="onSizeChange">
    <div ref="barEl" class="mu-menu__bar">
      <menu-item
        v-for="(item, index) in visibleItems"
        :key="item.id ?? index"
        :item="item"
        top
        @item-enter="onItemEnter(item, $event)"
        @item-leave="onItemLeave(item)" />
      <div
        v-if="hasOverflow"
        ref="moreEl"
        class="mu-menu-item mu-menu__more"
        group
        :active="overflowActive || null"
        :title="t('Menu.MORE')"
        @mouseenter="onMoreEnter"
        @mouseleave="onMoreLeave"
        @click="onMoreClick">
        <mu-icon class="mu-menu-item__icon" icon="dots" />
      </div>
    </div>
    <popup-menu
      v-for="i in popupLayerCount"
      :key="i"
      :layer="i - 1" />
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

  const activeItem = defineModel('activeItem', { type: Object })

  const {
    popupLayers,
    popupLayerCount,
    showLayer
  } = usePopupChain()

  const barEl = shallowRef()
  const moreEl = shallowRef()

  const visibleCount = ref(props.items.length)

  const visibleItems = computed(() => props.items.slice(0, visibleCount.value))

  const hasOverflow = computed(() => visibleCount.value < props.items.length)

  // 祖先组对象集合（行「后代激活」高亮的下发数据）；激活目标为组时为空集
  const activePath = computed(() => {
    if (activeItem.value == null) return new WeakSet()

    const path = walkTo(activeItem.value, props.items)

    return path.at(-1)?.items?.length
      ? new WeakSet()
      : new WeakSet(path.slice(0, -1))
  })

  // 激活项落在被折叠子树内 → 触发器高亮（不做激活项豁免，纯顺序折叠）
  const overflowActive = computed(() => {
    const active = activeItem.value

    if (active == null || !hasOverflow.value) return false

    return props.items
      .slice(visibleCount.value)
      .some(item => walkTo(active, [item]).length > 0)
  })

  // 折叠项合成组：走与栏内组行相同的 showLayer 弹层路径，面板内组行逐层级联
  const moreGroup = computed(() => ({
    id: '__overflow__',
    label: t('Menu.MORE'),
    items: props.items.slice(visibleCount.value)
  }))

  // ---------- 一级溢出折叠 ----------
  // 栏行 flex:none 无截断，宽度为内容内在宽：全量帧测量一次入缓存，容器尺寸
  // 变化按缓存直算；宽度漂移不做检测，由 items 变更与 fonts.ready 的全量重测
  // 兜底。宽度缓存按对象键控，折叠行 el 已卸载仍可回查
  const widthCache = new WeakMap()

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

  // 直算可容纳的一级项数：n 项占宽 Σw + gap·(n-1)，n < N 时另计触发器与
  // gap；缓存缺失返回 -1（走全量帧），innerWidth ≤ 0（隐藏挂载）全折叠
  function computeCount () {
    const inner = innerWidth()

    if (inner <= 0) return 0

    const gap = barGap()
    const trigger = triggerWidth() + gap
    const widths = props.items.map(item => widthCache.get(item))

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

  // 全量帧：渲染全部一级项，nextTick 后按下标测宽入缓存再应用收敛结果。
  // 首挂由 sizechange 的 RO 初始回调承担（recompute 缓存缺失转全量帧）
  async function fullMeasure () {
    if (destroyed || !barEl.value) return

    const gen = ++generation

    visibleCount.value = props.items.length
    await nextTick()

    if (destroyed || gen !== generation || !barEl.value) return

    // 全量帧内 more 触发器不在 DOM，children 与 items 等长同序，按下标配对；
    // 0 宽 = 无布局盒（祖先 display:none）时的假值，视同未测量不写入，保住
    // computeCount 的 -1 兜底
    props.items.forEach((item, i) => {
      const el = barEl.value.children[i]

      if (!el) return

      const width = el.getBoundingClientRect().width

      if (width > 0) widthCache.set(item, width)
    })

    const count = computeCount()

    if (count >= 0) visibleCount.value = count
  }

  // 直算优先：缓存齐备按公式收敛折叠数；缺失（首挂或换 items 引用后未测）转全量帧
  function recompute () {
    if (destroyed || !barEl.value) return

    generation++

    const count = computeCount()

    if (count >= 0) visibleCount.value = count
    else fullMeasure()
  }

  const onSizeChange = throttle(50, recompute, { noLeading: true })

  function onItemEnter (item, itemEl) {
    if (!item.items?.length) return

    if (props.expandTrigger === 'hover' || popupLayers[0]?.visible) {
      showLayer(0, item, itemEl)
    }
  }

  function onItemLeave (item) {
    if (item.items?.length) popupLayers[0]?.delayHide()
  }

  function onMoreEnter () {
    if (props.expandTrigger === 'hover' || popupLayers[0]?.visible) {
      showLayer(0, moreGroup.value, moreEl.value)
    }
  }

  function onMoreLeave () {
    popupLayers[0]?.delayHide()
  }

  // click 触发模式下溢出触发器与主栏组行共用：点击浮出（hover 模式点击不触发）
  function onMoreClick () {
    if (props.expandTrigger === 'click') {
      showLayer(0, moreGroup.value, moreEl.value)
    }
  }

  function onItemClick (item, { anchorEl, top }) {
    emit('itemClick', item)

    if (item.items?.length) {
      if (top && props.expandTrigger === 'click') showLayer(0, item, anchorEl)
    } else {
      popupLayers[0]?.hide()
      activeItem.value = item
    }
  }

  watch(() => props.items, fullMeasure)

  provide('menu', {
    direction: 'horizontal',
    activeItem,
    activePath,
    barExpandIcon: computed(() => props.expandIcon),
    onItemClick
  })

  onMounted(() => {
    // webfont 迟到导致字宽变化，fonts.ready 后全量重测一次
    document.fonts?.ready.then(() => fullMeasure())
  })

  onUnmounted(() => {
    destroyed = true
  })
</script>
