<template>
  <div
    class="mu-dropdown"
    :expanded="popupParams.visible"
    @click="onClick"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave">
    <slot />
    <mu-dropdown-panel
      v-if="!disabled && popupParams.visible"
      v-bind="dropdownParams"
      @change="setPopupVisible"
      @mouseover.native.stop="clearHoverTimer"
      @mouseleave.native.stop="onMouseLeave"
      @click.native.stop="onDropdownClick">
      <slot name="dropdown" />
    </mu-dropdown-panel>
  </div>
</template>

<script>
  import PopupGroupMixin from '../layer/mix-popup-group'
  import DropdownPanel from './dropdown-panel.vue'

  import { isParentElement } from '../utils/dom'

  export default {
    name: 'MusselDropdown',
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
      triggerAction: {
        type: String,
        default: 'hover',
        validator (value) {
          return ['hover', 'click'].indexOf(value) !== -1
        }
      },
      popupClass: {
        type: String,
        default: 'mu-dropdown-list'
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
          iconIndent: p.iconIndent,
          renderToBody: p.renderToBody
        }
      }
    },
    mounted () {
      this.triggerElements = Array.prototype.slice.call(
        this.$el.querySelectorAll('[dropdown-trigger]'),
        0
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
          (result, el) => result || isParentElement(target, el, true),
          false
        )
      },
      onClick (event) {
        if (!this.triggerElements.length || this.findTrigger(event.target)) {
          this.clearHoverTimer()
          this.togglePopup()
        }
      },
      onMouseOver (event) {
        this.clearHoverTimer()
        if (this.triggerAction === 'hover') {
          if (!this.triggerElements.length || this.findTrigger(event.target)) {
            this.showPopup()
          } else {
            this.delayHidePopup()
          }
        }
      },
      onMouseLeave (event) {
        if (this.triggerAction === 'hover') {
          this.delayHidePopup()
        }
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

<style lang="postcss">
  .mu-dropdown {
    position: relative;
    display: inline-block;
    vertical-align: top;
  }
</style>
