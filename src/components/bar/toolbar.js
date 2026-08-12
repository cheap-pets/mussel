import './toolbar.scss'

import { toRefs, reactive, computed, provide } from 'vue'

export const toolbarProps = {
  buttonStyle: { type: String, default: 'text' },
  size: {
    type: String,
    validator: v => ['small', 'normal'].includes(v)
  }
}

export function useToolbar (props, emit) {
  const toolbar = reactive({ ...toRefs(props) })
  const toolbarClass = computed(() => props.size === 'small' && `mu-toolbar--${props.size}`)

  provide('toolbar', toolbar)

  return { toolbarClass }
}
