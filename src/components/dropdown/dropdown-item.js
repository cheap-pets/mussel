import { inject } from 'vue'

export const dropdownItemProps = {
  icon: String,
  label: String,
  data: null
}

export const dropdownItemEvents = [
  'click'
]

export function useDropdownItem (props, emit) {
  const dropdown = inject('dropdown', {})

  function onClick (event) {
    emit('click', event)
    dropdown.onDropdownItemClick?.(props)
  }

  return {
    dropdown,
    onClick
  }
}
