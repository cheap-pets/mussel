import { convertColumnWidth } from './width'

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
        return this.fixed ? '100' : undefined
      }
    },
    editor: null,
    content: null,
    cellClass: null,
    cellStyle: null
  },
  computed: {
    columnWidth () {
      return convertColumnWidth(this.width)
    }
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
