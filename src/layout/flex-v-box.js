import FlexBox from './flex-box.vue'

export default {
  name: 'MusselVBox',
  extends: FlexBox,
  computed: {
    flexDirection () {
      return 'column'
    }
  }
}
