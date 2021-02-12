import { convertColumnWidth } from './width'

export default {
  name: 'MusselTableColumn',
  inject: ['table'],
  template: '<div></div>',
  props: {
    field: String,
    fixed: String,
    label: String,
    width: String,
    align: String,
    headerAlign: String,
    getText: null,
    getStyle: null,
    cellClass: null,
    cellStyle: null,
    cellValue: null
  },
  computed: {
    columnWidth () {
      return convertColumnWidth(this.width || (this.fixed ? 100 : undefined))
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
    },
    getCellText (record) {
      return this.getText
        ? this.getText(this.record)
        : record[this.field]
    },
    getCellStyle (record) {

    }
  }
}
