import FlexBox from './flex-box.vue'

export default {
  name: 'MusselHBox',
  extends: FlexBox,
  computed: {
    flexDirection () {
      return 'row'
    }
  }
}
