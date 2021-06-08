<template>
  <div>
    <div class="mu-table_row mu-table_head-row">
      <div
        v-for="column in columns"
        :key="column._uid"
        :style="getCellStyle(column)"
        class="mu-table_cell">
        <span
          v-if="column.label"
          class="mu-table_cell-text"
          :style="{ textAlign: column.cellAlign }">
          {{ column.label }}
        </span>
        <component
          :is="column.headComponent"
          v-if="column.headComponent"
          :value="column.field ? table.headValues[column.field] : null"
          @change="column.onHeadChange(arguments[0])" />
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    inject: ['table'],
    props: {
      columns: Array
    },
    methods: {
      getCellStyle (column) {
        return {
          flex: column.flex,
          width: column.columnWidth,
          justifyContent: column.headAlign
        }
      }
    }
  }
</script>
