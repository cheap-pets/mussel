<template>
  <div
    v-mu-scrollbar
    class="mu-table"
    :class="[hoverClass, gridlinesClass]"
    :style="hoverStyle"
    @scroll="onScroll"
    @sizechange="onResize">
    <table ref="tableElement" cellspacing="0" @sizechange="onResize">
      <colgroup>
        <col v-for="col in processedColumns" :key="col._key" :style="col._colStyle">
      </colgroup>
      <thead>
        <tr>
          <th
            v-for="col in processedColumns"
            :key="col._key"
            :class="[col._class, col.headClass]"
            :style="[col._style, col.headStyle]">
            {{ col.caption }}
          </th>
        </tr>
      </thead>
      <tbody @mouseleave="setHoverIndicator()">
        <template v-for="(rec, recIdx) in records" :key="rec._key">
          <table-row
            :record="rec"
            :rec-idx="recIdx"
            :columns="processedColumns"
            :detail-len="rec[detailsField]?.length"
            :selected="rec._key === selectedKey || null" />
          <template v-if="detailsField && rec[detailsField]?.length > 1">
            <table-row
              v-for="(detail, idx) in rec[detailsField].slice(1)"
              :key="getDetailRowKey(rec, detail, idx + 1)"
              :record="rec"
              :rec-idx="recIdx"
              :columns="detailColumns"
              :detail-idx="idx + 1"
              :selected="rec._key === selectedKey || null" />
          </template>
        </template>
      </tbody>
    </table>
    <div class="mu-table_hover-indicator" />
  </div>
</template>

<script setup>
  import { ref, shallowRef, reactive, computed, watchEffect, provide } from 'vue'
  import { isFunction, isPlainObject } from 'es-toolkit'
  import { throttle } from 'throttle-debounce'

  import './mu-table.scss'
  import TableRow from './table-row.vue'

  defineOptions({ name: 'MusselTable' })

  const props = defineProps({
    records: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    keyField: String,
    detailsField: String,
    detailKeyField: String,
    fixedLeftColumns: Number,
    striped: Boolean,
    selected: [Object, Number, String],
    selectMode: {
      default: 'row',
      validator: v => ['none', 'row'].includes(v) // , 'cell'
    },
    hoverMode: {
      default: 'row',
      validator: v => ['none', 'row', 'column', 'cross', 'cell'].includes(v)
    },
    gridlines: {
      default: 'all',
      validator: v => ['none', 'all', 'row', 'column'].includes(v)
    }
  })

  const emit = defineEmits(['cell-click', 'link-click', 'update:selected'])

  const fixedColumnsWidth = ref(0)
  const tableElement = shallowRef()

  const hoverStyle = reactive({
    '--hover-row-top': 0,
    '--hover-row-width': 0,
    '--hover-row-height': 0,
    '--hover-col-top': 0,
    '--hover-col-left': 0,
    '--hover-col-width': 0,
    '--hover-col-height': 0
  })

  const hoverClass = computed(() =>
    props.hoverMode === 'none' ? null : `mu-table_hover-${props.hoverMode}`
  )

  const gridlinesClass = computed(() =>
    props.gridlines === 'none' ? null : `mu-table_gridlines-${props.gridlines}`
  )

  const processedColumns = computed(() => {
    const fixed = props.fixedLeftColumns

    function getPixelNumber (value) {
      const v = String(value).match(/^(\d+(\.\d+)?)(px)?$/)?.[1]
      return v && Number(v)
    }

    function getAlignClass (align, px) {
      return ['left', 'center', 'right'].includes(align)
        ? `text-${align}`
        : px > 0 && px <= 100 ? 'text-center' : 'text-left'
    }

    let left = fixed ? 0 : null

    const columns = props.columns.map((col, idx) => {
      const el = { ...col, _id: getKey(col) }
      const px = getPixelNumber(col.width)

      el._class = [getAlignClass(col.align, px)]
      el._colStyle = col.width && { width: col.width }

      if (left != null) {
        el._class.push('fixed-col')
        el._style = { left: `${left}px` }
        el._fixed = true

        if (px && idx < fixed) {
          left += px
        } else {
          left = null
          el._class.push('last-fixed-col')
        }
      }

      return el
    })

    columns.at(-1)._class.push('last-col')

    return columns
  })

  const detailColumns = computed(() =>
    processedColumns.value.filter(el => el.detail)
  )

  const selectedKey = computed(() =>
    props.selectMode === 'none' ? null : (props.selected?._key ?? props.selected)
  )

  const keyMap = new WeakMap()
  let keyIndex = 0

  function getKey (obj, keyProp) {
    let key = (keyProp && obj[keyProp]) ?? keyMap.get(obj)

    if (!key) {
      key = keyIndex++
      keyMap.set(obj, key)
    }

    return key
  }

  function getDetailRowKey (rec, detail, detailIdx) {
    return `${rec._key}__${isPlainObject(detail) ? getKey(detail, props.detailKeyField) : detailIdx}`
  }

  const onResize = throttle(100, () => {
    const el = tableElement.value
    const pEl = el.parentNode

    const isXOverflowed = el.offsetWidth >= el.parentNode.clientWidth
    const isYOverflowed = el.offsetHeight >= el.parentNode.clientHeight

    el.style.borderRightWidth = isXOverflowed ? 0 : '1px'
    el.style.borderBottomWidth = isYOverflowed ? 0 : '1px'

    const th = el.querySelector('th.last-fixed-col')
    fixedColumnsWidth.value = th ? th.offsetLeft + th.offsetWidth : 0

    hideHoverIndicator()
    hoverStyle['--hover-row-width'] = `${pEl.scrollWidth}px`
    hoverStyle['--hover-col-height'] = `${pEl.scrollHeight}px`
  }, { noLeading: true })

  const onScroll = throttle(50, () => {
    const el = tableElement.value

    if (el.parentNode.scrollLeft) el.setAttribute('table-x-scrolled', '')
    else el.removeAttribute('table-x-scrolled')

    if (el.parentNode.scrollTop) el.setAttribute('table-y-scrolled', '')
    else el.removeAttribute('table-y-scrolled')

    if (props.hoverMode !== 'row') {
      hideHoverIndicator()
    }
  }, { noLeading: true })

  function getCellText (rec, col, recIdx, detailIdx = 0) {
    const { text, field, detail } = col
    const { detailsField } = props

    if (text != null) {
      return isFunction(text)
        ? col.text(rec, col, recIdx, detailIdx)
        : text
    }

    const details = field && detail && detailsField && rec[detailsField]

    return (
      details
        ? field === '$'
          ? details[detailIdx]
          : details[detailIdx][field]
        : field && rec[field]
    ) ?? '-'
  }

  function getCellStyle (rec, col, recIdx, detailIdx = 0) {
    return isFunction(col.style)
      ? col.style(rec, col, recIdx, detailIdx)
      : col.style
  }

  function getCellTooltip (rec, col, recIdx, detailIdx = 0) {
    return isFunction(col.tooltip)
      ? col.tooltip(rec, col, recIdx, detailIdx)
      : col.tooltip === true && getCellText(rec, col, recIdx, detailIdx)
  }

  function onCellClick (event, rec, col, recIdx, detailIdx) {
    const clickEvent =
      col.type === 'link' && event.target.tagName?.toLowerCase() === 'a'
        ? 'link-click'
        : 'cell-click'

    if (props.selectMode === 'row' && rec._key !== selectedKey.value) {
      emit(
        'update:selected',
        props.keyField && !isPlainObject(props.selected) ? rec._key : rec
      )
    }

    emit(clickEvent, rec, col, recIdx, detailIdx)
  }

  let hoveringRow, hoveringCol

  function setHoverRowIndicator (row) {
    if (hoveringRow?.deref() === row) return
    else hoveringRow = new WeakRef(row)

    const total = processedColumns.value.length

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

    if (row.getAttribute('selected')) {
      hoverStyle['--hover-row-bg'] = 'unset'
    } else {
      delete hoverStyle['--hover-row-bg']
    }

    hoverStyle['--hover-row-top'] = `${first.offsetTop}px`
    hoverStyle['--hover-row-height'] = `${last.offsetTop - first.offsetTop + last.offsetHeight}px`
  }

  function setHoverColIndicator (cell, column) {
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

  function hideHoverIndicator () {
    hoveringCol = null
    hoveringRow = null
    hoverStyle['--hover-col-width'] = 0
    hoverStyle['--hover-row-height'] = 0
  }

  const setHoverIndicator = throttle(30, (cell, column) => {
    const mode = props.hoverMode

    if (mode === 'none') return

    if (cell) {
      if (mode !== 'column' && mode !== 'cell') {
        setHoverRowIndicator(cell.parentNode)
      }

      if (mode !== 'row') {
        setHoverColIndicator(cell, column)
      }
    } else {
      hideHoverIndicator()
    }
  }, { noLeading: true })

  watchEffect(() =>
    props.records?.forEach(rec =>
      !rec._key && Object.defineProperty(rec, '_key', {
        value: getKey(rec, props.keyField),
        enumerable: false
      })
    )
  )

  provide('table', {
    tableOptions: props,
    getCellText,
    getCellStyle,
    getCellTooltip,
    setHoverIndicator,
    onCellClick
  })
</script>
