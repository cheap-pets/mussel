<script>
  import isString from 'lodash.isstring'

  import BaseModal from './base-modal.vue'
  import DialogWrapper from './dialog-wrapper.vue'

  export default {
    name: 'MusselBaseDialog',
    components: {
      'mu-dialog-wrapper': DialogWrapper
    },
    extends: BaseModal,
    provide () {
      return {
        dialog: this,
        params: this.params
      }
    },
    props: {
      title: String,
      width: String,
      height: String,
      buttons: Array,
      danger: Boolean,
      primaryButton: String
    },
    data () {
      const { title, width, height, danger, primaryButton } = this.$options
      return {
        params: {
          modalVisible: false,
          dialogVisible: false,
          width: this.width || width,
          height: this.height || height,
          danger: this.danger || danger,
          title: this.title || title,
          primaryButton: this.primaryButton || primaryButton,
          btns: this.btns
        }
      }
    },
    computed: {
      btns () {
        const buttons = this.buttons || this.$options.buttons
        return Array.isArray(buttons)
          ? buttons.map(button => {
            const btn = isString(button)
              ? { caption: button, _rawData: button }
              : { ...button }
            if (this.params.primaryButton === btn.caption) {
              btn.buttonType = this.params.danger ? 'danger' : 'primary'
            }
            return btn
          })
          : null
      }
    },
    watch: {
      modalVisible (value) {
        this.params.modalVisible = value
      },
      buttons: {
        handler () {
          this.params.buttons = this.btns
        },
        immediate: true
      },
      title (value) {
        this.setTitle(value)
      },
      width (value) {
        this.setWidth(value)
      },
      height (value) {
        this.setHeight(value)
      },
      danger (value) {
        this.setDanger(value)
      },
      primaryButton (value) {
        this.setPrimaryButton(value)
      }
    },
    methods: {
      setTitle (value) {
        this.params.title = value
      },
      setWidth (value) {
        this.params.width = value
      },
      setHeight (value) {
        this.params.height = value
      },
      setDanger (value) {
        this.params.danger = value
        this.params.buttons = this.btns
      },
      setPrimaryButton (value) {
        this.params.primaryButton = value
        this.params.buttons = this.btns
      },
      clearHideTimer () {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer)
          this.hideTimer = null
        }
      },
      show (callbackOnce) {
        window.__mussel_modal = this
        this.callbackOnce = callbackOnce
        if (!this.$el) {
          this.$mount()
          document.body.appendChild(this.$el)
        }
        this.clearHideTimer()
        this.modalVisible = true
        setTimeout(() => {
          this.params.dialogVisible = true
        }, 10)
        this.$emit('show')
        this.$emit('change', true)
      },
      actualHide () {
        this.callbackOnce = null
        this.deactivate()
        this.params.dialogVisible = false
        this.clearHideTimer()
        this.$hideTimer = setTimeout(() => {
          this.modalVisible = false
        }, 200)
        this.$emit('hide')
        this.$emit('change', false)
      },
      hide (force, button) {
        if (!force && this.$options.beforeClose) {
          this.$options.beforeClose(this.actualHide, button)
        } else {
          this.actualHide()
        }
      },
      onButtonClick (btn) {
        const { action, _rawData } = Object(btn)
        const button = _rawData || btn
        if (['hide', 'close'].indexOf(action) !== -1) {
          this.hide(false, button)
        }
        this.$emit('buttonclick', button, this)
      }
    }
  }
</script>

<style lang="postcss">
  .mu-dialog {
    position: relative;
    min-width: 200px;
    min-height: 100px;
    background: $dialogBackground;
    opacity: 0;
    box-shadow: $dialogShadow;
    transform: translateY(200px);
    transition: all .2s ease-in-out;

    &[visible]{
      opacity: 1;
      transform: translateY(0);
    }

    &[danger] > .mu-dialog-header {
      border-bottom-color: $dangerColor;
    }
  }

  .mu-dialog-header {
    height: $(dialogHeaderHeightPx)px;
    padding: calc($unitSpacingSizePx * 2)px;
    background: $dialogHeaderBackground;
    border-bottom: $dialogHeaderBorderBottom;

    & > .mu-dialog-title {
      font-size: $dialogTitleFontSize;
      font-weight: 600;
    }
  }

  .mu-dialog-footer {
    margin-top: auto;
    height: $(dialogFooterHeightPx)px;
    background: $dialogFooterBackground;
    padding: 0 calc($unitSpacingSizePx * 2)px;
    & > .mu-button {
      margin-left: $(unitSpacingSizePx)px;
    }
  }

  .mu-dialog-body {
    padding: calc($unitSpacingSizePx * 2)px;
  }
</style>
