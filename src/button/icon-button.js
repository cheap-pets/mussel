import Button from './button.jsx'

export default {
  name: 'MusselIconButton',
  extends: Button,
  computed: {
    isIconOnly () {
      return true
    }
  }
}
