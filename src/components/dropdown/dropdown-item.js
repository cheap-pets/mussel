import './dropdown-item.scss'

import { inject } from 'vue'

export const dropdownItemProps = {
  icon: String,
  label: String,
  value: null
}

export function useDropdownItem (props) {
  const dropdown = inject('dropdown')

  function onClick (event) {
    dropdown.onDropdownItemClick(props)
  }

  return {
    dropdown,
    onClick
  }
}
