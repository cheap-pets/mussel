import ListItem from '../list/list-item.vue'

export default {
  name: 'MusselDropdownItem',
  extends: ListItem,
  inject: {
    dropdown: {
      default: null
    }
  },
  methods: {
    onClick () {
      this.dropdown?.onItemClick({
        value: this.value,
        label: this.label
      })
      this.$emit('click')
    }
  }
}
