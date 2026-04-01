<template>
  <div
    ref="rootElement"
    v-mu-scrollbar
    class="mu-table"
    :class="[striped && 'mu-table--striped', gridlinesClass]"
    :data-empty="!records?.length || null"
    :data-x-overflowed="xOverflowed || null"
    :data-y-overflowed="yOverflowed || null"
    :data-x-scrolled="xScrolled || null"
    :data-y-scrolled="yScrolled || null"
    :data-y-scrolled-end="yScrolledEnd || null"
    @scroll="onScroll"
    @sizechange="onResize">
    <table
      ref="tableElement"
      cellspacing="0"
      :style="{ width: tableWidth, minWidth: tableMinWidth }"
      @sizechange="onResize">
      <colgroup>
        <col
          v-for="col in internalColumns"
          :key="col._key"
          :style="col._colStyle">
      </colgroup>
      <thead>
        <tr>
          <th
            v-for="col in internalColumns"
            :key="col._key"
            :class="['mu-table__th', col.sortable && 'mu-table__th--sortable', col._ctrlClass, col.headerClass]"
            :style="[col._ctrlStyle, col.headerStyle]"
            @click="onHeaderClick(col)">
            <div
              v-if="col.type === 'check' && col.field && col.headerCheckbox"
              class="mu-table__cell-check"
              :data-checked="headerChecked[col.field] || null"
              @click.stop="onHeaderCheckChange(col, !headerChecked[col.field])">
              ✓
            </div>
            {{ col.caption }}
            <mu-sort-icon v-if="col.sortable" :direction="sortDirection[col.field]" />
          </th>
        </tr>
      </thead>
      <tbody @mouseleave="setHoverIndicator()">
        <table-row
          v-for="(rec, recIdx) in records"
          :key="getRecordKey(rec)"
          :columns="internalColumns"
          :record="rec"
          :record-index="recIdx"
          :record-number="recordsOffset + recIdx + 1"
          :class="(selectedRecKey != null && getRecordKey(rec) === selectedRecKey) ? 'mu-table__tr--selected' : null" />
      </tbody>
    </table>
    <div class="mu-table__hover-indicator" :data-mode="hoverMode" :style="hoverStyle" />
  </div>
</template>

<script setup>
  import { ref, shallowRef, reactive, computed, watch, provide, onBeforeUnmount } from 'vue'
  import { autoIncrementKeyBuilder } from '@/utils/auto-key'
  import { throttle, debounce } from 'throttle-debounce'

  import { resolveColumnType } from './column-types'
  import { ensureFn, getPixelNumber, getCellAlignClass } from './utils'

  import TableRow from './table-row.vue'

  import './table.scss'

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
    tableWidth: { default: 'fit-content' },
    tableMinWidth: { default: '100%' }
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
  const tableElement = shallowRef()

  const fixedColumnsWidth = ref(0)

  const xScrolled = ref(false)
  const yScrolled = ref(false)
  const yScrolledEnd = ref(false)

  const xOverflowed = ref(false)
  const yOverflowed = ref(false)

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
    `mu-table--gridlines-${props.gridlines}`
  )

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

      col._colStyle = { width, minWidth: el.minWidth, maxWidth: el.maxWidth }
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

  let hoveringRow, hoveringCol

  const setHoverSize = debounce(100, () => {
    const table = tableElement.value
    if (!table) return

    hoverStyle['--hover-row-width'] = `${table.offsetWidth}px`
    hoverStyle['--hover-col-height'] = `${table.offsetHeight}px`

    hideHoverIndicator()
  })

  function hideHoverIndicator () {
    hoveringCol = null
    hoveringRow = null
    hoverStyle['--hover-col-width'] = 0
    hoverStyle['--hover-row-height'] = 0
  }

  function setRowHoverIndicator (row) {
    if (hoveringRow?.deref() === row) return
    else hoveringRow = new WeakRef(row)

    const total = internalColumns.value.length

    let prev = row

    while (prev && prev.childElementCount !== total) {
      prev = prev.previousElementSibling
    }

    const first = prev || row

    let next = row.nextElementSibling
    let last = row

    while (next && next.childElementCount !== total) {
      last = next
      next = next.nextElementSibling
    }

    hoverStyle['--hover-row-top'] = `${first.offsetTop}px`
    hoverStyle['--hover-row-height'] = `${last.offsetTop - first.offsetTop + last.offsetHeight}px`
  }

  function setColHoverIndicator (cell, column) {
    if (props.hoverMode !== 'cell' && hoveringCol?.deref() === column) return

    const left = cell.offsetLeft
    const fixedWidth = fixedColumnsWidth.value
    const scrollLeft = tableElement.value.parentNode.scrollLeft

    const offset = column._fixed || left >= fixedWidth + scrollLeft
      ? 0
      : scrollLeft

    hoverStyle['--hover-col-left'] = `${left + offset}px`
    hoverStyle['--hover-col-width'] = `${cell.offsetWidth - offset}px`

    if (props.hoverMode === 'cell') {
      hoverStyle['--hover-col-top'] = `${cell.offsetTop}px`
      hoverStyle['--hover-col-height'] = `${cell.offsetHeight}px`
    } else {
      hoveringCol = new WeakRef(column)
    }
  }

  const setHoverIndicator = throttle(30, (cell, column) => {
    const mode = props.hoverMode

    if (mode === 'none') return
    if (!cell) return hideHoverIndicator()

    if (mode === 'row' || mode === 'cross') setRowHoverIndicator(cell.parentNode)
    if (mode !== 'row') setColHoverIndicator(cell, column)
  }, { noLeading: true })

  const onResize = throttle(100, () => {
    const el = rootElement.value
    if (!el) return

    const table = tableElement.value
    const th = table.querySelector('th.last-fixed-col')

    const x = table.offsetWidth - el.clientWidth
    const y = table.offsetHeight - el.clientHeight

    xOverflowed.value = x > 0.5
    yOverflowed.value = y > 0.5

    if (th) {
      fixedColumnsWidth.value = th.offsetLeft + th.offsetWidth
    }

    setHoverSize()
  }, { noLeading: true })

  const onScroll = throttle(50, () => {
    const el = rootElement.value
    if (!el) return

    const { scrollLeft, scrollTop, scrollHeight, clientHeight } = el

    xScrolled.value = !!scrollLeft
    yScrolled.value = !!scrollTop
    yScrolledEnd.value = yScrolled.value && (scrollHeight - scrollTop - clientHeight < 1)

    if (props.hoverMode !== 'row') {
      hideHoverIndicator()
    }
  }, { noLeading: true })

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
      rootElement.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  )

  provide('table', {
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
  export default { name: 'MusselTable' }
</script>
