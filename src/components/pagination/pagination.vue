<template>
  <div
    class="mu-toolbar mu-pagination"
    :class="toolbarClass"
    @sizechange="calcMaxPageButtonsCount">
    <mu-icon-button
      icon="chevronLeft"
      :title="$t('Pagination.PREV_PAGE')"
      :disabled="pageIndex < 1 || null"
      @click="goto(pageIndex - 1)" />
    <template v-for="el in pages">
      <span v-if="['L', 'R'].includes(el)" :key="`···-${el}`">···</span>
      <mu-button
        v-else
        :key="`num-${el}`"
        :active="el === pageIndex || null"
        :button-style="buttonStyle"
        :caption="String(el + 1)"
        @click="goto(el)" />
    </template>
    <label v-if="middleText">{{ middleText }}</label>
    <mu-icon-button
      icon="chevronRight"
      :title="$t('Pagination.NEXT_PAGE')"
      :disabled="pageIndex === count - 1 || null"
      @click="goto(pageIndex + 1)" />
    <template v-if="sizeOptions?.length">
      <div class="flex-divider" />
      <mu-dropdown-button
        class="mu-pagination__size-select"
        button-style="normal"
        :caption="`${pageSize} ${$t('Pagination.PER_PAGE')}`"
        :dropdown-items="sizeOptions"
        @dropdown:itemclick="onSizeItemClick" />
    </template>
    <label v-else-if="pageSize && !middleText">{{ `${pageSize} ${$t('Pagination.PER_PAGE')}` }}</label>
    <template v-if="quickJumper">
      <label>{{ $t('Pagination.GOTO') }}</label>
      <mu-input class="mu-pagination__quick-jumper" @keydown.enter="jump" />
      <label>{{ $t('Pagination.PAGE') }}</label>
    </template>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { throttle } from 'throttle-debounce'

  import { t as $t } from '@/langs'
  import { toolbarProps, useToolbar } from '../bar/toolbar.js'

  defineOptions({ name: 'MusselPagination' })

  const props = defineProps({
    ...toolbarProps,
    quickJumper: Boolean,
    pageSizeOptions: Array,
    pageIndex: { type: Number, default: 0 },
    pageSize: { type: Number, default: 20 },
    total: { type: Number, default: 0 },
    size: {
      type: String,
      validator: v => ['small', 'normal'].includes(v)
    }
  })

  const emit = defineEmits([
    'update:page-index',
    'update:page-size'
  ])

  const { toolbarClass } = useToolbar(props)

  const maxPageButtonsCount = ref(0)

  // 总页数：由 记录总数 / 每页大小 派生
  const count = computed(() =>
    props.pageSize ? Math.ceil(props.total / props.pageSize) : 0
  )

  const sizeOptions = computed(() =>
    props.pageSizeOptions?.map(value => ({ action: value, label: `${value} ${$t('Pagination.PER_PAGE')}` }))
  )

  const pages = computed(() => {
    const c = count.value
    const i = props.pageIndex
    const t = maxPageButtonsCount.value

    if (!c || !t) return
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
    if (!sizeOptions.value?.length && props.pageSize) {
      return $t('Pagination.CURRENT_AND_SIZE', props.pageIndex + 1, props.pageSize)
    }

    // 有 total: "第 X 页，共 Z 页"
    if (count.value) {
      return $t('Pagination.CURRENT_AND_TOTAL', props.pageIndex + 1, count.value)
    }

    // 只有当前页: "第 X 页"
    return $t('Pagination.CURRENT', props.pageIndex + 1)
  })

  const calcMaxPageButtonsCount = throttle(
    50,
    event => {
      const clientWidth = event.target.clientWidth
      const btnWidth = props.size === 'small' ? 28 : 32
      const w = clientWidth - 16 - (sizeOptions.value ? 105 : (props.pageSize ? 55 : 0)) - (props.quickJumper ? 115 : 0)
      const t = w / (btnWidth + 5) - 4

      maxPageButtonsCount.value = t >= 11 ? 11 : (t >= 9 ? 9 : (t >= 7 ? 7 : 0))
    },
    { noLeading: true }
  )

  function goto (pageIndex) {
    emit('update:page-index', pageIndex)
  }

  function jump (event) {
    const i = parseInt(event.target.value)

    if (isNaN(i) || i < 1 || i > count.value) event.target.value = ''
    else goto(i - 1)
  }

  function onSizeItemClick (item) {
    emit('update:page-size', item.action)
  }

  watch(() => props.size, calcMaxPageButtonsCount)
</script>

<style>
  .mu-pagination {
    gap: var(--mu-half-spacing);
    justify-content: center;
    font-size: var(--mu-font-size-small);

    & > label {
      margin: 0 4px;
    }

    & > .mu-button {
      padding: 0 3px;
    }

    & > .mu-button,
    & > .mu-input {
      flex: none;
      font-size: inherit;
    }

    & > .flex-divider {
      margin: 0 var(--mu-half-spacing);
    }

    & > .mu-pagination__size-select {
      min-width: 80px;
    }

    & > .mu-pagination__quick-jumper {
      width: 50px;
      padding: 0 7px;

      & > input {
        text-align: center;

        &:focus {
          text-align: left;
        }
      }
    }
  }
</style>
