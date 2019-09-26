<script>
  import RenderToBodyMixin from './mix-render-to-body'
  import VisibleModelMixin from './mix-visible-model'

  export default {
    name: 'MusselBaseModal',
    mixins: [RenderToBodyMixin, VisibleModelMixin],
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
        this.modalVisible = true
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.modalVisible = false
        this.$emit('hide')
        this.$emit('change', false)
      }
    }
  }
</script>

<style lang="postcss">
  .mu-modal-mask {
    position: absolute;
    z-index: 100;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: none;
    background: $modalMaskBackground;

    &[visible] {
      display: 'block';
    }
    &.mu-flex-box[visible] {
      display: flex;
    }
  }

  body > .mu-modal-mask {
    position: fixed;
  }
</style>
