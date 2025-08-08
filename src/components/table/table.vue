<template>
  <div
    v-mu-scrollbar
    class="mu-table"
    :class="hoverClass"
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
  import { shallowRef, reactive, computed, watchEffect, provide } from 'vue'
  import { isFunction, isPlainObject } from 'es-toolkit'
  import { throttle } from 'throttle-debounce'

  import TableRow from './table-row.vue'
  import './table.scss'

  defineOptions({ name: 'MusselTable' })

  const emit = defineEmits(['cell-click', 'link-click'])
  const selected = defineModel('selected')

  const props = defineProps({
    records: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    keyField: String,
    detailsField: String,
    detailKeyField: String,
    fixedLeftColumns: Number,
    selectMode: {
      default: 'row',
      validator: v => ['none', 'row', 'cell'].includes(v)
    },
    hoverMode: {
      default: 'row',
      validator: v => ['none', 'row', 'column', 'cross', 'cell'].includes(v)
    }
  })

  const tableElement = shallowRef()

  const hoverStyle = reactive({
    '--hover-indicator-x-top': 0,
    '--hover-indicator-x-width': 0,
    '--hover-indicator-x-height': 0,
    '--hover-indicator-y-left': 0,
    '--hover-indicator-y-width': 0,
    '--hover-indicator-y-height': 0
  })

  const processedHoverMode = computed(() =>
    props.hoverMode === 'row' && Boolean(props.detailsField)
      ? 'rows'
      : props.hoverMode
  )

  const hoverClass = computed(() => {
    const mode = processedHoverMode.value
    return mode === 'none' ? null : `mu-table_hover-${mode}`
  })

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
    isPlainObject(selected.value) ? selected.value._key : selected.value
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

    hoverStyle['--hover-indicator-x-width'] = `${pEl.scrollWidth}px`
    hoverStyle['--hover-indicator-y-height'] = `${pEl.scrollHeight}px`
  }, { noLeading: true })

  const onScroll = throttle(50, () => {
    const el = tableElement.value

    if (el.parentNode.scrollLeft) el.setAttribute('table-x-scrolled', '')
    else el.removeAttribute('table-x-scrolled')

    if (el.parentNode.scrollTop) el.setAttribute('table-y-scrolled', '')
    else el.removeAttribute('table-y-scrolled')
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

    if (rec._key !== selectedKey.value) {
      selected.value = isPlainObject(props.selected) ? rec : rec._key
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
      hoverStyle['--hover-row-bg'] = 'var(--active-bg)'
    } else {
      delete hoverStyle['--hover-row-bg']
    }

    hoverStyle['--hover-indicator-x-top'] = `${first.offsetTop}px`
    hoverStyle['--hover-indicator-x-height'] = `${last.offsetTop - first.offsetTop + last.offsetHeight}px`
  }

  function setHoverColIndicator (cell, column) {
    if (hoveringCol?.deref() === column) return
    else hoveringCol = new WeakRef(column)

    hoverStyle['--hover-indicator-y-left'] = `${cell.offsetLeft}px`
    hoverStyle['--hover-indicator-y-width'] = `${cell.offsetWidth}px`
  }

  function hideHoverIndicator () {
    hoveringCol = null
    hoveringRow = null
    hoverStyle['--hover-indicator-y-width'] = 0
    hoverStyle['--hover-indicator-x-height'] = 0
  }

  const setHoverIndicator = throttle(30, (cell, column) => {
    const mode = processedHoverMode.value

    if (!['rows', 'column', 'cross'].includes(mode)) return

    if (cell) {
      if (mode !== 'column') setHoverRowIndicator(cell.parentNode)
      if (mode !== 'row') setHoverColIndicator(cell, column)
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
    getCellText,
    getCellStyle,
    getCellTooltip,
    setHoverIndicator,
    onCellClick
  })
</script>
