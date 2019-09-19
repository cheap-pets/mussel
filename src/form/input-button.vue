<template>
  <span
    class="mu-input-icon"
    :type="buttonType || 'icon'"
    :icon="icon"
    @click="onClick">
    <mu-icon v-if="!iconClass" :icon="icon" />
  </span>
</template>

<script>
  import Icon from '../icon/index.vue'

  export default {
    components: {
      'mu-icon': Icon
    },
    props: {
      icon: {
        type: String,
        default () {
          return this.iconClass ? undefined : 'key-down'
        }
      },
      iconClass: String,
      buttonType: String
    },
    methods: {
      onClick () {
        if (this.buttonType === 'button') this.$emit('click')
      }
    }
  }
</script>
