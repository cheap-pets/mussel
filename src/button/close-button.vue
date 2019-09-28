<script>
  import Icon from '../icon/index.vue'

  export default {
    name: 'MusselCloseButton',
    extends: Icon,
    props: {
      triggerType: {
        type: String,
        default: 'close'
      }
    }
  }
</script>

<style lang="postcss">
  .mu-close-button {
    cursor: pointer;

    &.window-close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;
    }
  }
</style>
