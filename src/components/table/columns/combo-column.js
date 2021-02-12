import Column from './edit-column'
import Editor from '../../editor/combo-box.vue'

export default {
  name: 'MusselTableComboColumn',
  extends: Column,
  props: {
    options: {
      type: Array,
      default () {
        return []
      }
    },
    displayField: String,
    getText: null
  },
  methods: {
    getComponentParams () {
      return {
        options: this.options
      }
    },
    getCellText (record) {
      if (this.displayField) {
        return record[this.displayField]
      } else if (this.getText) {
        return this.getText(record)
      } else {
        const v = record[this.field]
        const option = this.options.find(el => el === v || el.value === v)
        return option?.label || option
      }
    }
  },
  editComponent: Editor
}
