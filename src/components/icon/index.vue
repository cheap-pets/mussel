<template>
  <span
    class="mu-icon"
    :icon="icon"
    :class="iconClass"
    :trigger-type="triggerType"
    @click="onClick"
    v-html="html" />
</template>

<script>
  import icons from './tabler-icons'

  const triggerIcons = {
    close: 'x',
    clear: 'x',
    dropdown: 'key-down',
    expander: 'key-down'
  }

  export default {
    name: 'MusselIcon',
    props: {
      svg: String,
      icon: String,
      iconClass: String,
      triggerType: String
    },
    computed: {
      html () {
        return this.svg || icons[triggerIcons[this.triggerType] || this.icon]
      }
    },
    methods: {
      onClick () {
        this.$emit('click')
      }
    }
  }
</script>
