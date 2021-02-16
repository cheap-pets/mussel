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
    cellHtml: null,
    cellText: null,
    cellClass: null,
    cellStyle: null
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
    getComponentParams (record) {
      return {
        value: record[this.field]
      }
    },
    registerColumn () {
      this.table.registerColumn(this)
    },
    getCellText (record) {
      return this.getText
        ? this.getText(this.record)
        : record[this.field]
    }
  }
}
