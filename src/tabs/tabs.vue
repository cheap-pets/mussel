<template>
  <div class="mu-tabs mu-flex-box" :direction="direction">
    <tabs-header
      :tab-items="items"
      :active-tab="activeName"
      :tab-position="tabPosition">
      <slot name="header" />
    </tabs-header>
    <div size="auto">
      <slot />
    </div>
  </div>
</template>

<script>
  import TabsHeader from './tabs-header.vue'

  export default {
    components: {
      TabsHeader
    },
    provide () {
      return {
        tabs: this
      }
    },
    model: {
      prop: 'activeTab',
      event: 'change'
    },
    props: {
      tabItems: Array,
      tabPosition: {
        type: String,
        default: 'top',
        validator (v) {
          return ['top', 'bottom', 'left', 'right'].indexOf(v) !== -1
        }
      },
      activeTab: String
    },
    data () {
      return {
        activeName: '',
        mountedTabs: []
      }
    },
    computed: {
      direction () {
        let v
        switch (this.tabPosition) {
          case 'left':
            v = 'row'
            break
          case 'right':
            v = 'row-reverse'
            break
          case 'bottom':
            v = 'column-reverse'
            break
          default:
            v = 'column'
        }
        return v
      },
      items () {
        return this.tabItems || this.mountedTabs
      }
    },
    watch: {
      activeTab: {
        handler (value) {
          this.activeName = value
        },
        immediate: true
      }
    },
    methods: {
      mountTab (tab) {
        const idx = this.mountedTabs.findIdx(item => tab.name === item.name)
        if (idx === -1) this.mountedTabs.push(tab)
      },
      unmountTab (tab) {
        const idx = this.mountedTabs.findIdx(item => tab.name === item.name)
        if (idx !== -1) this.mountedTabs.splice(idx, 1)
      },
      select (name) {
        if (this.activeName !== name) {
          this.activeName = name
          this.$emit('change', name)
        }
      }
    }
  }
</script>

<style lang="postcss">
  .mu-tabs {
    background: $tabsBackground;
  }
</style>
