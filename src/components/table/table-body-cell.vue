<template>
  <div
    :style="cellStyle"
    :hover="hovering"
    :editable="editable"
    class="mu-table_cell"
    @mouseover="onColMouseEnter">
    <component
      :is="cellComponent"
      v-if="cellComponent"
      v-bind="cellComponentParams"
      :value="cellValue"
      @change="onCellChange"
      @blur="onCellBlur" />
    <div
      v-else
      class="mu-table_cell-label"
      :style="cellDivStyle"
      @click="onLabelClick">
      <span>{{ cellText }}</span>
    </div>
  </div>
</template>

<script>
  import isFunction from 'lodash.isfunction'

  export default {
    inject: ['table'],
    props: ['column', 'record', 'recordIdx'],
    computed: {
      cellValue () {
        return this.record[this.column.field]
      },
      cellText () {
        return this.column.getCellText
          ? this.column.getCellText(this.record)
          : this.cellValue
      },
      cellComponent () {
        return this.editing
          ? this.column.$options.editComponent
          : this.column.$options.cellComponent
      },
      cellComponentParams () {
        return this.column.getComponentParams?.()
      },
      hovering () {
        return this.table.hoverCol === this.column._uid ||
          this.table.hoverRow === this.recordIdx
      },
      editable () {
        const editable = this.column.editable
        return isFunction(editable)
          ? editable(this.record, this.column)
          : editable
      },
      editing () {
        return this.table.editingCell === this
      },
      cellStyle () {
        return {
          width: this.column.columnWidth
        }
      },
      cellDivStyle () {
        return {
          ...this.column.getStyle?.(this.record),
          textAlign: this.column.align
        }
      }
    },
    methods: {
      onColMouseEnter () {
        if (['column', 'cross'].indexOf(this.table.hoverMode) !== -1) {
          this.table.hoverCol = this.column._uid
        }
      },
      onCellChange (value) {
        this.column.onCellChange(value, this.record, this.column)
      },
      onLabelClick () {
        this.table.editingCell =
          this.editable && this.column.$options.editComponent
            ? this
            : undefined
      },
      onCellBlur () {
        // this.table.editingCell = undefined
      }
    }
  }
</script>
