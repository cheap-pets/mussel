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
      const o = this.$options
      return {
        params: {
          modalVisible: false,
          dialogVisible: false,
          width: this.width || o.width,
          height: this.height || o.height,
          danger: this.danger || o.danger,
          title: this.title || o.title,
          primaryButton: this.primaryButton || o.primaryButton,
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
      popupVisible (value) {
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
        this.popupVisible = true
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
          this.popupVisible = false
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
