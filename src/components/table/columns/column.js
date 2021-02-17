import isFunction from 'lodash.isfunction'

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
      return this.cellText
        ? (
            isFunction(this.cellText) ? this.cellText(record) : this.cellText
          )
        : record[this.field]
    },
    getCellStyle (record) {
      return isFunction(this.cellStyle)
        ? this.cellStyle(record)
        : this.cellStyle
    },
    getCellClass (record) {
      return isFunction(this.cellClass)
        ? this.cellClass(record)
        : this.cellClass
    }
  }
}
