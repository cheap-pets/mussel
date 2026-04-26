import { h } from 'vue'

export const MuHBox =
  (props, { slots }) => h('div', { ...props, class: ['flex', props.class] }, slots.default?.())

export const MuVBox =
  (props, { slots }) => h('div', { ...props, class: ['flex', 'flex-col', props.class] }, slots.default?.())

export const MuFlexDivider =
  (props, { slots }) => h('div', { ...props, class: ['flex-divider', props.class] }, slots.default?.())

export const MuFlexSpacer =
  (props, { slots }) => h('div', { ...props, class: ['flex-spacer', props.class] }, slots.default?.())

export const MuFlexBreak =
  (props, { slots }) => h('div', { ...props, class: ['flex-break', props.class] }, slots.default?.())

export { default as MuGridBox } from './grid-box.vue'
export { default as MuGridCell } from './grid-cell.vue'
export { default as MuFlexSplitter } from './flex-splitter.vue'
