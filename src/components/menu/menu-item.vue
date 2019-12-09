<template>
  <a class="mu-menu-item mu-text-ellipsis" :disabled="disabled">
    <slot>
      <mu-icon
        :icon="icon"
        :icon-class="iconClass"
        @click="onIconClick" />
      {{ title }}
    </slot>
  </a>
</template>

<script>
  export default {
    name: 'MusselMenuItem',
    props: {
      icon: String,
      iconClass: String,
      title: String,
      disabled: Boolean
    },
    methods: {
      onIconClick () {
        if (!this.disabled) this.$emit('click')
      }
    }
  }
</script>
