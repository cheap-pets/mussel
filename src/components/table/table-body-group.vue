<template>
  <div v-if="data.length" :style="tableStyle">
    <div
      v-for="item in data"
      :key="item.idx"
      :style="getRowStyle(item.idx)"
      class="mu-table_row mu-table_body-row"
      @mouseover="onRowMouseEnter(item.idx)">
      <div
        v-for="column in columns"
        :key="column._uid"
        :class="getCellClass(item.record, column)"
        :style="getCellStyle(item.record, column)"
        :hover="hoverCol === column.uid || hoverRow === item.idx"
        class="mu-table_cell"
        @mousedown.stop="cancelEditing(item.idx, column)"
        @mouseover="onColMouseEnter(column)"
        @click="onCellClick(item.record, column)">
        <component
          :is="getCellComponent(item.idx, column)"
          v-if="getCellComponent(item.idx, column)"
          v-bind="getCellComponentParams(item.record, column)"
          @search="onSearch(arguments[0], item.record, column)"
          @change="onCellChange(arguments[0], item.record, column)"
          @buttonclick="onButtonClick(arguments[0], item.record, column)" />
        <div
          v-else
          :class="getCellContentClass(item.record, column)"
          @mousedown.stop
          @click="setEditingCell(item.idx, column)">
          {{ getCellText(item.record, column) }}
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
      columns: Array,
      width: Number
    },
    computed: {
      tableStyle () {
        return this.width
          ? { width: this.width + 'px' }
          : undefined
      },
      hoverCol () {
        return this.table.hoverCol
      },
      hoverRow () {
        return this.table.hoverRow
      },
      shouldUpdateHoverCol () {
        return (['column', 'cross'].indexOf(this.table.hoverMode) !== -1)
      },
      data () {
        return this.table.cachedData
      },
      hovering () {
        return this.table.hoverCol === this.column._uid ||
          this.table.hoverRow === this.recordIdx
      },
      editing () {
        return this.table.editingCell === this
      }
    },
    methods: {
      isCurrentEditingCell (rowIdx, column) {
        const current = this.table.editingCell || {}
        return (current.row === rowIdx && current.col === column._uid)
      },
      getRowStyle (idx) {
        const height = this.table.rowOffsetHeight
        return this.table.cacheAll
          ? undefined
          : {
            position: 'absolute',
            top: height * idx + 'px',
            height: height + 'px'
          }
      },
      getCellClass (record, column) {
        return column.getCellClass(record)
      },
      getCellStyle (record, column) {
        return {
          ...column.getCellStyle(record),
          width: column.columnWidth,
          textAlign: column.align
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
      onRowMouseEnter (idx) {
        if (['row', 'cross'].indexOf(this.table.hoverMode) !== -1) {
          this.table.hoverRow = idx
        }
      },
      onColMouseEnter (column) {
        if (this.shouldUpdateHoverCol) this.table.hoverCol = column._uid
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
