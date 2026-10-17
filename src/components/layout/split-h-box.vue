<template>
  <div class="mu-split-box flex flex-row">
    <div
      v-if="$slots.left"
      :class="['mu-split-box__start', preview.start && 'mu-split-box__start--preview', leftClass]"
      :style="[leftStyle, leftWidthStyle]">
      <slot name="left" :collapsed="collapsed.start" />
    </div>
    <splitter
      v-if="$slots.left && hasStartSplitter"
      v-bind="startSplitterProps"
      target="prev"
      direction="row"
      :collapsed="collapsed.start"
      @toggle="toggle('start')"
      @preview="preview.start = $event"
      @resizing="resize('start', $event)"
      @dblclick="onSplitterDblclick('start')" />
    <div
      :class="['mu-split-box__center', centerClass]"
      :style="[centerStyle]">
      <slot name="center" />
    </div>
    <splitter
      v-if="$slots.right && hasEndSplitter"
      v-bind="endSplitterProps"
      target="next"
      direction="row"
      :collapsed="collapsed.end"
      @toggle="toggle('end')"
      @preview="preview.end = $event"
      @resizing="resize('end', $event)"
      @dblclick="onSplitterDblclick('end')" />
    <div
      v-if="$slots.right"
      :class="['mu-split-box__end', preview.end && 'mu-split-box__end--preview', rightClass]"
      :style="[rightStyle, rightWidthStyle]">
      <slot name="right" :collapsed="collapsed.end" />
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useSplitBox, hSplitterProps } from './split-box.js'

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
    ...hSplitterProps
  })

  const {
    startSizeStyle: leftWidthStyle,
    endSizeStyle: rightWidthStyle,
    collapsed,
    preview,
    startSplitterProps,
    endSplitterProps,
    hasStartSplitter,
    hasEndSplitter,
    init,
    resize,
    toggle,
    onSplitterDblclick
  } = useSplitBox('SplitHBox', props)

  onMounted(() => init(props.leftWidth, props.rightWidth))
</script>
