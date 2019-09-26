<template>
  <mu-dialog-wrapper>
    123
  </mu-dialog-wrapper>
</template>

<script>
  import Dialog from './dialog.vue'
  export default {
    extends: Dialog,
    title: 'hello world',
    width: '50%',
    height: '35%',
    danger: true,
    maskAction: 'none',
    buttons: [
      {
        caption: '保存',
        buttonType: 'submit'
      },
      {
        caption: '取消',
        action: 'close'
      }
    ],
    beforeClose (next, btn) {
      if (btn && btn.caption === '取消') next()
    }
  }
</script>
