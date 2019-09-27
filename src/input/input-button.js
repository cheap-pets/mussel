import Icon from '../icon/index.vue'

export default {
  name: 'MusselInputButton',
  extends: Icon,
  props: {
    clickable: Boolean
  },
  computed: {
    className () {
      return 'mu-input-icon'
    }
  }
}
