<template>
  <div>
    <div
      v-for="(record, idx) in data"
      :key="idx"
      :style="{ height: rowHeight }"
      class="mu-table_row">
      <div
        v-for="column in columns"
        :key="column._uid"
        :class="getCellClass(record, column)"
        :style="getCellStyle(record, column)"
        class="mu-table_cell"
        @mousedown.stop="cancelEditing(idx, column)"
        @click="onCellClick(record, column)">
        <component
          :is="getCellComponent(idx, column)"
          v-if="getCellComponent(idx, column)"
          v-bind="getCellComponentParams(record, column)"
          @search="onSearch(arguments[0], record, column)"
          @change="onCellChange(arguments[0], record, column)"
          @buttonclick="onButtonClick(arguments[0], record, column)" />
        <div
          v-else
          :class="getCellContentClass(record, column)"
          @mousedown.stop
          @click="setEditingCell(idx, column)">
          {{ getCellText(record, column) }}
        </div>
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
        return this.table.data
      },
      editing () {
        return this.table.editingCell === this
      },
      rowHeight () {
        return this.table.rowHeight + 'px'
      }
    },
    methods: {
      isCurrentEditingCell (rowIdx, column) {
        const current = this.table.editingCell || {}
        return (current.row === rowIdx && current.col === column._uid)
      },
      getCellClass (record, column) {
        return column.getCellClass(record)
      },
      getCellStyle (record, column) {
        return {
          ...column.getCellStyle(record),
          flex: column.flex,
          width: column.columnWidth,
          justifyContent: column.cellAlign
        }
      },
      getCellText (record, column) {
        return column.getCellText
          ? column.getCellText(record)
          : record[column.field]
      },
      getCellComponent (rowIdx, column) {
        return (this.isCurrentEditingCell(rowIdx, column))
          ? column.$options.editComponent
          : column.$options.cellComponent
      },
      getCellComponentParams (record, column) {
        return column.getComponentParams?.(record)
      },
      getCellContentClass (record, column) {
        const editable = isFunction(column.editable)
          ? column.editable(record, column)
          : column.editable
        return editable ? 'mu-table_cell-editable' : undefined
      },
      onCellChange (value, record, column) {
        column.onCellChange(value, record)
      },
      cancelEditing (rowIdx, column) {
        if (!this.isCurrentEditingCell(rowIdx, column)) {
          this.table.editingCell = undefined
        }
      },
      setEditingCell (rowIdx, column) {
        if (!this.isCurrentEditingCell(rowIdx, column)) {
          this.table.editingCell = column.$options.editComponent
            ? { row: rowIdx, col: column._uid }
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
