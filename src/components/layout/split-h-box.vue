<template>
  <div class="flex flex-row">
    <div
      class="mu-split-pane"
      :style="startStyle"
      :collapsible="startCollapsible || null">
      <slot name="start" />
    </div>
    <mu-flex-splitter v-bind="splitterProps" />
    <div
      class="mu-split-pane"
      :style="endStyle"
      :collapsible="endCollapsible || null">
      <slot name="end" />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  import MuFlexSplitter from './flex-splitter.vue'

  const props = defineProps({
    startSize: {
      type: [String, Number],
      default: '50%'
    },
    endSize: {
      type: [String, Number],
      default: ''
    },
    startCollapsible: Boolean,
    endCollapsible: Boolean,
    splitterSize: String,
    splitterShape: String,
    splitterStripe: Boolean,
    splitterCollapseButton: Boolean,
    splitterCollapseThreshold: Number,
    splitterSpaceFree: Boolean
  })

  function toFlexBasis (value) {
    if (!value) return null
    return typeof value === 'number' ? `${value}px` : value
  }

  const startStyle = computed(() => ({
    flexBasis: toFlexBasis(props.startSize),
    flexGrow: 0,
    flexShrink: 1,
    overflow: 'auto'
  }))

  const endStyle = computed(() => ({
    flexBasis: toFlexBasis(props.endSize) || undefined,
    flexGrow: props.endSize ? 0 : 1,
    flexShrink: 1,
    overflow: 'auto'
  }))

  const splitterProps = computed(() => {
    const result = {}

    if (props.splitterSize) result.size = props.splitterSize
    if (props.splitterShape) result.shape = props.splitterShape
    if (props.splitterStripe) result.stripe = props.splitterStripe
    if (props.splitterCollapseButton) result.collapseButton = props.splitterCollapseButton
    if (props.splitterCollapseThreshold) result.collapseThreshold = props.splitterCollapseThreshold
    if (props.splitterSpaceFree) result.spaceFree = props.splitterSpaceFree

    return result
  })
</script>
