<template>
  <div v-if="data.length" :style="tableStyle">
    <div
      v-for="item in data"
      :key="item.idx"
      :style="rowStyle(item.idx)"
      class="mu-table_row mu-table_body-row"
      @mouseover="onRowMouseEnter(item.idx)">
      <div
        v-for="col in columns"
        :key="col._uid"
        :style="{ width: col.columnWidth, textAlign: col.align }"
        :hover="table.hoverCol === col._uid || table.hoverRow === item.idx"
        class="mu-table_cell"
        @mouseover="onColMouseEnter(col._uid)">
        <template v-if="col.$options.cellComponent">
          <component
            :is="col.$options.cellComponent"
            :value="item.rec[col.field]"
            style="cellDivStyle"
            @change="col.onCellChange(arguments[0], item.rec, col)" />
        </template>
        <div v-else style="cellDivStyle">
          {{ item.rec[col.field] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      data () {
        return this.table.cachedData
      }
    },
    methods: {
      rowStyle (idx) {
        const height = this.table.rowOffsetHeight
        return this.table.cacheAll
          ? undefined
          : {
            position: 'absolute',
            top: height * idx + 'px'
          }
      },
      cellDivStyle () {
        return this.table.rowHeight
          ? { height: this.table.rowHeight + 'px' }
          : undefined
      },
      onRowMouseEnter (idx) {
        if (['row', 'cross'].indexOf(this.table.hoverMode) !== -1) {
          this.table.hoverRow = idx
        }
      },
      onColMouseEnter (id) {
        if (['column', 'cross'].indexOf(this.table.hoverMode) !== -1) {
          this.table.hoverCol = id
        }
      }
    }
  }
</script>