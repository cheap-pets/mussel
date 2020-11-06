<template>
  <div
    class="mu-expander"
    :expanded="actualExpanded"
    @click="onClick">
    <slot name="header">
      <div class="mu-expander_header" expand-trigger>
        {{ title }}
        <mu-icon icon="dropdown" :expanded="actualExpanded" />
      </div>
    </slot>
    <div
      v-show="!disabled"
      class="mu-expander_wrapper"
      :style="{ height: wrapperHeight }">
      <div class="mu-expander_panel" @click.stop>
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
  import { isParentElement } from '@utils/dom'

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
        actualExpanded: false,
        wrapperHeight: 0
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

        const panelEl = this.$el.querySelector('.mu-expander_panel')

        this.wrapperHeight = (this.actualExpanded && panelEl)
          ? `${panelEl.offsetHeight}px`
          : 0

        this.$emit('change', this.actualExpanded)
      }
    }
  }
</script>
