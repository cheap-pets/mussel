<template>
  <div v-mu-scrollbar class="mu-table-lite_scroll-box" @sizechange="onResize" @scroll="onScroll">
    <table ref="tableElement" class="mu-table-lite" cellspacing="0" @sizechange="onResize">
      <colgroup>
        <col v-for="col in cols" :key="col.caption" :style="{ width: col.width, ...col.colStyle }">
      </colgroup>
      <thead>
        <tr>
          <th v-for="col in cols" :key="col.caption" :class="[col._last && 'last-col']">
            {{ col.caption }}
          </th>
        </tr>
      </thead>
      <tbody @mouseleave="hoverId = null">
        <template v-for="(rec, recIdx) in records" :key="rec.id">
          <table-row
            :hover="hoverId === rec.id"
            :record="rec"
            :rec-idx="recIdx"
            :detail-len="rec[detailsField]?.length"
            :columns="cols"
            @mouseenter="hoverId = rec.id" />
          <template v-if="detailsField && rec[detailsField]?.length > 1">
            <table-row
              v-for="(el, idx) in rec[detailsField].slice(1)"
              :key="rec.id + '_' + (idx + 1)"
              :hover="hoverId === rec.id"
              :record="rec"
              :rec-idx="recIdx"
              :detail-idx="idx + 1"
              :columns="detailCols"
              @mouseenter="hoverId = rec.id" />
          </template>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  import { ref, shallowRef, computed, provide } from 'vue'
  import { throttle } from 'throttle-debounce'
  import { isFunction } from 'es-toolkit'

  import TableRow from './table-row.vue'

  defineOptions({ name: 'MusselTableLite' })

  const props = defineProps({
    records: Array,
    columns: Array,
    detailsField: String
  })

  const emit = defineEmits(['cell-click', 'link-click'])

  const tableElement = shallowRef()
  const hoverId = ref()

  const cols = computed(() =>
    props.columns.map((col, idx) =>
      ({ ...col, idx, _last: idx === props.columns.length - 1 })
    )
  )

  const detailCols = computed(() => cols.value.filter(el => el.detail))

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
        ? field === '*'
          ? details[detailIdx]
          : details[detailIdx][field]
        : field && rec[field]
    ) ?? '-'
  }

  function getCellTooltip (rec, col, recIdx, detailIdx = 0) {
    return isFunction(col.tooltip)
      ? col.tooltip(rec, col, recIdx, detailIdx)
      : col.tooltip === true && getCellText(rec, col, recIdx, detailIdx)
  }

  function getCellStyle (rec, col, recIdx, detailIdx = 0) {
    const result = []
    const styles = isFunction(col.style) ? col.style(rec, col, recIdx, detailIdx) : col.style

    if (styles) result.push(styles)
    if (col.align) result.push({ textAlign: col.align })

    return result
  }

  function onCellClick (event, rec, col, recIdx, detailIdx) {
    const eventName =
      col.type === 'link' && event.target.tagName?.toLowerCase() === 'a'
        ? 'link-click'
        : 'cell-click'

    emit(eventName, rec, col, recIdx, detailIdx)
  }

  const onResize = throttle(100, () => {
    const el = tableElement.value
    const isXOverflowed = el.offsetWidth >= el.parentNode.clientWidth
    const isYOverflowed = el.offsetHeight >= el.parentNode.clientHeight

    el.style.borderRightWidth = isXOverflowed ? 0 : '1px'
    el.style.borderBottomWidth = isYOverflowed ? 0 : '1px'
  }, { noLeading: true })

  const onScroll = throttle(100, () => {
    const el = tableElement.value

    if (el.parentNode.scrollTop) el.setAttribute('table-scrolled', '')
    else el.removeAttribute('table-scrolled')
  }, { noLeading: true })

  provide('tableMethods', {
    getCellText,
    getCellStyle,
    getCellTooltip,
    onCellClick
  })
</script>

<style>
  .mu-table-lite_scroll-box {
    border: 1px solid var(--mu-border-color);
  }

  .mu-table-lite {
    table-layout: fixed;

    width: fit-content;
    min-width: 100%;
    border-right: 1px solid var(--mu-border-color);
    border-bottom: 1px solid var(--mu-border-color);

    & > thead {
      position: sticky;
      z-index: 2;
      top: 0;
    }

    &[table-scrolled] > thead {
      box-shadow: 0 1px 3px 1.5px rgba(0, 0, 0, 0.35);
    }

    & th, & td {
      user-select: none;

      position: relative;

      overflow: hidden;

      padding: 8px;
      border-top: 1px solid var(--mu-border-color-muted);
      border-right: 1px solid var(--mu-border-color-muted);

      font-size: inherit;
      font-weight: inherit;
      line-height: 20px;
      color: inherit;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.last-col {
        border-right: none;
      }
    }

    & th {
      background-color: #f1f1f1;
    }

    & td {
      vertical-align: top;
      background-color: #fff;

      & > a,
      & > div {
        overflow: hidden;
        max-width: 100%;
        vertical-align: inherit;
      }

      & > a {
        cursor: pointer;

        display: inline-block;

        color: var(--mu-primary-color);
        text-decoration: none;
        text-underline-offset: 2px;
        text-overflow: ellipsis;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    & tr {
      &:first-child > th {
        border-top: none;
      }

      &[hover] > td {
        background-color: rgb(from var(--mu-primary-color) r g b / 0.1);
      }
    }
  }

  td.column-answer::before {
    content: attr(title);
  }

  td[rowspan].column-answer::before {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: calc((var(--td-rowspan) * 37 - 18) / 20);

    white-space: pre-line;
  }
</style>
