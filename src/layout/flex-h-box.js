import FlexBox from './flex-box.vue'

export default {
  name: 'MusselHBox',
  extends: FlexBox,
  props: ['layout', 'direction'],
  computed: {
    flexLayout () {
      return 'row'
    }
  }
}
