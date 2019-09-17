import Button from './button.jsx'

export default {
  extends: Button,
  computed: {
    isIconOnly () {
      return true
    }
  }
}
