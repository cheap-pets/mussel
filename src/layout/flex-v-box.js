import FlexBox from './flex-box.vue'

export default {
  extends: FlexBox,
  computed: {
    flexDirection () {
      return 'column'
    }
  }
}
