<template>
  <div v-if="data.length">
    <div
      v-for="record in data"
      :key="record._uid"
      :style="{ height: rowHeight }"
      class="mu-table_row">
      <div
        v-for="column in columns"
        :key="column._uid"
        :class="getCellClass(record, column)"
        :style="getCellStyle(record, column)"
        @mousedown.stop="cancelEditing(record._uid, column)"
        @click="onCellClick(record, column)">
        <component
          :is="getCellComponent(record._uid, column)"
          v-if="getCellComponent(record._uid, column)"
          v-bind="getCellComponentParams(record, column)"
          @search="onSearch(arguments[0], record, column)"
          @change="onCellChange(arguments[0], record, column)"
          @buttonclick="onButtonClick(arguments[0], record, column)" />
        <div
          v-else-if="getCellEditable(record, column)"
          class="mu-table_cell-editable"
          @click="setEditingCell(record._uid, record, column)"
          @mousedown.stop>
          <span
            class="mu-table_cell-text"
            :style="{ textAlign: column.cellAlign }">
            {{ getCellText(record, column) }}
          </span>
        </div>
        <span
          v-else
          class="mu-table_cell-text"
          :style="{ textAlign: column.cellAlign }">
          {{ getCellText(record, column) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
  import isFunction from 'lodash.isfunction'

  export default {
    inject: ['table'],
    props: {
      columns: Array
    },
    computed: {
      data () {
        return this.table.renderableData
      },
      rowHeight () {
        return this.table.rowHeight + 'px'
      }
    },
    methods: {
      isCurrentEditingCell (rowId, column) {
        const current = this.table.editingCell || {}
        return (current.row === rowId && current.col === column._uid)
      },
      getCellClass (record, column) {
        return column.getCellClass(record)
      },
      getCellStyle (record, column) {
        return {
          ...column.getCellStyle(record),
          flex: column.flex,
          width: column.columnWidth
        }
      },
      getCellText (record, column) {
        return column.getCellText
          ? column.getCellText(record)
          : record[column.field]
      },
      getCellEditable (record, column) {
        return isFunction(column.editable)
          ? column.editable(record, column)
          : column.editable
      },
      getCellComponent (rowId, column) {
        return (this.isCurrentEditingCell(rowId, column))
          ? column.$options.editComponent
          : column.$options.cellComponent
      },
      getCellComponentParams (record, column) {
        return column.getComponentParams?.(record)
      },
      onCellChange (value, record, column) {
        column.onCellChange(value, record)
      },
      cancelEditing (rowId, column) {
        if (!this.isCurrentEditingCell(rowId, column)) {
          this.table.editingCell = undefined
        }
      },
      setEditingCell (rowId, record, column) {
        if (
          !this.isCurrentEditingCell(rowId, column) &&
          this.getCellEditable(record, column)
        ) {
          this.table.editingCell = column.$options.editComponent
            ? { row: rowId, col: column._uid }
            : undefined
        }
      },
      onSearch (record, column, value) {
        column.onSearch?.(value, record)
      },
      onCellClick (record, column) {
        column.onCellClick(record, column)
      },
      onButtonClick (button, record, column) {
        column.onButtonClick?.(record, button)
      }
    }
  }
</script>
