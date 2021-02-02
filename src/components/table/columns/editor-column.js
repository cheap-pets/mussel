import Column from './column'
import Editor from '../../editor/editor.vue'

export default {
  name: 'MusselTableEditorColumn',
  extends: Column,
  props: {
    width: {
      type: String,
      default: 'L'
    }
  },
  methods: {
    onCellChange (value, record, column) {

    }
  },
  editorComponent: Editor
}
