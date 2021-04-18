<template>
  <a
    class="mu-menu-item"
    :disabled="disabled"
    :active="isActive"
    @click="onClick">
    <slot>
      <mu-icon
        :icon="icon"
        :icon-class="iconClass" />
      {{ title }}
    </slot>
  </a>
</template>

<script>
  import './menu.pcss'

  export default {
    name: 'MusselMenuItem',
    inject: {
      menu: {
        default: null
      },
      menuGroup: {
        default: null
      }
    },
    model: {
      prop: 'active',
      event: 'change'
    },
    props: {
      icon: String,
      iconClass: String,
      title: String,
      active: Boolean,
      disabled: Boolean,
      data: null
    },
    data () {
      return {
        selected: false
      }
    },
    computed: {
      isActive () {
        return this.menu?.selectMode === 'auto'
          ? this.selected
          : this.active
      }
    },
    watch: {
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
      if (this.active) {
        const group = this.menuGroup
        if (group?.isExpander) group.expand()
        else if (group?.menuGroup?.isExpander) group.menuGroup.expand()
      }
    },
    methods: {
      onClick () {
        if (!this.disabled) {
          this.$emit('click')
          this.select()
        }
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
