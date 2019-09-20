import ListItem from '../list/list-item.vue'

export default {
  extends: ListItem,
  inject: {
    inputBox: {
      default: null
    }
  },
  props: {
    value: String
  },
  computed: {
    caption () {
      return this.label === undefined ? this.value : this.label
    }
  },
  methods: {
    onClick () {
      if (this.disabled) return
      if (this.inputBox) {
        this.inputBox.selectOption({
          value: this.value,
          label: this.label
        })
      }
      this.$emit('click')
    }
  }
}
