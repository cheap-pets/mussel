import Icon from '../icon/index.vue'
import './button.pcss'

export default {
  name: 'MusselButton',
  components: {
    Icon
  },
  props: {
    buttonType: {
      type: String,
      default: 'normal',
      validator (value) {
        return ['normal', 'primary', 'submit', 'danger'].indexOf(value) !== -1
      }
    },
    buttonStyle: {
      type: String,
      default: 'normal',
      validator (value) {
        return ['normal', 'outline', 'text', 'link'].indexOf(value) !== -1
      }
    },
    buttonShape: {
      type: String,
      default: 'normal',
      validator (value) {
        return ['normal', 'round'].indexOf(value) !== -1
      }
    },
    icon: String,
    iconClass: String,
    iconOnly: Boolean,
    caption: String
  },
  computed: {
    isIconOnly () {
      return this.iconOnly ||
        (!this.$slots.default && !this.caption && (this.icon || this.iconClass))
    }
  },
  methods: {
    onClick () {
      this.$emit('click')
    }
  },
  render (h) {
    return (
      <button
        class="mu-button"
        icon-only={ this.isIconOnly }
        button-type={
          this.buttonType === 'normal'
            ? undefined
            : this.buttonType
        }
        button-style={
          this.buttonStyle === 'normal'
            ? undefined
            : this.buttonStyle
        }
        button-shape={
          this.buttonShape === 'normal'
            ? undefined
            : this.buttonShape
        }
        onClick={ this.onClick }>
        {
          this.icon || this.iconClass
            ? <icon icon={ this.icon } icon-class={ this.iconClass } />
            : undefined
        }
        {
          this.$slots.default
            ? (
              this.icon || this.iconClass
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
