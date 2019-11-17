<template>
  <mu-dialog-wrapper class="mu-message-box">
    <div v-html="message" />
  </mu-dialog-wrapper>
</template>

<script>
  import BaseDialog from '../layer/base-dialog.vue'

  export default {
    name: 'MusselMessageBox',
    extends: BaseDialog,
    methods: {
      hide (button) {
        this.actualHide(button)
        setTimeout(() => {
          this.$el.parentNode.removeChild(this.$el)
          this.$destroy()
        }, 500)
      },
      onButtonClick (button) {
        this.hide(button.id)
      }
    }
  }
</script>
