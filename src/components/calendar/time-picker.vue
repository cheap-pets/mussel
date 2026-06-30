<template>
  <div class="mu-time-picker">
    <div class="mu-time-picker__header">
      <span>{{ $t('Datetime.HOUR') }}</span>
      <span>{{ $t('Datetime.MINUTE') }}</span>
      <span>{{ $t('Datetime.SECOND') }}</span>
    </div>
    <div class="mu-time-picker__body">
      <div class="mu-time-picker__flag">
        <span />
        <span style="flex: none">:</span>
        <span />
        <span style="flex: none">:</span>
        <span />
      </div>
      <div class="mu-time-picker__hour-col" @scroll.passive="onScrollEnd('hour', $event)">
        <a v-for="(h, idx) in hours" :key="idx" :disabled="!h || null" @click="scrollToCenter">
          {{ h }}
        </a>
      </div>
      <div class="mu-time-picker__minute-col" @scroll.passive="onScrollEnd('minute', $event)">
        <a v-for="(m, idx) in minutes" :key="idx" :disabled="!m || null" @click="scrollToCenter">
          {{ m }}
        </a>
      </div>
      <div class="mu-time-picker__second-col" @scroll.passive="onScrollEnd('second', $event)">
        <a v-for="(s, idx) in seconds" :key="idx" :disabled="!s || null" @click="scrollToCenter">
          {{ s }}
        </a>
      </div>
    </div>
    <div class="mu-time-picker__footer">
      <mu-button :caption="$t('Button.OK')" button-style="text" color="primary" size="small" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { t as $t } from '@/langs'

  defineOptions({ name: 'MusselTimePicker' })

  const model = defineModel({ type: Object })

  const props = defineProps({
    format: { type: String, default: 'HH:mm' },
    minuteStep: { type: Number, default: 5, validator: v => [0, 1, 5, 10, 15, 30].includes(v) },
    secondStep: { type: Number, default: 0, validator: v => [0, 1, 5, 10, 15, 30].includes(v) }
  })

  const hour = ref(0)
  const minute = ref(0)
  const second = ref(0)

  function padZero (n) {
    return String(n).padStart(2, '0')
  }

  function getItems (step) {
    return step
      ? Array.from({ length: Math.ceil(60 / step) }, (_, i) => padZero(i * step))
      : ['00']
  }

  function padItems (items) {
    return ['', '', ...items, '', '']
  }

  const hours = padItems(Array.from({ length: 24 }, (_, i) => padZero(i)))
  const minutes = computed(() => padItems(getItems(props.minuteStep)))
  const seconds = computed(() => padItems(getItems(props.secondStep)))

  // 点击某一项时，将其平滑滚动到所在列的视口中心
  function scrollToCenter (e) {
    const el = e.currentTarget
    const col = el.parentElement
    const targetTop = el.offsetTop - (col.clientHeight - el.offsetHeight) / 2

    col.scrollTo({ top: targetTop, behavior: 'smooth' })
  }

  // 读取视口正中的有效项，将其数值写入对应 ref
  const targets = { hour, minute, second }
  const scrollTimers = new WeakMap()

  function onScrollEnd (key, e) {
    const col = e.currentTarget
    clearTimeout(scrollTimers.get(col))
    scrollTimers.set(col, setTimeout(() => {
      const items = col.querySelectorAll(':scope > a:not([disabled])')
      const center = col.clientHeight / 2
      let nearest = null
      let minOffset = Infinity
      items.forEach(item => {
        const mid = item.offsetTop - col.scrollTop + item.offsetHeight / 2
        const offset = Math.abs(mid - center)
        if (offset < minOffset) {
          minOffset = offset
          nearest = item
        }
      })
      if (nearest) targets[key].value = Number(nearest.textContent)
    }, 150))
  }
</script>

<style>
  .mu-time-picker {
    --cell-height: 32px;

    width: 200px;
    background-color: var(--mu-bg-normal);
  }

  .mu-time-picker__header {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 32px;
    border-radius: var(--mu-common-border-radius);

    background-color: var(--mu-bg-strong);

    & > span {
      flex: 1 1 0;
      text-align: center;
    }
  }

  .mu-time-picker__body {
    position: relative;

    overflow: visible;
    display: flex;
    align-items: stretch;

    width: 100%;
    height: calc(var(--cell-height) * 5);

    & > .mu-time-picker__flag {
      position: absolute;
      top: calc(var(--cell-height) * 2);
      right: 0;
      left: 0;

      display: flex;
      align-items: center;

      height: var(--cell-height);
      border-radius: var(--mu-common-border-radius);

      background-color: var(--mu-primary-translucent);

      & > span {
        flex: 1 1 0;
      }
    }

    & > div {
      scroll-behavior: smooth;
      scrollbar-width: none;
      scroll-snap-type: y mandatory;

      position: relative;
      z-index: 1;

      overflow: auto;
      flex: 1 1 0;

      &::-webkit-scrollbar {
        display:none;
      }

      & > a {
        cursor: pointer;
        scroll-snap-align: center;

        display: flex;
        align-items: center;
        justify-content: center;

        height: var(--cell-height);
        border-radius: var(--mu-common-border-radius);

        &:hover {
          color: var(--mu-primary-color);
        }

        &[disabled] {
          pointer-events: none;
          scroll-snap-align: none;
        }
      }
    }
  }

  .mu-time-picker__footer {
    z-index: 1;
    height: 32px;
    text-align: right;
  }
</style>
