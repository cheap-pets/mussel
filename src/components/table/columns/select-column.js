import Column from './column'
import CheckBox from './checkbox.vue'

export default {
  name: 'MusselTableSelectColumn',
  extends: Column,
  headComponent: CheckBox,
  cellComponent: CheckBox,
  props: {
    field: {
      type: String,
      default: '_selected'
    },
    width: {
      type: String,
      default: '40px'
    },
    flex: {
      flex: 'none'
    },
    align: {
      type: String,
      default: 'center'
    }
  },
  methods: {
    onHeadChange (value) {
      this.table.setHeadValue(this.field, value)

      if (value) this.table.selectAll(this.field)
      else this.table.unselectAll(this.field)

      this.$emit('headchange', value)
    },
    onCellChange (value, record) {
      this.table.onCellChange(record, this.field, value)
      if (this.label === undefined) {
        this.table.setHeadValue(this.field, false)
      }
      this.$emit('cellchange', value)
    }
  }
}
