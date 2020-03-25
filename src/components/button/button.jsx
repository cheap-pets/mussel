import Icon from '../icon/index.vue'

export default {
  name: 'MusselButton',
  components: {
    Icon
  },
  props: {
    buttonType: {
      type: String,
      validator (value) {
        return ['normal', 'primary', 'submit', 'danger'].indexOf(value) !== -1
      }
    },
    buttonStyle: {
      type: String,
      validator (value) {
        return ['normal', 'outline', 'text', 'link'].indexOf(value) !== -1
      }
    },
    buttonShape: {
      type: String,
      validator (value) {
        return ['normal', 'round'].indexOf(value) !== -1
      }
    },
    icon: String,
    iconClass: String,
    triggerType: String,
    iconOnly: Boolean,
    caption: String
    // stopPropagation: Boolean
  },
  computed: {
    isIconOnly () {
      return this.iconOnly ||
        (
          !this.$slots.default &&
          !this.caption &&
          (this.icon || this.iconClass || this.triggerType))
    }
  },
  methods: {
    onClick (event) {
      // if (this.stopPropagation) event.stopPropagation()
      this.$emit('click', event)
    }
  },
  render (h) {
    return (
      <button
        class="mu-button mu-text-ellipsis"
        button-type={ this.buttonType }
        button-style={ this.buttonStyle }
        button-shape={ this.buttonShape }
        icon-only={ this.isIconOnly }
        onClick={ this.onClick }>
        {
          this.icon || this.iconClass || this.triggerType
            ? <icon
              icon={ this.icon }
              icon-class={ this.iconClass }
              trigger-type={ this.triggerType } />
            : undefined
        }
        {
          this.$slots.default
            ? (
              this.icon || this.iconClass || this.triggerType
                ? <span>{ this.$slots.default }</span>
                : this.$slots.default
            )
            : (
              this.caption
                ? <span>{ this.caption }</span>
                : undefined
            )
        }
      </button>
    )
  }
}
