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
      direction="row"
      target="prev"
      :shape="splitterShape"
      @dblclick="dblclick === 'reset' && reset('start')"
      @resize-target="resize('start', $event)" />
    <div
      :class="['mu-split-box__center', centerClass]"
      :style="[centerStyle]">
      <slot name="center" />
    </div>
    <splitter
      v-if="$slots.right && [true, 'right'].includes(resizable)"
      direction="row"
      target="next"
      :shape="splitterShape"
      @dblclick="dblclick === 'reset' && reset('end')"
      @resize-target="resize('end', $event)" />
    <div
      v-if="$slots.right"
      :class="['mu-split-box__end', rightClass]"
      :style="[rightStyle, rightWidthStyle]">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
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
    splitterShape: String,
    dblclick: {
      type: String,
      default: 'reset',
      validator: v => ['reset', 'none'].includes(v)
    }
  })

  const {
    startSizeStyle: leftWidthStyle,
    endSizeStyle: rightWidthStyle,
    init,
    reset,
    resize
  } = useSplitBox()

  onMounted(() => init(props.leftWidth, props.rightWidth))
</script>
