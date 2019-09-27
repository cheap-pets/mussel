<script>
  import Icon from '../icon/index.vue'

  export default {
    name: 'MusselCloseButton',
    extends: Icon,
    props: {
      icon: {
        type: String,
        default: 'close'
      }
    },
    computed: {
      className () {
        return 'mu-close-button'
      }
    }
  }
</script>

<style lang="postcss">
  .mu-close-button {
    color: $textHalfDark;
    fill: $textHalfDark;
    cursor: pointer;

    &.window-close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;
    }

    &:hover {
      fill: $buttonDangerHoverColor;
      color: $buttonDangerHoverColor;
      transform: scale(1.25);
    }
  }
</style>
