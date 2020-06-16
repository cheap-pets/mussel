<template>
  <div class="mu-menu-group" :expanded="expanded">
    <div
      class="mu-menu-group_header mu-button-like"
      @click="onClick"
      @mouseover="onMouseOver"
      @mouseleave="onMouseLeave">
      <slot name="header">
        <mu-icon
          :icon="icon"
          :icon-class="iconClass" />
        {{ title }}
      </slot>
      <mu-icon
        v-if="isExpander || isDropdown"
        trigger-type="expander"
        :trigger-on="expanded" />
    </div>
    <div class="mu-menu-group_body">
      <slot />
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
        expanded: false
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
      onMouseOver () {
        // if (!this.isDropdown) return
      },
      onMouseLeave () {
        // if (!this.isDropdown) return
      },
      expand () {
        this.expanded = true
        const el = this.$el.querySelector('.mu-menu-group_body')
        if (el) {
          const h = el.scrollHeight || 2000
          el.style.maxHeight = h + 'px'
        }
        this.menu?.setExpandedGroup(this)
      },
      collapse () {
        this.expanded = false
        const el = this.$el.querySelector('.mu-menu-group_body')
        if (el) el.style.maxHeight = 0
      },
      toggleExpand () {
        return this.expanded ? this.collapse() : this.expand()
      }
    }
  }
</script>
