import { toRefs, reactive, provide } from 'vue'

export const toolbarProps = {
  small: Boolean,
  buttonStyle: { type: String, default: 'text' }
}

export function useToolbar (props, emit) {
  const toolbar = reactive({
    ...toRefs(props)
  })

  provide('toolbar', toolbar)
}
