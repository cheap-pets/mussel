<template>
  <div
    v-if="popupVisible"
    class="mu-drawer-wrapper"
    :class="maskClass"
    :direction="direction"
    :drawer-visible="drawerVisible"
    @click.native="onMaskClick">
    <slot />
  </div>
</template>

<script>
  import BaseModal from './base-modal.vue'

  export default {
    extends: BaseModal,
    props: {
      mask: String,
      maskAction: String,
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
        drawerVisible: false
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
        if (this.mask !== 'none') window.__mussel_modal = this
        this.$emit('show')
        this.$emit('change', true)
        this.popupVisible = true
        setTimeout(() => {
          this.drawerVisible = true
        }, 10)
      },
      hide () {
        if (this.mask !== 'none') this.deactivate()
        this.drawerVisible = false
        setTimeout(() => {
          this.popupVisible = false
          this.$emit('hide')
          this.$emit('change', false)
        }, 200)
      }
    }
  }
</script>
