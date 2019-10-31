import FlexBox from './flex-box.vue'

export default {
  name: 'MusselVBox',
  extends: FlexBox,
  props: ['layout', 'direction'],
  computed: {
    flexLayout () {
      return 'column'
    }
  }
}
