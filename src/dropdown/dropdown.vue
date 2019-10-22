<template>
  <div
    class="mu-dropdown"
    @click="onClick"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave">
    <slot />
    <mu-dropdown-panel
      v-if="!disabled && popupParams.visible"
      v-bind="dropdownParams"
      @change="setPopupVisible"
      @mouseover.native="onMouseOver"
      @mouseleave.native="onMouseLeave"
      @click.native.stop="onDropdownClick">
      <slot name="dropdown" />
    </mu-dropdown-panel>
  </div>
</template>

<script>
  import PopupGroupMixin from '../layer/mix-popup-group'
  import DropdownPanel from './dropdown-panel.vue'

  export default {
    components: {
      'mu-dropdown-panel': DropdownPanel
    },
    provide () {
      return {
        dropdown: this
      }
    },
    mixins: [PopupGroupMixin],
    props: {
      disabled: Boolean,
      trigger: {
        type: String,
        default: 'hover',
        validator (value) {
          return ['hover', 'click'].indexOf(value) !== -1
        }
      }
    },
    computed: {
      dropdownParams () {
        const p = this.popupParams
        return {
          width: p.width,
          height: p.height,
          visible: p.visible,
          className: p.className,
          renderToBody: p.renderToBody
        }
      }
    },
    methods: {
      clearHoverTimer () {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer)
          delete this.hoverTimer
        }
      },
      onClick () {
        this.clearHoverTimer()
        this.togglePopup()
      },
      onMouseOver () {
        if (this.trigger === 'hover') {
          this.clearHoverTimer()
          this.setPopupVisible(true)
        }
      },
      onMouseLeave () {
        if (this.trigger === 'hover') {
          this.hoverTimer = setTimeout(() => {
            this.setPopupVisible(false)
          }, 200)
        }
      },
      onDropdownClick () {

      }
    }
  }
</script>

<style lang="postcss">
  .mu-dropdown {
    position: relative;
    display: inline-block;
  }
</style>
