<template>
  <div>
    <div class="mu-table_row mu-table_head-row">
      <div
        v-for="col in columns"
        :key="col._uid"
        :style="{ width: col.columnWidth, textAlign: col.headerAlign }"
        class="mu-table_cell">
        <div v-if="col.label !== undefined" class="mu-table_cell-label">
          {{ col.label }}
        </div>
        <component
          :is="col.$options.headerComponent"
          v-else
          :value="col.field ? table.headerValues[col.field] : null"
          @change="col.onHeaderChange(arguments[0], col)" />
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
