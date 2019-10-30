<template>
  <div
    class="mu-expander"
    :expanded="actualExpanded"
    @click="onClick">
    <slot name="header">
      <div class="mu-expander-header" expand-trigger>
        {{ title }}
        <mu-icon trigger-type="expander" style="margin-left: 8px;" />
      </div>
    </slot>
    <div
      v-show="!disabled"
      class="mu-expand-panel"
      @click.stop>
      <slot />
    </div>
  </div>
</template>

<script>
  import './expander.pcss'
  import { isParentElement } from '../utils/dom'

  export default {
    name: 'MusselExpander',
    model: {
      prop: 'expanded',
      event: 'change'
    },
    props: {
      disabled: Boolean,
      expanded: Boolean,
      title: String
    },
    data () {
      return {
        actualExpanded: false
      }
    },
    watch: {
      expanded: {
        handler (value) {
          this.actualExpanded = value
        },
        immediate: true
      }
    },
    mounted () {
      this.triggerElements = Array.prototype.slice.call(
        this.$el.querySelectorAll('[expand-trigger]'),
        0
      )
    },
    methods: {
      findTrigger (target) {
        return this.triggerElements.reduce(
          (result, el) => result || isParentElement(target, el, true),
          false
        )
      },
      onClick (event) {
        if (this.disabled) return
        if (!this.triggerElements.length || this.findTrigger(event.target)) {
          this.toggleExpand()
        }
      },
      toggleExpand () {
        this.actualExpanded = !this.actualExpanded
        this.$emit('change', this.actualExpanded)
      }
    }
  }
</script>
