import './button.pcss'

import Icon from '../icon/icon.vue'

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
    caption: String
  },
  computed: {
    hasIcon () {
      return !!(this.icon || this.iconClass)
    },
    iconOnly () {
      return !this.$slots.default && !this.caption && this.hasIcon
    },
    buttonClass () {
      return 'mu-button' + (this.iconOnly ? ' mu-icon-button' : '')
    }
  },
  methods: {
    onClick (event) {
      this.$emit('click', event)
    }
  },
  render (h) {
    if (this.iconOnly) {
      console.warn(
        'use MusselIconButton instead of MusselButton which contains a solo icon.'
      )
    }
    return (
      <button
        class={ this.buttonClass }
        button-type={ this.buttonType }
        button-style={ this.buttonStyle }
        button-shape={ this.buttonShape }
        onClick={ this.onClick }>
        {
          this.hasIcon
            ? <icon
              icon={ this.icon }
              icon-class={ this.iconClass } />
            : undefined
        }
        {
          this.$slots.default
            ? (
                this.hasIcon
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
