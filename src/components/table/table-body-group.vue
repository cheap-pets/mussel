<template>
  <div v-if="data.length" :style="tableStyle">
    <div
      v-for="item in data"
      :key="item.idx"
      :style="rowStyle(item.idx)"
      class="mu-table_row mu-table_body-row"
      @mouseover="onRowMouseEnter(item.idx)">
      <table-cell
        v-for="col in columns"
        :key="col._uid"
        :column="col"
        :record="item.rec"
        :record-idx="item.idx" />
    </div>
  </div>
</template>

<script>
  import TableCell from './table-body-cell.vue'

  export default {
    components: {
      TableCell
    },
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
            height: height + 'px',
            top: height * idx + 'px'
          }
      },
      onRowMouseEnter (idx) {
        if (['row', 'cross'].indexOf(this.table.hoverMode) !== -1) {
          this.table.hoverRow = idx
        }
      }
    }
  }
</script>
