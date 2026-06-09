<template>
  <div class="mu-split-box flex flex-col">
    <div
      v-if="$slots.top"
      :class="['mu-split-box__start', topClass]"
      :style="[topStyle, topHeightStyle]">
      <slot name="top" />
    </div>
    <splitter
      v-if="$slots.top && [true, 'top'].includes(resizable)"
      direction="column"
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
      v-if="$slots.bottom && [true, 'bottom'].includes(resizable)"
      direction="column"
      target="next"
      :shape="splitterShape"
      @dblclick="dblclick === 'reset' && reset('end')"
      @resize-target="resize('end', $event)" />
    <div
      v-if="$slots.bottom"
      :class="['mu-split-box__end', bottomClass]"
      :style="[bottomStyle, bottomHeightStyle]">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useSplitBox } from './split-box.js'

  import Splitter from './splitter.vue'

  const props = defineProps({
    topClass: null,
    topStyle: null,
    bottomClass: null,
    bottomStyle: null,
    centerClass: null,
    centerStyle: null,
    topHeight: { type: String, default: '33.3%' },
    bottomHeight: { type: String, default: '33.3%' },
    resizable: {
      type: [Boolean, String],
      validator: v => [false, true, 'top', 'bottom'].includes(v)
    },
    splitterShape: String,
    dblclick: {
      type: String,
      default: 'reset',
      validator: v => ['reset', 'none'].includes(v)
    }
  })

  const {
    startSizeStyle: topHeightStyle,
    endSizeStyle: bottomHeightStyle,
    init,
    reset,
    resize
  } = useSplitBox()

  onMounted(() => init(props.topHeight, props.bottomHeight))
</script>
