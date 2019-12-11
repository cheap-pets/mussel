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
      keepAlive: Boolean,
      primaryButton: String,
      footer: {
        type: Boolean,
        default: true
      },
      draggable: {
        type: Boolean,
        default: true
      }
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
          btns: this.btns,
          keepAlive: this.keepAlive || o.keepAlive,
          footer: this.footer !== false && o.footer !== false,
          primaryButton: this.primaryButton || o.primaryButton,
          draggable: !(this.draggable === false || o.draggable === false)
        }
      }
    },
    computed: {
      btns () {
        const buttons = this.buttons || this.$options.buttons
        const { primaryButton } = this.params
        return Array.isArray(buttons)
          ? buttons.map(button => {
            const btn = isString(button)
              ? { caption: button, _rawData: button }
              : { ...button }
            if (primaryButton && !btn.buttonType &&
              ([btn.id, btn.caption].indexOf(primaryButton) !== -1)) {
              btn.buttonType = this.params.danger ? 'danger' : 'primary'
            }
            return btn
          })
          : null
      }
    },
    watch: {
      // popupVisible (value) {
      //   this.params.modalVisible = value
      // },
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
      show () {
        window.__mussel_modal = this
        this.clearHideTimer()
        this.popupVisible = true
        if (!this.$el) {
          this.$mount()
          document.body.appendChild(this.$el)
        }
        this.params.modalVisible = true
        setTimeout(() => {
          this.params.dialogVisible = true
        }, 10)
        this.$emit('show')
        this.$emit('change', true)
      },
      actualHide (button) {
        this.clearHideTimer()
        this.popupVisible = false
        this.params.dialogVisible = false
        this.deactivate()
        this.$hideTimer = setTimeout(() => {
          this.params.modalVisible = false
        }, 200)
        this.$emit('hide', button)
        this.$emit('change', false)
      },
      hide (force, button) {
        if (!force && this.$options.beforeClose) {
          this.$options.beforeClose(this.actualHide, button)
        } else {
          this.actualHide(button)
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
