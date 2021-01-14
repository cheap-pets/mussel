let ai = 0

export default {
  inject: ['table'],
  template: '<div v-show="false"></div>',
  props: {
    field: String,
    label: String,
    editor: null,
    content: null,
    cellClass: null,
    cellStyle: null
  },
  created () {
    this.registerColumn()
  },
  beforeDestroy () {
    this.table.unregisterColumn(this._columnId)
  },
  methods: {
    registerColumn () {
      this._columnId = '#f_' + (ai++)
      this.table.registerColumn(this)
    }
  }
}
