<template>
  <div v-show="visible" class="mu-tab-panel" size="1">
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselTabPanel',
    inject: {
      tabs: {
        default: null
      },
      params: {
        default: null
      }
    },
    props: {
      name: String,
      label: String
    },
    computed: {
      visible () {
        return this.params?.activeName === this.name
      }
    },
    mounted () {
      this.tabs?.mountTab({
        name: this.name,
        label: this.label
      })
    },
    beforeDestroy () {
      this.tabs?.unmountTab({
        name: this.name,
        label: this.label
      })
    }
  }
</script>
