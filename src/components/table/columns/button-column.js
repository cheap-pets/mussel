import isFunction from 'lodash.isfunction'

import Column from './column'
import Buttons from './buttons.vue'

export default {
  name: 'MusselTableButtonColumn',
  extends: Column,
  cellClass: 'mu-table_buttons-cell',
  props: {
    buttons: null
  },
  methods: {
    getComponentParams (record) {
      return {
        buttons: isFunction(this.buttons)
          ? this.buttons(record)
          : this.buttons || []
      }
    },
    onButtonClick (record, button) {
      this.$emit('buttonclick', record, button)
    }
  },
  cellComponent: Buttons
}
