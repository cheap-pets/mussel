<template>
  <div
    :style="cellStyle"
    :hover="hovering"
    :editable="editable"
    class="mu-table_cell"
    @mouseover="onColMouseEnter"
    @click="onCellClick">
    <component
      :is="cellComponent"
      v-bind="cellComponentParams"
      v-if="cellComponent"
      @search="onSearch"
      @change="onCellChange"
      @buttonclick="onButtonClick" />
    <div
      v-else-if="editable"
      class="mu-table_cell-label">
      <span :style="cellLabelStyle">{{ cellText }}</span>
    </div>
    <template v-else>
      {{ cellText }}
    </template>
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
        return this.column.getComponentParams?.(this.record)
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
      cellLabelStyle () {
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
      onCellClick () {
        if (this.editingCell !== this) {
          this.table.editingCell =
            this.editable && this.column.$options.editComponent
              ? this
              : undefined
        }
      },
      onSearch (value) {
        this.column.onSearch?.(value)
      },
      onButtonClick (button) {
        this.column.onButtonClick?.(this.record, button)
      }
    }
  }
</script>
