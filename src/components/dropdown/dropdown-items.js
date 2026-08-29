import { useListItems } from '../list/list-items'

const DROPDOWN_SHORTCUTS = {
  item: 'mu-dropdown-item',
  check: 'mu-dropdown-check-item',
  radio: 'mu-dropdown-radio-item'
}

export function useDropdownItems (itemsRef, options = {}) {
  const { shortcuts, ...restOptions } = options

  return useListItems(itemsRef, {
    defaultComponent: 'mu-dropdown-item',
    ...restOptions,
    shortcuts: {
      ...DROPDOWN_SHORTCUTS,
      ...shortcuts
    }
  })
}
