<template>
  <span
    class="mu-icon"
    :icon="icon"
    :class="iconClass"
    @click="onClick"
    v-html="html" />
</template>

<script>
  import './icon.pcss'

  import icons from './tabler-icons'

  export default {
    name: 'MusselIcon',
    props: {
      svg: String,
      icon: String,
      iconClass: String
    },
    computed: {
      html () {
        return this.svg || icons[this.icon]
      }
    },
    methods: {
      onClick () {
        this.$emit('click')
      }
    }
  }
</script>
