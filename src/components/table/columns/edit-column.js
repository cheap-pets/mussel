import Column from './column'
import Editor from '../../editor/editor.vue'

export default {
  name: 'MusselTableEditorColumn',
  extends: Column,
  props: {
    width: {
      type: String,
      default: 'L'
    },
    editable: {
      type: null,
      default: true
    }
  },
  methods: {
    getComponentParams (record) {
      return {
        autofocus: true,
        value: record[this.field]
      }
    },
    onCellChange (value, record, column) {
      this.table.onCellChange(record, column.field, value)
      this.$emit('cellchange', value)
    }
  },
  editComponent: Editor
}
