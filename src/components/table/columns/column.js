export default {
  name: 'MusselTableColumn',
  inject: ['table'],
  template: '<div></div>',
  props: {
    field: String,
    label: String,
    fixed: String,
    width: {
      type: String,
      default () {
        return this.fixed === undefined
          ? undefined
          : '100px'
      }
    },
    editor: null,
    content: null,
    cellClass: null,
    cellStyle: null
  },
  created () {
    this.registerColumn()
  },
  beforeDestroy () {
    this.table.unregisterColumn(this._uid)
  },
  methods: {
    registerColumn () {
      this.table.registerColumn(this)
    }
  }
}
