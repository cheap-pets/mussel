<template>
  <div class="mu-split-box flex flex-col">
    <div
      v-if="$slots.top"
      :class="['mu-split-box__start', preview.start && 'mu-split-box__start--preview', topClass]"
      :style="[topStyle, topHeightStyle]">
      <slot name="top" :collapsed="collapsed.start" />
    </div>
    <splitter
      v-if="$slots.top && hasStartSplitter"
      v-bind="startSplitterProps"
      direction="column"
      target="prev"
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
      v-if="$slots.bottom && hasEndSplitter"
      v-bind="endSplitterProps"
      direction="column"
      target="next"
      :collapsed="collapsed.end"
      @toggle="toggle('end')"
      @preview="preview.end = $event"
      @resizing="resize('end', $event)"
      @dblclick="onSplitterDblclick('end')" />
    <div
      v-if="$slots.bottom"
      :class="['mu-split-box__end', preview.end && 'mu-split-box__end--preview', bottomClass]"
      :style="[bottomStyle, bottomHeightStyle]">
      <slot name="bottom" :collapsed="collapsed.end" />
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useSplitBox, vSplitterProps } from './split-box.js'

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
    ...vSplitterProps
  })

  const {
    startSizeStyle: topHeightStyle,
    endSizeStyle: bottomHeightStyle,
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
  } = useSplitBox('SplitVBox', props)

  onMounted(() => init(props.topHeight, props.bottomHeight))
</script>
