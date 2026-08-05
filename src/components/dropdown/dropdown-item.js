import './dropdown-item.scss'

import { inject } from 'vue'

export const dropdownItemProps = {
  action: null,
  icon: String,
  label: String,
  disabled: Boolean
}

export function useDropdownItem (props) {
  const {
    hide: collapse,
    emitAction,
    emitItemClick
  } = inject('popup')

  function onClick (event) {
    // 带 action 时由父组件通过 itemclick/action 处理状态变更，
    // 需阻止 label 默认行为将点击转发给原生 checkbox/radio，
    // 否则会在 Vue 将 checked 同步到新值后再次翻转，导致勾选被撤销。
    if (props.action) {
      event?.preventDefault()
    }

    collapse()
    emitItemClick(props)

    if (props.action) {
      emitAction(props.action)
    }
  }

  return {
    onClick
  }
}
