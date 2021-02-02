<template>
  <div>
    <div class="mu-table_row mu-table_head-row">
      <div
        v-for="col in columns"
        :key="col._uid"
        :style="{ width: col.columnWidth, textAlign: col.headerAlign }"
        class="mu-table_cell">
        <template v-if="col.$options.headerComponent">
          <component
            :is="col.$options.headerComponent"
            :value="col.field ? table.headerValues[col.field] : null"
            @change="col.onHeaderChange(arguments[0], col)" />
        </template>
        <div v-else>
          {{ col.label }}
        </div>
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
