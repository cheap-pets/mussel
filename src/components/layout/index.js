import { h } from 'vue'

export { default as MuHBox } from './h-box.vue'
export { default as MuVBox } from './v-box.vue'
export { default as MuSplitHBox } from './split-h-box.vue'
export { default as MuSplitVBox } from './split-v-box.vue'
// export { default as MuFlexSplitter } from './flex-splitter.vue'

export const MuFlexDivider =
  (props, { slots }) => h('div', { ...props, class: ['flex-divider', props.class] }, slots.default?.())

export const MuFlexSpace =
  (props, { slots }) => h('div', { ...props, class: ['flex-space', props.class] }, slots.default?.())

export const MuFlexBreak =
  (props, { slots }) => h('div', { ...props, class: ['flex-break', props.class] }, slots.default?.())

export { default as MuGridBox } from './grid-box.vue'
export { default as MuGridCell } from './grid-cell.vue'
