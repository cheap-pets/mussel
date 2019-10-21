import Icon from '../icon/index.vue'

export default {
  name: 'MusselEditorIcon',
  extends: Icon,
  props: {
    clickable: Boolean
  },
  computed: {
    className () {
      return 'mu-editor-icon'
    }
  }
}
