<template>
  <div class="mu-split-box flex flex-row">
    <div
      v-if="$slots.left"
      :class="['mu-split-box__start', leftClass]"
      :style="[leftStyle, leftWidthStyle]">
      <slot name="left" />
    </div>
    <splitter
      v-if="$slots.left && [true, 'left'].includes(resizable)"
      target="prev"
      direction="row"
      :size="splitterSize"
      :shape="splitterShape"
      :collapsible="isLeftCollapsible"
      :collapse-handle="isLeftCollapsible && splitterCollapseHandle"
      :collapsed="collapsed.start"
      @toggle="toggle('start')"
      @resizing="resize('start', $event)"
      @dblclick="splitterDblclickReset && reset('start')" />
    <div
      :class="['mu-split-box__center', centerClass]"
      :style="[centerStyle]">
      <slot name="center" />
    </div>
    <splitter
      v-if="$slots.right && [true, 'right'].includes(resizable)"
      target="next"
      direction="row"
      :size="splitterSize"
      :shape="splitterShape"
      :collapsible="isRightCollapsible"
      :collapse-handle="isRightCollapsible && splitterCollapseHandle"
      :collapsed="collapsed.end"
      @toggle="toggle('end')"
      @resizing="resize('end', $event)"
      @dblclick="splitterDblclickReset && reset('end')" />
    <div
      v-if="$slots.right"
      :class="['mu-split-box__end', rightClass]"
      :style="[rightStyle, rightWidthStyle]">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useSplitBox } from './split-box.js'

  import Splitter from './splitter.vue'

  const props = defineProps({
    leftClass: null,
    leftStyle: null,
    rightClass: null,
    rightStyle: null,
    centerClass: null,
    centerStyle: null,
    leftWidth: { type: String, default: '33.3%' },
    rightWidth: { type: String, default: '33.3%' },
    resizable: {
      type: [Boolean, String],
      validator: v => [false, true, 'left', 'right'].includes(v)
    },
    collapsible: {
      type: [Boolean, String],
      validator: v => [false, true, 'left', 'right'].includes(v)
    },
    splitterSize: String,
    splitterShape: String,
    splitterCollapseHandle: Boolean,
    splitterDblclickReset: {
      type: Boolean,
      default: true
    }
  })

  const {
    startSizeStyle: leftWidthStyle,
    endSizeStyle: rightWidthStyle,
    collapsed,
    init,
    reset,
    resize,
    toggle
  } = useSplitBox(props)

  const isLeftCollapsible = computed(() => [true, 'left'].includes(props.collapsible))
  const isRightCollapsible = computed(() => [true, 'right'].includes(props.collapsible))

  onMounted(() => init(props.leftWidth, props.rightWidth))
</script>
