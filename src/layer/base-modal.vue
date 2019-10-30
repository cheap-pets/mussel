<script>
  import './modal.pcss'

  import RenderToBodyMixin from './mix-render-to-body'
  import PopupVisibleMixin from './mix-popup-visible'

  export default {
    name: 'MusselBaseModal',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    props: {
      maskAction: {
        type: String,
        default: 'close',
        validator (value) {
          return ['none', 'close'].indexOf(value) !== -1
        }
      }
    },
    methods: {
      deactivate () {
        if (window.__mussel_modal === this) window.__mussel_modal = null
      },
      onMaskClick (event) {
        if (event.target === this.$el) {
          const action = this.$options.maskAction || this.maskAction
          if (action === 'close') this.hide()
          this.$emit('maskclick')
        }
      },
      show () {
        window.__mussel_modal = this
        this.popupVisible = true
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.popupVisible = false
        this.$emit('hide')
        this.$emit('change', false)
      }
    }
  }
</script>
