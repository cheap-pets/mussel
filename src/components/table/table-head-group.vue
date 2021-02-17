<template>
  <div>
    <div class="mu-table_row mu-table_head-row">
      <div
        v-for="column in columns"
        :key="column._uid"
        :style="{ width: column.columnWidth, textAlign: column.headerAlign }"
        class="mu-table_cell">
        <div v-if="column.label !== undefined" class="mu-table_cell-label">
          {{ column.label }}
        </div>
        <component
          :is="column.$options.headerComponent"
          v-else
          :value="column.field ? table.headerValues[column.field] : null"
          @change="column.onHeaderChange(arguments[0])" />
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    inject: ['table'],
    props: {
      columns: Array
    }
  }
</script>
