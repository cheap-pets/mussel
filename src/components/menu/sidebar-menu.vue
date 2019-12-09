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
        sidebar: this
      }
    }
  }
</script>
