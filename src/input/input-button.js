import Icon from '../icon/index.vue'

export default {
  name: 'MusselInputButton',
  extends: Icon,
  props: {
    icon: {
      type: String,
      default () {
        return this.iconClass ? undefined : 'key-down'
      }
    },
    buttonType: String
  },
  computed: {
    iconType () {
      return this.buttonType || 'icon'
    },
    className () {
      return 'mu-input-icon' + (this.iconClass ? ` ${this.iconClass}` : '')
    }
  },
  methods: {
    onClick () {
      this.$emit('click')
    }
  }
}
