<template>
  <div
    :class="['mu-pagination', small && 'mu-pagination--small']"
    @sizechange="calcMaxPageButtonsCount">
    <mu-button
      button-style="text"
      icon="key-left"
      :title="$t('Pagination.PREV_PAGE')"
      :disabled="disabled || index < 1 || null"
      @click="goto(index - 1)" />
    <template v-for="el in pages">
      <span v-if="['L', 'R'].includes(el)" :key="`···-${el}`">···</span>
      <mu-button
        v-else
        :key="`num-${el}`"
        :active="el === index || null"
        :disabled="disabled || null"
        :button-style="buttonStyle"
        :caption="String(el + 1)"
        @click="goto(el)" />
    </template>
    <label v-if="middleText">{{ middleText }}</label>
    <mu-button
      button-style="text"
      icon="key-right"
      :title="$t('Pagination.NEXT_PAGE')"
      :disabled="disabled || eof || index === count - 1 || null"
      @click="goto(index + 1)" />
    <template v-if="sizeOptions?.length">
      <div class="mu-tool-divider" />
      <mu-combo-box
        class="mu-pagination__size-select"
        :options="sizeOptions"
        :clear-button="false"
        :value="size"
        @change="updatePageSize" />
    </template>
    <label v-else-if="size && !middleText">{{ `${size} ${$t('Pagination.PER_PAGE')}` }}</label>
    <template v-if="quickJumper">
      <label>{{ $t('Pagination.GOTO') }}</label>
      <mu-input class="mu-pagination__quick-jumper" type="number" @keydown.enter="doJump" />
      <label>{{ $t('Pagination.PAGE') }}</label>
    </template>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { throttle } from 'throttle-debounce'
  import { t as $t } from '@/langs'

  defineOptions({ name: 'MusselPagination' })

  const props = defineProps({
    eof: Boolean,
    small: Boolean,
    disabled: Boolean,
    quickJumper: Boolean,
    pageSizeOptions: Array,
    limit: { type: Number },
    offset: { type: Number, default: 0 },
    dataCount: { type: Number, default: 0 },
    pageSize: { type: Number },
    pageIndex: { type: Number },
    pageCount: { type: Number },
    buttonStyle: { type: String, validate: v => ['text', 'normal'].includes(v) }
  })

  const emit = defineEmits([
    'update:limit',
    'update:offset',
    'update:page-size',
    'update:page-index'
  ])

  const maxPageButtonsCount = ref(0)

  const count = computed(() =>
    props.pageCount ?? (props.limit && Math.ceil(props.dataCount / props.limit))
  )

  const index = computed(() =>
    props.pageIndex ?? (props.limit && Math.floor(props.offset / props.limit))
  )

  const size = computed(() =>
    props.pageSize ?? props.limit
  )

  const sizeOptions = computed(() =>
    props.pageSizeOptions?.map(value => ({ value, label: `${value} ${$t('Pagination.PER_PAGE')}` }))
  )

  const pages = computed(() => {
    const c = count.value
    const i = index.value
    const t = maxPageButtonsCount.value

    if (!c || isNaN(i) || !t) return
    if (c <= t + 1) return [...Array(c).keys()]

    const ret = [0]
    const n = (t - 3) / 2
    const min = Math.max(1, Math.min(i - n, c - t + 1))
    const max = min + t - 2

    if (min > 1) ret.push('L')

    Array(t - 2).keys().forEach(idx => ret.push(idx + min))

    if (max < c - 2) ret.push('R')

    ret.push(c - 1)

    return ret
  })

  const middleText = computed(() => {
    if (pages.value?.length) return ''

    // 有 size 且无 sizeOptions: "第 X 页，Y / 页"
    if (!sizeOptions.value?.length && size.value) {
      return $t('Pagination.CURRENT_AND_SIZE', index.value + 1, size.value)
    }

    // 有 total: "第 X 页，共 Z 页"
    if (count.value) {
      return $t('Pagination.CURRENT_AND_TOTAL', index.value + 1, count.value)
    }

    // 只有当前页: "第 X 页"
    return $t('Pagination.CURRENT', index.value + 1)
  })

  const calcMaxPageButtonsCount = throttle(
    50,
    event => {
      const clientWidth = event.target.clientWidth
      const btnWidth = props.small ? 28 : 32
      const w = clientWidth - 16 - (sizeOptions.value ? 105 : (size.value ? 55 : 0)) - (props.quickJumper ? 115 : 0)
      const t = w / (btnWidth + 5) - 4

      maxPageButtonsCount.value = t >= 11 ? 11 : (t >= 9 ? 9 : (t >= 7 ? 7 : 0))
    },
    { noLeading: true }
  )

  function goto (pageIndex) {
    if (!isNaN(props.pageIndex)) emit('update:page-index', pageIndex)
    else if (!isNaN(props.offset)) emit('update:offset', pageIndex * size.value)
  }

  function doJump (event) {
    const i = parseInt(event.target.value)

    if (isNaN(i) || i < 1 || i > count.value) event.target.value = ''
    else goto(i - 1)
  }

  function updatePageSize (pageSize) {
    if (!isNaN(props.pageSize)) emit('update:page-size', pageSize)
    else if (!isNaN(props.limit)) emit('update:limit', pageSize)
  }

  watch(() => props.small, calcMaxPageButtonsCount)
</script>

<style>
  .mu-pagination {
    cursor: default;

    display: flex;
    gap: 5px;
    align-items: center;
    justify-content: center;

    padding: 0 var(--mu-base-spacing);

    font-size: 12px;

    & > label {
      display: inline-block;
      padding: 0 3px;
    }

    & > .mu-button {
      flex: none;
      min-width: var(--mu-common-tool-height);
      padding: 0 4px;
    }

    & .mu-button, & .mu-input {
      font-size: inherit;
    }

    & > .mu-pagination__size-select {
      width: 100px;
    }

    & > .mu-pagination__quick-jumper {
      width: 55px;
      padding: 8px;
      appearance: textfield;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        appearance: none;
      }
    }
  }

  .mu-pagination--small {
    & > .mu-icon-button {
      width: 24px;
      padding: 0;
    }

    & > .mu-button {
      min-width: 24px;
      height: 24px;
    }

    & > .mu-input {
      height: 24px;
    }

    & .mu-tool-divider {
      height: 16px;
    }
  }
</style>
