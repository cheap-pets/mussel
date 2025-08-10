<template>
  <tr :class="(tableOptions.striped && (recIdx & 1)) ? 'even-row' : null">
    <td
      v-for="(el, idx) in cells"
      :key="el._key"
      :rowspan="el.rowspan"
      :cell-type="el.type"
      :class="el.class"
      :style="el.style"
      @click="onCellClick($event, record, el.col, recIdx, detailIdx)"
      @mouseenter="onCellEnter($event.target, el, idx)"
      @mouseleave="onCellLeave($event.target, el, idx)">
      <div v-if="el.type === 'multiline' && el.rowspan">
        {{ el.text }}
      </div>
      <template v-else>
        {{ el.text }}
      </template>
    </td>
  </tr>
</template>

<script setup>
  import { computed, inject } from 'vue'

  const props = defineProps({
    record: Object,
    recIdx: Number,
    columns: Array,
    detailLen: Number,
    detailIdx: Number
  })

  const {
    tableOptions,
    getCellText,
    getCellStyle,
    getCellTooltip,
    setHoverIndicator,
    onCellClick
  } = inject('table')

  const cells = computed(() => {
    const { record, recIdx, columns, detailLen, detailIdx } = props

    return columns.map(col => {
      const rowspan = col.detail || detailLen < 2 ? null : detailLen

      return {
        col,
        rowspan,
        key: col._key,
        type: col.type,
        text: getCellText(record, col, recIdx, detailIdx),
        title: getCellTooltip(record, col, recIdx, detailIdx),
        class: [col._class, col.class],
        style: [
          col._style,
          getCellStyle(record, col),
          rowspan && col.type === 'multiline' && { '--rowspan': rowspan }
        ]
      }
    })
  })

  function onCellEnter (target, cell, colIdx) {
    setHoverIndicator(target, cell.col)
    if (cell.title) target.setAttribute('title', cell.title)
  }

  function onCellLeave (target, cell, colIdx) {
    target.removeAttribute('title')
  }
</script>
