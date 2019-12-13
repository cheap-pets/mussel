<template>
  <div class="mu-menu-group" :expanded="expanded">
    <div
      class="mu-menu-group_header mu-button-like"
      @click="onClick"
      @mouseover="onMouseOver"
      @mouseleave="onMouseLeave"
    >
      <slot name="header">
        <mu-icon
          :icon="icon"
          :icon-class="iconClass" />
        {{ title }}
      </slot>
      <mu-icon
        v-if="isExpander || isDropdown"
        trigger-type="expander"
        :trigger-on="expanded"
      />
    </div>
    <template v-if="isDropdown">
      <div class="mu-menu-group_body">
        <slot />
      </div>
    </template>
    <template v-else>
      <div class="mu-menu-group_body">
        <slot />
      </div>
    </template>
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
      }
    },
    methods: {
      onClick () {
        if (!this.isExpander) return
        this.toggleExpand()
      },
      onMouseOver () {
        if (!this.isDropdown) return
      },
      onMouseLeave () {
        if (!this.isDropdown) return
      },
      expand () {
        this.expanded = true
        const el = this.$el.querySelector('.mu-menu-group_body')
        if (el) el.style.maxHeight = el.scrollHeight + 'px'
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
