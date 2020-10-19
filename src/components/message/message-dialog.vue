<template>
  <mu-dialog-wrapper class="mu-message-box">
    <div v-html="$options.message" />
  </mu-dialog-wrapper>
</template>

<script>
  import BaseDialog from '../dialog/base-dialog.vue'

  export default {
    name: 'MusselMessageBox',
    extends: BaseDialog,
    methods: {
      hide (force, button) {
        this.actualHide(button)
        setTimeout(() => {
          this.$el.parentNode.removeChild(this.$el)
          this.$destroy()
        }, 500)
      },
      onButtonClick (button) {
        this.hide(null, button.id || button)
      }
    }
  }
</script>
