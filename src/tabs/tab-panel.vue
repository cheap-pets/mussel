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
      tabParams: {
        default: null
      }
    },
    props: {
      name: String,
      label: String
    },
    computed: {
      visible () {
        return this.tabParams?.activeName === this.name
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
