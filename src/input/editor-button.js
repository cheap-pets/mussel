import Icon from '../icon/index.vue'

export default {
  name: 'MusselEditorButton',
  extends: Icon,
  props: {
    clickable: Boolean
  },
  computed: {
    className () {
      return 'mu-editor-button'
    }
  }
}
