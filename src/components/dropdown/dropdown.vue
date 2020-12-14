<template>
  <div
    class="mu-dropdown"
    :expanded="popupParams.visible"
    @click="onClick"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave">
    <slot />
    <mu-dropdown-panel
      v-show="!disabled"
      v-bind="popupParams"
      @change="setPopupVisible"
      @mouseover.native.stop="clearHoverTimer"
      @mouseleave.native.stop="onMouseLeave"
      @click.native.stop="onDropdownClick">
      <slot name="dropdown" />
    </mu-dropdown-panel>
  </div>
</template>

<script>
  import './dropdown.pcss'

  import PopupGroupMixin from '@mixins/mix-popup-group'
  import DropdownPanel from './dropdown-panel.vue'

  export default {
    name: 'MusselDropdown',
    components: {
      'mu-dropdown-panel': DropdownPanel
    },
    mixins: [PopupGroupMixin],
    provide () {
      return {
        dropdown: this
      }
    },
    props: {
      disabled: Boolean,
      triggerAction: {
        type: String,
        default: 'hover',
        validator (value) {
          return ['hover', 'click'].indexOf(value) !== -1
        }
      },
      popupStyle: {
        type: String,
        default: 'dropdown-list'
      }
    },
    mounted () {
      this.triggerElements = Array.from(
        this.$el.querySelectorAll('[dropdown-trigger]')
      )
    },
    methods: {
      clearHoverTimer () {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer)
          delete this.hoverTimer
        }
      },
      delayHidePopup () {
        this.hoverTimer = setTimeout(() => {
          this.setPopupVisible(false)
        }, 200)
      },
      findTrigger (target) {
        return this.triggerElements.reduce(
          (result, el) => result || el === target || el.contains(target),
          false
        )
      },
      onClick (event) {
        if (this.disabled) return
        if (this.triggerAction === 'click' &&
          (!this.triggerElements.length || this.findTrigger(event.target))) {
          this.clearHoverTimer()
          this.togglePopup()
        }
      },
      onMouseOver (event) {
        if (this.disabled) return
        this.clearHoverTimer()
        const { target } = event
        const triggerCount = this.triggerElements.length
        if (this.triggerAction === 'hover' &&
          (!triggerCount || this.findTrigger(target))) {
          this.showPopup()
        } else if (triggerCount && !this.findTrigger(target)) {
          this.delayHidePopup()
        }
      },
      onMouseLeave (event) {
        this.clearHoverTimer()
        this.delayHidePopup()
      },
      onDropdownClick () {
      },
      onItemClick (item) {
        this.hidePopup()
        this.$emit('itemclick', item)
      }
    }
  }
</script>
