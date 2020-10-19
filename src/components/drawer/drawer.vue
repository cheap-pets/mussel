<template>
  <div v-if="popupVisible"
    class="mu-drawer-wrapper"
    :class="{ 'mu-modal-mask': maskVisible }"
    :position="position"
    :popup="drawerPopup"
    @click.stop="onMaskClick">
    <slot v-if="slotWrapper === 'none'" />
    <div v-else
      class="mu-drawer"
      :class="drawerClass"
      :style="drawerStyles">
      <slot />
    </div>
  </div>
</template>

<script>
  import BaseModal from '../modal/base-modal.vue'

  import { isParentElement, hasMaskParent } from '../../utils/dom'
  import { assignIfDefined } from '../../utils/assign-if-defined'

  export default {
    name: 'MusselDrawer',
    extends: BaseModal,
    props: {
      width: String,
      height: String,
      margin: String,
      drawerClass: null,
      drawerStyle: Object,
      slotWrapper: String,
      mask: {
        type: [String, Boolean],
        default: true
      },
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
      maskVisible () {
        return ['none', 'false'].indexOf(String(this.mask)) === -1
      },
      drawerStyles () {
        return assignIfDefined(
          {
            ...this.drawerStyle
          },
          {
            width: this.width,
            height: this.height,
            margin: this.margin
          }
        )
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
          !hasMaskParent(triggerEl) &&
          !isParentElement(triggerEl, this.$el) &&
          triggerEl.className.indexOf('mu-modal-mask') === -1
        ) this.hide()
      }
    }
  }
</script>
