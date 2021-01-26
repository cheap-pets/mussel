<template>
  <div v-if="data.length" class="mu-table_body" :style="tableStyle">
    <div
      v-for="item in data"
      :key="item.idx"
      :style="rowStyle(item.idx)"
      class="mu-table_row">
      <div
        v-for="col in columns"
        :key="col._uid"
        :style="{ width: col.width }"
        class="mu-table_cell">
        <div>
          {{ item.data[col.field] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
          ? { width: this.width + 'px' }
          : undefined
      }
    },
    methods: {
      rowStyle (idx) {
        const height = this.table.rowHeight
        return this.table.cacheAll
          ? (
            height
              ? { height: height + 'px' }
              : undefined
          )
          : {
            position: 'absolute',
            height: height + 'px',
            top: height * idx + 'px'
          }
      }
    }
  }
</script>
