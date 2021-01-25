<template>
  <div v-if="data.length" class="mu-table_body" :style="tableStyle">
    <div
      v-for="item in data"
      :key="item.idx"
      :style="rowStyle(item.idx)"
      class="mu-table_row">
      <div v-for="col in columns" :key="col._uid" class="mu-table_cell">
        {{ item.data[col.field] }}
      </div>
    </div>
  </div>
</template>

<script>
  // import { assignIfDefined } from '@utils/assign-if-defined'

  export default {
    inject: ['table'],
    props: {
      tableFixed: String,
      columns: Array,
      width: Number,
      data: Array
    },
    computed: {
      tableStyle () {
        return this.width
          ? {
            width: this.width + 'px'
          }
          : undefined
      }
    },
    methods: {
      rowStyle (idx) {
        const height = this.table.rowHeight
        return height
          ? {
            position: 'absolute',
            height: height + 'px',
            top: height * idx + 'px'
          }
          : undefined
      }
    }
  }
</script>
