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
    },
    placeholder: String
  },
  methods: {
    getComponentParams (record) {
      return {
        autofocus: true,
        value: record[this.field],
        placeholder: this.placeholder
      }
    },
    onCellChange (value, record) {
      this.table.onCellChange(record, this.field, value)
      this.$emit('cellchange', value)
    }
  },
  editComponent: Editor
}
