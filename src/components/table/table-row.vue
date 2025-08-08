<template>
  <tr>
    <td
      v-for="el in cells"
      :key="el._key"
      :rowspan="el.rowspan"
      :class="el.class"
      :style="el.style"
      :title="el.title"
      @click="onCellClick($event, record, el.col, recIdx, detailIdx)"
      @mouseenter="setHoverIndicator($event.target, el.col)">
      <a v-if="el.type === 'link'">
        {{ el.text }}
      </a>
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
    getCellText,
    getCellStyle,
    getCellTooltip,
    setHoverIndicator,
    onCellClick
  } = inject('table')

  const cells = computed(() => {
    const { record, recIdx, columns, detailLen, detailIdx } = props

    return columns.map(col => ({
      col,
      key: col._key,
      type: col.type,
      rowspan: col.detail || detailLen < 2 ? null : detailLen,
      class: [col._class, col.class],
      style: [col._style, getCellStyle(record, col)],
      text: getCellText(record, col, recIdx, detailIdx),
      title: getCellTooltip(record, col, recIdx, detailIdx)
    }))
  })
</script>
