import isFunction from 'lodash.isfunction'

import Column from './edit-column'
import Editor from '../../editor/combo-box.vue'

export default {
  name: 'MusselTableComboColumn',
  extends: Column,
  props: {
    displayField: String,
    options: null,
    getText: null
  },
  methods: {
    getComponentParams (record) {
      return {
        autofocus: true,
        value: record[this.field],
        options: isFunction(this.options)
          ? this.options(record)
          : this.options || []
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
