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
        this.$set(this.table.headerValues, '_selected', value)
        if (value) this.table.selectAll()
        else this.table.unselectAll()
      }
      this.$emit('headerchange', value)
    },
    onCellChange (value, record, column) {
      if (column.field === '_selected') {
        this.$set(record, '_selected', value)
        if (!value) this.table.headerValues._selected = false
      }
      this.$emit('cellchange', value)
    }
  },
  headerComponent: CheckBox,
  cellComponent: CheckBox
}
