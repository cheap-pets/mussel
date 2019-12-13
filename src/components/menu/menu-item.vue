<template>
  <a
    class="mu-menu-item mu-button-like"
    :disabled="disabled"
    :active="selected"
    @click="onClick"
  >
    <slot>
      <mu-icon
        :icon="icon"
        :icon-class="iconClass"
      />
      {{ title }}
    </slot>
  </a>
</template>

<script>
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
      disabled: Boolean
    },
    data () {
      return {
        selected: false
      }
    },
    watch: {
      active: {
        handler (v) {
          if (!v === !this.selected) return
          return v ? this.select() : this.unselect()
        },
        immediate: true
      }
    },
    mounted () {
      if (this.active && this.menuGroup?.isExpander) {
        this.menuGroup.expand()
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
        this.selected = true
        this.menu?.setActiveItem(this)
        if (!this.active) this.$emit('change', true)
      },
      unselect () {
        this.selected = false
        if (this.active) this.$emit('change', false)
      }
    }
  }
</script>
