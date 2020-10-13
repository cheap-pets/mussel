<script>
  import Icon from '../icon/icon.vue'

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
