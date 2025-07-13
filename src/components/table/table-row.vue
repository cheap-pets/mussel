<template>
  <tr>
    <td
      v-for="col in columns"
      :key="col.caption"
      :class="[col.class, col._last && 'last-col']"
      :rowspan="col.detail || detailLen < 2 ? null : detailLen"
      :style="getCellStyle(record, col)"
      :title="getCellTooltip(record, col, recIdx, detailIdx)"
      @click="onCellClick($event, record, col, recIdx, detailIdx)">
      <a v-if="col.type === 'link'">
        {{ getCellText(record, col, recIdx, detailIdx) }}
      </a>
      <template v-else>
        {{ getCellText(record, col, recIdx, detailIdx) }}
      </template>
    </td>
  </tr>
</template>

<script setup>
  import { inject } from 'vue'

  defineProps({
    record: Object,
    recIdx: Number,
    columns: Array,
    detailIdx: Number,
    detailLen: Number
  })

  const {
    getCellText,
    getCellStyle,
    getCellTooltip,
    onCellClick
  } = inject('tableMethods')
</script>
