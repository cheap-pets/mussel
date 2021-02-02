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
    align: {
      type: String,
      default: 'left'
    },
    headerAlign: {
      type: String,
      default: 'center'
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
