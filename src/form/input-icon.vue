<template>
  <span class="mu-input-icon" :icon="icon">
    <mu-icon :icon="icon" />
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
        default: 'key-down'
      }
    }
  }
</script>
