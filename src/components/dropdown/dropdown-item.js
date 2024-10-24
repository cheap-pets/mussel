import './dropdown-item.scss'

import { inject } from 'vue'

export const dropdownItemProps = {
  action: null,
  icon: String,
  label: String
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
