import './toolbar.scss'

import { toRefs, reactive, computed, provide } from 'vue'

export const toolbarProps = {
  small: Boolean,
  buttonStyle: { type: String, default: 'text' }
}

export function useToolbar (props, emit) {
  const toolbar = reactive({ ...toRefs(props) })
  const toolbarClass = computed(() => ({ 'mu-toolbar--small': props.small }))

  provide('toolbar', toolbar)

  return { toolbarClass }
}
