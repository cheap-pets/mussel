<template>
  <div class="mu-menu-group" :expanded="expanded">
    <div
      class="mu-menu-group_header mu-button-like"
      @click="onClick">
      <slot name="header">
        <mu-icon :icon="icon" :icon-class="iconClass" />
        {{ title }}
      </slot>
      <mu-icon
        v-if="isExpander || isDropdown"
        icon="dropdown"
        :expanded="expanded" />
    </div>
    <div class="mu-menu-group_body" :style="{ height: wrapperHeight }">
      <div ref="wrapper">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'MusselMenuGroup',
    provide () {
      return {
        menuGroup: this
      }
    },
    inject: {
      sidebar: {
        default: null
      },
      menu: {
        default: null
      },
      menuGroup: {
        default: null
      }
    },
    props: {
      icon: String,
      iconClass: String,
      title: String
    },
    data () {
      return {
        expanded: false,
        wrapperHeight: this.isExpander ? 0 : undefined
      }
    },
    computed: {
      isExpander () {
        return this.sidebar && !this.menuGroup
      },
      isDropdown () {
        return !this.sidebar && !this.menuGroup
      },
      expandedSilbling () {
        return (this.menu?.accordion && this.isExpander)
          ? this.sidebar.expandedGroup
          : null
      }
    },
    watch: {
      expandedSilbling (v) {
        if (v && v !== this && this.expanded) this.collapse()
      }
    },
    methods: {
      onClick () {
        if (!this.isExpander) return
        this.toggleExpand()
      },
      expand () {
        this.expanded = true
        this.menu?.setExpandedGroup(this)
        this.wrapperHeight = `${this.$refs.wrapper.offsetHeight}px`
      },
      collapse () {
        this.expanded = false
        this.wrapperHeight = 0
      },
      toggleExpand () {
        return this.expanded ? this.collapse() : this.expand()
      }
    }
  }
</script>
