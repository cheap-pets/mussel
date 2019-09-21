import ListItem from '../list/list-item.vue'

export default {
  extends: ListItem,
  inject: {
    inputBox: {
      default: null
    }
  },
  props: {
    value: String,
    fields: Array,
    option: [String, Number, Object]
  },
  computed: {
    valueField () {
      return Object(this.fields).value || 'value'
    },
    labelField () {
      return Object(this.fields).label || 'label'
    },
    val () {
      const v =
        this.value === undefined
          ? Object(this.option)[this.valueField]
          : this.value
      return v === undefined ? this.option : v
    },
    caption () {
      const label =
        this.label === undefined
          ? Object(this.option)[this.labelField]
          : this.label
      return label || this.val
    }
  },
  methods: {
    onClick () {
      if (this.disabled) return
      if (this.inputBox) {
        this.inputBox.toggleOption(this.option || this.val)
      }
      this.$emit('click')
    }
  }
}
