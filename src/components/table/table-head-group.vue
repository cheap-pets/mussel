<template>
  <div>
    <div class="mu-table_row mu-table_head-row">
      <div
        v-for="column in columns"
        :key="column._uid"
        :style="getCellStyle(column)"
        class="mu-table_cell">
        <div v-if="column.label !== undefined" class="mu-table_cell-label">
          {{ column.label }}
        </div>
        <component
          :is="column.$options.headComponent"
          v-else
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
