<template>
  <div
    v-if="popupVisible"
    class="mu-drawer-wrapper"
    :class="maskClass"
    :position="position"
    :popup="drawerPopup"
    @click.stop="onMaskClick">
    <slot />
  </div>
</template>

<script>
  import BaseModal from '../layer/base-modal.vue'

  import { isParentElement } from '../../utils/dom'

  export default {
    name: 'MusselDrawer',
    extends: BaseModal,
    props: {
      mask: String,
      position: {
        type: String,
        default: 'right',
        validate (v) {
          return ['top', 'right', 'bottom', 'left'].indexOf(v) !== -1
        }
      }
    },
    data () {
      return {
        drawerPopup: false
      }
    },
    computed: {
      maskClass () {
        return this.mask === 'none' ? undefined : 'mu-modal-mask'
      },
      direction () {
        return ['top', 'bottom'].indexOf(this.position) !== -1
          ? 'column'
          : 'row'
      }
    },
    methods: {
      show () {
        if (this.mask === 'none') window.__mussel_drawer = this
        else window.__mussel_modal = this
        this.$emit('show')
        this.$emit('change', true)
        if (this.__visibleTimer) {
          clearTimeout(this.__visibleTimer)
        }
        this.popupVisible = true
        this.__visibleTimer = setTimeout(() => {
          this.drawerPopup = true
        }, 10)
      },
      hide () {
        if (this.mask === 'none') {
          if (window.__mussel_drawer === this) window.__mussel_drawer = null
        } else if (window.__mussel_modal === this) {
          window.__mussel_modal = null
        }
        if (this.__visibleTimer) {
          clearTimeout(this.__visibleTimer)
        }
        this.drawerPopup = false
        this.__visibleTimer = setTimeout(() => {
          this.popupVisible = false
          this.$emit('hide')
          this.$emit('change', false)
        }, 200)
      },
      hideIf (triggerEl) {
        if (
          !isParentElement(triggerEl, this.$el) &&
          triggerEl.className.indexOf('mu-modal-mask') === -1
        ) this.hide()
      }
    }
  }
</script>
