<template>
  <div class="mu-time-picker">
    <div class="mu-time-picker__header">
      <span>{{ $t('Datetime.HOUR') }}</span>
      <span>{{ $t('Datetime.MINUTE') }}</span>
      <span>{{ $t('Datetime.SECOND') }}</span>
    </div>
    <div ref="body" class="mu-time-picker__body">
      <div class="mu-time-picker__flag">
        <span>:</span>
        <span>:</span>
      </div>
      <div
        v-for="key in ['hour', 'minute', 'second']"
        :key="key"
        :class="['mu-time-picker__col', `mu-time-picker__${key}-col`]"
        @scrollend="onScrollEnd(key, $event)">
        <a
          v-for="(v, idx) in columns[key].options"
          :key="idx"
          :active="(v && parseInt(v) === time[key]) || null"
          :disabled="!v || null"
          :data-key="v ? parseInt(v) : undefined"
          @click="scrollToCenter(key, parseInt(v))">
          {{ v }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { shallowRef, reactive, computed, watchEffect, onMounted, onUpdated } from 'vue'
  import { debounce } from 'throttle-debounce'

  import { t as $t } from '@/langs'
  import { timeSteProp } from './props.js'
  import { toTimeObject, toTimeString } from '@/utils/date.js'

  defineOptions({ name: 'MusselTimePicker' })

  const model = defineModel({ type: String })

  const props = defineProps({
    format: { type: String, default: 'HH:mm:ss' },
    minuteStep: timeSteProp,
    secondStep: timeSteProp
  })

  const body = shallowRef()

  const time = reactive({
    hour: 0,
    minute: 0,
    second: 0
  })

  function padZero (n) {
    return String(n).padStart(2, '0')
  }

  function genItems (step) {
    return step
      ? Array.from({ length: Math.ceil(60 / step) }, (_, i) => padZero(i * step))
      : ['00']
  }

  function padItems (items) {
    return ['', '', ...items, '', '']
  }

  const hours = padItems(Array.from({ length: 24 }, (_, i) => padZero(i)))
  const minutes = computed(() => padItems(genItems(props.minuteStep)))
  const seconds = computed(() => padItems(genItems(props.secondStep)))

  const columns = reactive({
    hour: {
      label: $t('Datetime.HOUR'),
      options: hours
    },
    minute: {
      label: $t('Datetime.MINUTE'),
      options: minutes
    },
    second: {
      label: $t('Datetime.SECOND'),
      options: seconds
    }
  })

  function scrollToCenter (key, v) {
    const el = body.value?.querySelector(`.mu-time-picker__${key}-col > a[data-key="${v}"]`)
    if (!el) return

    const col = el.parentElement
    const top = el.offsetTop - (col.clientHeight - el.offsetHeight) / 2

    col.scrollTo({ top, behavior: 'smooth' })
  }

  function onScrollEnd (key, e) {
    const col = e.currentTarget
    const cell = col.firstElementChild.offsetHeight
    const idx = Math.round((col.scrollTop + (col.clientHeight - cell) / 2) / cell)

    time[key] = Number(col.children[idx].textContent)
    model.value = toTimeString(time, props.format)
  }

  const updatePosition = debounce(100, () => {
    ['hour', 'minute', 'second'].forEach(key => scrollToCenter(key, time[key]))
  })

  watchEffect(() => {
    Object.assign(time, toTimeObject(model.value))
  })

  onMounted(updatePosition)
  onUpdated(updatePosition)

  defineExpose({
    updatePosition
  })
</script>

<style>
  .mu-time-picker {
    --cell-height: 32px;

    width: 100%;
    min-width: 180px;
    max-width: 240px;
    background-color: var(--mu-bg-normal);
  }

  .mu-time-picker__header {
    display: flex;
    align-items: center;

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
    user-select: none;

    position: relative;

    display: flex;
    align-items: stretch;

    width: 100%;
    height: calc(var(--cell-height) * 5);

    font-weight: 400;

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

      & > :first-child {
        margin-inline: auto;
      }

      & > :last-child {
        margin-right: auto;
      }
    }

    & > .mu-time-picker__col {
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

        &:hover {
          color: var(--mu-primary-color);
        }

        &[active] {
          font-weight: 600;
          color: var(--mu-primary-color);
        }

        &[disabled] {
          pointer-events: none;
          scroll-snap-align: none;
        }
      }
    }
  }
</style>
