<template>
  <div class="mu-time-picker">
    <div
      v-for="unit in units"
      :key="unit.key"
      ref="colRefs"
      class="mu-time-picker__col"
      @scroll.passive="onScroll(unit.key, $event)">
      <div class="mu-time-picker__header">
        {{ unit.label }}
      </div>
      <div class="mu-time-picker__pad" />
      <div class="mu-time-picker__list">
        <a
          v-for="n in unit.items"
          :key="n"
          class="mu-time-picker__item"
          :present="isPresent(unit.key, n) || null"
          :selected="isSelected(unit.key, n) || null"
          @click="onItemClick(unit.key, n)">
          {{ pad(n) }}
        </a>
      </div>
      <div class="mu-time-picker__pad" />
    </div>
  </div>
</template>

<script setup>
  import './time-picker.scss'

  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { t as $t } from '@/langs'

  defineOptions({ name: 'MusselTimePicker' })

  const model = defineModel({ type: Object })

  const props = defineProps({
    type: {
      type: String,
      default: 'minute',
      validator: v => ['minute', 'time'].includes(v)
    },
    minuteStep: { type: Number, default: 5 },
    secondStep: { type: Number, default: 5 }
  })

  const emit = defineEmits(['change'])

  const ITEM_HEIGHT = 32
  const HEADER_HEIGHT = 32

  const colRefs = ref([])
  // 动画锁：程序触发的平滑滚动期间置 true，其产生的 scroll 事件不再触发吸附，避免死循环
  const animatingKeys = new Set()
  // 内部变化标志：滚动/点击自身改的 model 不应再回弹定位，仅外部变化才需要滚动到选中项
  let internalChange = false
  const scrollTimers = {}

  const cur = computed(() => model.value || { hour: 0, minute: 0, second: 0 })

  function genItems (max, step) {
    const arr = []
    for (let i = 0; i < max; i += step) arr.push(i)
    return arr
  }

  const hours = computed(() => genItems(24, 1))
  const minutes = computed(() => genItems(60, props.minuteStep))
  const seconds = computed(() => genItems(60, props.secondStep))

  const units = computed(() => {
    const list = [
      { key: 'hour', label: $t('Time.HOUR'), items: hours.value }
    ]
    list.push({ key: 'minute', label: $t('Time.MINUTE'), items: minutes.value })
    if (props.type === 'time') {
      list.push({ key: 'second', label: $t('Time.SECOND'), items: seconds.value })
    }
    return list
  })

  function pad (n) {
    return String(n).padStart(2, '0')
  }

  function isSelected (key, n) {
    return cur.value[key] === n
  }

  const now = ref(getNow())
  function getNow () {
    const d = new Date()
    return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }
  }
  function isPresent (key, n) {
    return now.value[key] === n
  }

  function onItemClick (key, n) {
    if (cur.value[key] === n) return
    internalChange = true
    model.value = { ...cur.value, [key]: n }
    emit('change', { from: 'click' })
    // 点击后平滑滚到该项
    const items = key === 'hour'
      ? hours.value
      : key === 'minute' ? minutes.value : seconds.value
    const idx = items.indexOf(n)
    const el = colRefs.value[units.value.findIndex(u => u.key === key)]
    if (el && idx >= 0) smoothScrollTo(el, key, idx, items)
  }

  // 取某单位在当前 scrollTop 下最近的合法项 idx
  function getNearestIdx (key, scrollTop) {
    const items = key === 'hour'
      ? hours.value
      : key === 'minute' ? minutes.value : seconds.value
    const idx = Math.round((scrollTop - HEADER_HEIGHT) / ITEM_HEIGHT)
    return {
      items,
      idx: Math.max(0, Math.min(idx, items.length - 1))
    }
  }

  // 平滑滚动到某列的指定 idx，动画期间加锁防 scroll 事件回环
  function smoothScrollTo (el, key, idx, items) {
    const targetTop = HEADER_HEIGHT + idx * ITEM_HEIGHT
    if (Math.abs(el.scrollTop - targetTop) < 1) return

    animatingKeys.add(key)
    el.scrollTo({ top: targetTop, behavior: 'smooth' })

    // 浏览器无 scrollend 或动画被打断时，兜底解锁
    const onEnd = () => animatingKeys.delete(key)
    if ('onscrollend' in el) {
      el.addEventListener('scrollend', onEnd, { once: true })
    }
    setTimeout(onEnd, 500)
  }

  function onScroll (key, e) {
    // 程序触发的吸附动画期间，忽略其产生的 scroll 事件
    if (animatingKeys.has(key)) return

    const el = e.target
    clearTimeout(scrollTimers[key])
    scrollTimers[key] = setTimeout(() => {
      const { items, idx } = getNearestIdx(key, el.scrollTop)
      // 用户停止滚动 → 平滑吸附到最近项
      smoothScrollTo(el, key, idx, items)
      const n = items[idx]
      if (n != null && cur.value[key] !== n) {
        internalChange = true
        model.value = { ...cur.value, [key]: n }
        emit('change', { from: 'scroll' })
      }
    }, 100)
  }

  function scrollToSelected () {
    nextTick(() => {
      units.value.forEach((unit, i) => {
        const el = colRefs.value[i]
        if (!el) return
        const items = unit.items
        const val = cur.value[unit.key]
        // 向下吸附：选不大于 val 的最大项
        let idx = 0
        for (let j = 0; j < items.length; j++) {
          if (items[j] <= val) idx = j
          else break
        }
        smoothScrollTo(el, unit.key, idx, items)
      })
    })
  }

  defineExpose({ scrollToSelected })

  onMounted(scrollToSelected)
  watch(
    () => model.value,
    () => {
      // 内部滚动/点击引起的变化不再回弹定位，避免与进行中的动画冲突
      if (internalChange) {
        internalChange = false
        return
      }
      scrollToSelected()
    },
    { deep: true }
  )
</script>
