<template>
  <div class="mu-menu-group" :expanded="expanded">
    <div
      class="mu-menu-group_header"
      :selectable="selectable"
      :active="isActive"
      @click="onClick">
      <slot name="header">
        <mu-icon
          :icon="icon"
          :icon-class="iconClass" />
        {{ title }}
      </slot>
      <mu-icon
        v-if="isExpander || isDropdown"
        icon="dropdown"
        :expanded="expanded"
        @click.native.stop="onIconClick" />
    </div>
    <div class="mu-menu-group_body" :style="{ height: wrapperHeight }">
      <div ref="wrapper">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
  import delay from '@/utils/delay'

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
      title: String,
      selectable: Boolean,
      active: Boolean
    },
    data () {
      return {
        expanded: false,
        selected: false,
        wrapperHeight: 0
      }
    },
    computed: {
      isActive () {
        return this.menu?.selectMode === 'auto'
          ? this.selected
          : this.active
      },
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
      },
      active: {
        handler (v) {
          if (!v === !this.selected) return
          if (v) this.select()
          else this.unselect()
        },
        immediate: true
      }
    },
    mounted () {
      this.wrapperHeight = this.isExpander && !this.expanded ? 0 : undefined
    },
    methods: {
      onClick () {
        if (this.selectable) {
          if (!this.disabled) {
            this.$emit('click')
            this.select()
          }
        } else if (this.isExpander) {
          this.toggleExpand()
        }
      },
      onIconClick () {
        if (this.isExpander) this.toggleExpand()
      },
      expand () {
        this.expanded = true
        this.menu?.setExpandedGroup(this)
        this.wrapperHeight = `${this.$refs.wrapper.offsetHeight}px`
      },
      collapse () {
        if (this.wrapperHeight === undefined) {
          this.wrapperHeight = `${this.$refs.wrapper.offsetHeight}px`
        }
        delay(1).then(() => {
          this.expanded = false
          this.wrapperHeight = 0
        })
      },
      toggleExpand () {
        return this.expanded ? this.collapse() : this.expand()
      },
      select () {
        if (this.menu?.selectMode === 'auto') {
          this.selected = true
          this.menu?.setActiveItem(this)
        }
        if (!this.active) this.$emit('change', true)
      },
      unselect () {
        if (this.menu?.selectMode === 'auto') {
          this.selected = false
        }
        if (this.active) this.$emit('change', false)
      }
    }
  }
</script>
