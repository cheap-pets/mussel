<template>
  <div ref="rootEl" class="mu-toolbar mu-pagination" @sizechange="onSizeChange">
    <mu-icon-button
      icon="chevronLeft"
      button-style="text"
      :title="$t('Pagination.PREV_PAGE')"
      :disabled="pageIndex < 1 || null"
      @click="goto(pageIndex - 1)" />
    <template v-for="el in pages">
      <span v-if="['L', 'R'].includes(el)" :key="`···-${el}`">···</span>
      <mu-button
        v-else
        :key="`num-${el}`"
        button-style="text"
        :active="el === pageIndex || null"
        :caption="String(el + 1)"
        @click="goto(el)" />
    </template>
    <label v-if="middleText">{{ middleText }}</label>
    <mu-icon-button
      icon="chevronRight"
      button-style="text"
      :title="$t('Pagination.NEXT_PAGE')"
      :disabled="pageIndex >= count - 1 || null"
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
  import { ref, computed, provide, inject, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { throttle } from 'throttle-debounce'
  import { t as $t } from '@/langs'

  defineOptions({ name: 'MusselPagination' })

  const props = defineProps({
    quickJumper: Boolean,
    pageSizeOptions: Array,
    pageIndex: { type: Number, default: 0 },
    pageSize: { type: Number, default: 20 },
    total: { type: Number, default: 0 },
    size: { type: String, validator: v => ['small', 'normal'].includes(v) }
  })

  const emit = defineEmits([
    'update:page-index',
    'update:page-size'
  ])

  const rootEl = ref(null)
  const injectedToolSize = inject('toolSize', {})
  const effectiveSize = computed(() => props.size || injectedToolSize.value)

  provide('toolSize', effectiveSize)

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

  // 整行内容宽：直接子元素 rect 跨度（含 gap 与 margin）。
  // label 带 overflow:hidden，行溢出时被压缩出省略号、rect 跨度随之缩小，
  // 须补回被裁剪宽度；首尾子元素 margin 计入 flex 行外尺寸（负自由空间
  // 按含 margin 计算），漏算则临界宽度下 label 仍会被压出省略号
  function contentWidth () {
    const children = rootEl.value.children

    let min = Infinity
    let max = -Infinity
    let clipped = 0

    for (const el of children) {
      const rect = el.getBoundingClientRect()

      if (rect.left < min) min = rect.left
      if (rect.right > max) max = rect.right

      if (el.tagName === 'LABEL') {
        const range = document.createRange()
        range.selectNodeContents(el)
        clipped += Math.max(0, range.getBoundingClientRect().width - rect.width)
      }
    }

    const first = getComputedStyle(children[0])
    const last = getComputedStyle(children[children.length - 1])

    return max - min + clipped + parseFloat(first.marginLeft) + parseFloat(last.marginRight)
  }

  function innerWidth () {
    const el = rootEl.value
    const style = getComputedStyle(el)

    return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  }

  // 收敛代数：新的 calculateButtons 使进行中的旧循环作废
  let generation = 0
  let destroyed = false

  // 从 11 向下收敛到首个放得下的奇数档；都放不下则 0（降级文本模式）。
  // t 限奇数：pages 算法 n=(t-3)/2 对偶数 t 产生半整数页码
  async function calculateButtons () {
    if (destroyed || !rootEl.value) return

    const gen = ++generation

    if (innerWidth() <= 0) {
      maxPageButtonsCount.value = 0
      return
    }

    for (const t of [11, 9, 7]) {
      maxPageButtonsCount.value = t
      await nextTick()

      if (destroyed || gen !== generation || contentWidth() <= innerWidth()) return
    }

    maxPageButtonsCount.value = 0
  }

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

  const onSizeChange = throttle(50, calculateButtons, { noLeading: true })

  watch(
    [effectiveSize, sizeOptions, () => props.quickJumper, count, () => props.pageIndex, () => props.pageSize],
    () => calculateButtons()
  )

  onMounted(() => {
    document.fonts?.ready.then(calculateButtons)
  })

  onUnmounted(() => {
    destroyed = true
  })
</script>

<style>
  .mu-pagination {
    gap: var(--mu-half-spacing);
    justify-content: center;
    font-size: var(--mu-font-size-small);

    & > label {
      overflow: hidden;
      margin: 0 var(--mu-half-spacing);
      text-overflow: ellipsis;
      white-space: nowrap;
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
