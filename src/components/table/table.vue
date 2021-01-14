<template>
  <div>
    <div v-show="false">
      <slot />
    </div>
    <template v-if="ready">
      <div v-for="column in columns" :key="column.field">
        
      </div>
    </template>
  </div>
</template>

<script>
  export default {
    provide () {
      return {
        table: this
      }
    },
    props: {
      data: Array
    },
    data () {
      return {
        ready: false,
        columns: []
      }
    },
    methods: {
      registerColumn (column) {
        this.ready = false
        this.columns.push(column)
        this.$nextTick(() => { this.ready = true })
      },
      unregisterColumn (columnId) {
        this.ready = false
        const idx = this.columns.findIndex(el => el._columnId === columnId)
        if (idx >= 0) this.columns.splice(idx)
        this.$nextTick(() => { this.ready = true })
      },
      updateColumns () {
        this.ready = false
        this.$nextTick(() => { this.ready = true })
      }
    }
  }
</script>
