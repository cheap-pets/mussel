<template>
  <div
    ref="rootElement"
    class="mu-big-table"
    :class="[striped && 'mu-big-table--striped', gridlinesClass]"
    :data-empty="!records?.length || null"
    :data-x-overflowed="xOverflowed || null"
    :data-x-scrolled="xScrolled || null"
    :data-y-scrolled="yScrolled || null"
    :data-y-scrolled-end="yScrolledEnd || null"
    @sizechange="onResize">
    <div
      ref="headerWrap"
      class="mu-big-table__header-wrap"
      :style="{ minWidth: tableMinWidth }">
      <div class="mu-big-table__header-row">
        <div
          v-for="col in internalColumns"
          :key="col._key"
          class="mu-big-table__th"
          :class="[col.sortable && 'mu-big-table__th--sortable', col._ctrlClass, col.headerClass]"
          :style="[col._colStyle, col._ctrlStyle, col.headerStyle]"
          @click="onHeaderClick(col)">
          <div
            v-if="col.type === 'check' && col.field && col.headerCheckbox && headerChecked"
            class="mu-table__cell-check"
            :data-checked="headerChecked[col.field] || null"
            @click.stop="onHeaderCheckChange(col, !headerChecked[col.field])">
            ✓
          </div>
          {{ col.caption }}
          <mu-sort-icon v-if="col.sortable" :direction="sortDirection[col.field]" />
        </div>
      </div>
    </div>
    <div
      ref="scrollArea"
      v-mu-scrollbar
      class="mu-big-table__scroll-area"
      :style="{ minWidth: tableMinWidth }"
      @scroll="onScroll"
      @sizechange="onResize">
      <div class="mu-big-table__phantom" :style="{ height: `${totalHeight}px` }" />
      <div
        class="mu-big-table__body"
        :style="{ transform: `translateY(${translateY}px)` }">
        <virtual-row
          v-for="(rec, localIdx) in visibleRecords"
          :key="getRecordKey(rec)"
          :columns="internalColumns"
          :record="rec"
          :record-index="startIndex + localIdx"
          :record-number="recordsOffset + startIndex + localIdx + 1"
          :global-index="startIndex + localIdx"
          :selected="selectedRecKey != null && getRecordKey(rec) === selectedRecKey"
          :striped="striped" />
      </div>
      <div class="mu-big-table__hover-indicator" :data-mode="hoverMode" :style="hoverStyle" />
    </div>
  </div>
</template>

<script setup>
  import { ref, shallowRef, reactive, computed, watch, provide, onBeforeUnmount } from 'vue'
  import { throttle, debounce } from 'throttle-debounce'
  import { autoIncrementKeyBuilder } from '@/utils/key-builder'

  import { ensureFn, getPixelNumber, getCellAlignClass } from '../table/utils'
  import { resolveColumnType } from '../table/column-types'

  import VirtualRow from './virtual-row.vue'

  import './big-table.scss'

  const props = defineProps({
    records: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    recordsOffset: { type: Number, default: 0 },
    headers: Array,
    headerChecked: Object,
    keyField: String,
    fixedLeftColumns: Number,
    orderBy: String,
    striped: Boolean,
    placeholder: String,
    selectedRecord: Object,
    selectedRecordKey: [String, Number],
    hoverMode: {
      default: 'row',
      validator: v => ['none', 'row', 'column', 'cross', 'cell'].includes(v)
    },
    gridlines: {
      default: 'all',
      validator: v => ['none', 'all', 'row', 'column'].includes(v)
    },
    tableMinWidth: { default: '100%' },
    rowHeight: { type: Number, default: 36 },
    overscan: { type: Number, default: 5 }
  })

  const emit = defineEmits([
    'header-click',
    'cell-click',
    'cell-item-click',
    'update:header-checked',
    'update:cell-value',
    'update:selected-record',
    'update:selected-record-key'
  ])

  const rootElement = shallowRef()
  const headerWrap = shallowRef()
  const scrollArea = shallowRef()

  const scrollTop = ref(0)
  const clientHeight = ref(0)

  const fixedColumnsWidth = ref(0)

  const xScrolled = ref(false)
  const yScrolled = ref(false)
  const yScrolledEnd = ref(false)

  const xOverflowed = ref(false)

  const hoverStyle = reactive({
    '--hover-row-top': 0,
    '--hover-row-width': 0,
    '--hover-row-height': 0,
    '--hover-col-top': 0,
    '--hover-col-left': 0,
    '--hover-col-width': 0,
    '--hover-col-height': 0
  })

  const autoRecordKey = autoIncrementKeyBuilder()
  const autoColumnKey = autoIncrementKeyBuilder()

  function getRecordKey (rec) {
    return props.keyField ? rec[props.keyField] : autoRecordKey(rec)
  }

  // --- Virtual scroll computed ---

  const totalHeight = computed(() => props.records.length * props.rowHeight)

  const startIndex = computed(() =>
    Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - props.overscan)
  )

  const endIndex = computed(() =>
    Math.min(
      props.records.length,
      Math.ceil((scrollTop.value + clientHeight.value) / props.rowHeight) + props.overscan
    )
  )

  const visibleRecords = computed(() =>
    props.records.slice(startIndex.value, endIndex.value)
  )

  const translateY = computed(() => startIndex.value * props.rowHeight)

  // --- Sort ---

  const sortDirection = computed(() => {
    if (!props.orderBy) return {}

    const [field, direction] =
      props.orderBy.replace(':', ' ').split(' ')

    return {
      [field]: direction === 'desc' ? 'down' : 'up'
    }
  })

  const selectedRecKey = computed(() =>
    props.selectedRecordKey ?? props.selectedRecord?.[props.keyField || '_key']
  )

  const gridlinesClass = computed(() =>
    `mu-big-table--gridlines-${props.gridlines}`
  )

  // --- Columns ---

  const internalColumns = computed(() => {
    const fixed = props.fixedLeftColumns

    let left = fixed ? 0 : null

    const columns = props.columns.map((el, idx) => {
      const col = { ...el, _raw: el, _key: el.key ?? autoColumnKey(el) }
      const type = resolveColumnType(el.type)

      const { width = type.width, align = type.align } = el

      col._text = ensureFn(el.text)
      col._value = ensureFn(el.value)
      col._title = ensureFn(el.title)
      col._class = ensureFn(el.class)
      col._style = ensureFn(el.style)

      const isAutoWidth = width === 'auto' || (width == null && type.width == null)

      col._colStyle = isAutoWidth
        ? { minWidth: el.minWidth, maxWidth: el.maxWidth, flex: '1 1 auto' }
        : { width, minWidth: el.minWidth, maxWidth: el.maxWidth, flexShrink: 0 }
      col._ctrlClass = [getCellAlignClass(align)]
      col._render = type.compile ? type.compile(el) : (type.render || type)

      if (left != null) {
        const widthPx = getPixelNumber(width)

        col._fixed = true
        col._ctrlStyle = { left: `${left}px` }
        col._ctrlClass.push('fixed-col')

        if (widthPx && idx < fixed) {
          left += widthPx
        } else {
          left = null
          col._ctrlClass.push('last-fixed-col')
        }
      }

      col.placeholder ??= props.placeholder

      return col
    })

    columns.at(-1)._ctrlClass.push('last-col')

    return columns
  })

  // --- Hover indicator ---

  let hoveringCol

  const setHoverSize = debounce(100, () => {
    const headerRow = headerWrap.value?.querySelector('.mu-big-table__header-row')
    if (!headerRow) return

    hoverStyle['--hover-row-width'] = `${headerRow.offsetWidth}px`
    hoverStyle['--hover-col-height'] = `${scrollArea.value?.clientHeight ?? 0}px`

    hideHoverIndicator()
  })

  function hideHoverIndicator () {
    hoveringCol = null
    hoverStyle['--hover-col-width'] = 0
    hoverStyle['--hover-row-height'] = 0
  }

  function setRowHoverIndicator (cell) {
    const el = scrollArea.value
    if (!el) return

    const row = cell.closest('.mu-big-table__row')
    if (!row) return

    const rowRect = row.getBoundingClientRect()
    const containerRect = el.getBoundingClientRect()

    const top = rowRect.top - containerRect.top + el.scrollTop
    hoverStyle['--hover-row-top'] = `${top}px`
    hoverStyle['--hover-row-height'] = `${rowRect.height}px`
  }

  function setColHoverIndicator (cell, column) {
    if (props.hoverMode !== 'cell' && hoveringCol?.deref() === column) return

    const left = cell.offsetLeft
    const fixedWidth = fixedColumnsWidth.value
    const scrollLeft = scrollArea.value.scrollLeft

    const offset = column._fixed || left >= fixedWidth + scrollLeft
      ? 0
      : scrollLeft

    hoverStyle['--hover-col-left'] = `${left + offset}px`
    hoverStyle['--hover-col-width'] = `${cell.offsetWidth - offset}px`

    if (props.hoverMode === 'cell') {
      const el = scrollArea.value
      const row = cell.closest('.mu-big-table__row')

      if (el && row) {
        const rowRect = row.getBoundingClientRect()
        const containerRect = el.getBoundingClientRect()
        hoverStyle['--hover-col-top'] = `${rowRect.top - containerRect.top + el.scrollTop}px`
        hoverStyle['--hover-col-height'] = `${rowRect.height}px`
      }
    } else {
      hoveringCol = new WeakRef(column)
    }
  }

  const setHoverIndicator = throttle(30, (cell, column) => {
    const mode = props.hoverMode

    if (mode === 'none') return
    if (!cell) return hideHoverIndicator()

    if (mode === 'row' || mode === 'cross') setRowHoverIndicator(cell)
    if (mode !== 'row') setColHoverIndicator(cell, column)
  }, { noLeading: true })

  // --- Sync header horizontal scroll ---

  function syncHeaderScroll () {
    const header = headerWrap.value
    const area = scrollArea.value
    if (header && area) {
      header.scrollLeft = area.scrollLeft
    }
  }

  // --- Scroll & resize ---

  const onResize = throttle(100, () => {
    const el = scrollArea.value
    if (!el) return

    const headerRow = headerWrap.value?.querySelector('.mu-big-table__th.last-fixed-col')

    const headerWidth = headerWrap.value?.scrollWidth ?? 0
    xOverflowed.value = headerWidth - el.clientWidth > 0.5

    clientHeight.value = el.clientHeight

    if (headerRow) {
      fixedColumnsWidth.value = headerRow.offsetLeft + headerRow.offsetWidth
    }

    syncHeaderScroll()
    setHoverSize()
  }, { noLeading: true })

  const onScroll = throttle(16, () => {
    const el = scrollArea.value
    if (!el) return

    const { scrollLeft, scrollTop: st, scrollHeight, clientHeight: ch } = el

    scrollTop.value = st
    clientHeight.value = ch

    xScrolled.value = !!scrollLeft
    yScrolled.value = !!st
    yScrolledEnd.value = yScrolled.value && (scrollHeight - st - ch < 1)

    syncHeaderScroll()

    if (props.hoverMode !== 'row') {
      hideHoverIndicator()
    }
  }, { noLeading: true })

  // --- Events ---

  function onHeaderClick (column) {
    emit('header-click', column._raw)
  }

  function onHeaderCheckChange (column, value) {
    emit('update:header-checked', column._raw, value)
  }

  function onCellClick (record, column, recordIndex) {
    const key = getRecordKey(record)

    if (key !== props.selectedRecordKey) {
      emit('update:selected-record-key', key)
    }

    if (record !== props.selectedRecord) {
      emit('update:selected-record', record)
    }

    emit('cell-click', { record, recordIndex, column })
  }

  watch(
    () => props.records,
    (newValue, oldValue) =>
      (newValue !== oldValue) &&
      scrollArea.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  )

  provide('big-table', {
    setHoverIndicator,
    onCellClick,
    emit
  })

  onBeforeUnmount(() => {
    onResize.cancel()
    onScroll.cancel()
    setHoverSize.cancel()
    setHoverIndicator.cancel()
  })
</script>

<script>
  export default { name: 'MusselBigTable' }
</script>
