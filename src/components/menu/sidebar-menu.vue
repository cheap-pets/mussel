<template>
  <div class="mu-sidebar-menu">
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselSidebarMenu',
    provide () {
      return {
        sidebar: this,
        menu: this
      }
    },
    methods: {
      setActiveItem (item) {
        if (this.$activeItem !== item) {
          this.$activeItem?.unselect()
          this.$activeItem = item
        }
      }
    }
  }
</script>
