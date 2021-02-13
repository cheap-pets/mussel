import Column from './column'
import CheckBox from './checkbox.vue'

export default {
  name: 'MusselTableCheckColumn',
  extends: Column,
  props: {
    field: {
      type: String,
      default: '_selected'
    },
    width: {
      type: String,
      default: '40'
    },
    align: {
      type: String,
      default: 'center'
    }
  },
  methods: {
    onHeaderChange (value, column) {
      if (column.field === '_selected') {
        this.table.setHeaderValue(column.field, value)
        if (value) this.table.selectAll()
        else this.table.unselectAll()
      }
      this.$emit('headerchange', value)
    },
    onCellChange (value, record, column) {
      this.table.onCellChange(record, column.field, value)
      if (this.label === undefined) {
        this.table.setHeaderValue(column.field, false)
      }
      this.$emit('cellchange', value)
    }
  },
  headerComponent: CheckBox,
  cellComponent: CheckBox
}
