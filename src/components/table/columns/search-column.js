import Column from './edit-column'
import Editor from '../../editor/search-box.vue'

export default {
  name: 'MusselTableSearchColumn',
  extends: Column,
  props: {
    displayField: String,
    getText: null,
    options: {
      type: Array,
      default () {
        return []
      }
    }
  },
  methods: {
    getComponentParams (record) {
      return {
        autofocus: true,
        valueMode: 'select',
        options: this.options,
        value: {
          value: record[this.field],
          label: this.getCellText(record)
        }
      }
    },
    getCellText (record) {
      return this.displayField
        ? record[this.displayField]
        : (
            this.getText
              ? this.getText(record)
              : record[this.field]
          )
    },
    onSearch (value) {
      this.$emit('search', value)
    }
  },
  editComponent: Editor
}
