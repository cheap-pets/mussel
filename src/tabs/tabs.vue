<template>
  <div
    class="mu-tabs mu-flex-box"
    :direction="direction"
    :tab-position="tabPosition">
    <tabs-header
      :tab-items="items"
      :active-tab="params.activeName"
      :tab-position="tabPosition">
      <slot name="header" />
    </tabs-header>
    <slot />
  </div>
</template>

<script>
  import TabsHeader from './tabs-header.vue'

  export default {
    name: 'MusselTabs',
    components: {
      TabsHeader
    },
    provide () {
      return {
        tabs: this,
        params: this.params
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
        params: {
          activeName: ''
        },
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
          this.params.activeName = value
        },
        immediate: true
      }
    },
    methods: {
      mountTab (tab) {
        const idx = this.mountedTabs.findIndex(item => tab.name === item.name)
        if (idx === -1) this.mountedTabs.push(tab)
      },
      unmountTab (tab) {
        const idx = this.mountedTabs.findIndex(item => tab.name === item.name)
        if (idx !== -1) this.mountedTabs.splice(idx, 1)
      },
      select (name) {
        if (this.params.activeName !== name) {
          this.params.activeName = name
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
