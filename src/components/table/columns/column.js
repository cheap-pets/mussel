import isFunction from 'lodash.isfunction'

const WidthRegExp = /^(auto|([1-9]\d*(px|%)))$/

export default {
  name: 'MusselTableColumn',
  inject: ['table'],
  template: '<div></div>',
  props: {
    field: String,
    fixed: String,
    label: String,
    width: {
      type: String,
      validator (value) {
        return value === undefined || WidthRegExp.test(value)
      }
    },
    flex: {
      type: String,
      default: '1 0 auto'
    },
    headAlign: {
      type: String,
      default: 'center',
      validator (value) {
        return ['left', 'center', 'right'].indexOf(value) !== -1
      }
    },
    cellAlign: {
      type: String,
      default: 'center',
      validator (value) {
        return ['left', 'center', 'right'].indexOf(value) !== -1
      }
    },
    cellHtml: null,
    cellText: null,
    cellClass: null,
    cellStyle: null
  },
  computed: {
    columnWidth () {
      return (
        (this.fixed === undefined || this.width !== 'auto') &&
        WidthRegExp.test(this.width)
      )
        ? this.width
        : '100px'
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
    },
    onCellClick (record, column) {
      this.$emit('cellclick', record)
    }
  }
}
