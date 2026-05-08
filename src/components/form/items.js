import { computed } from 'vue'

import { isString } from '@/utils/type'
import { autoIncrementKeyBuilder } from '@/utils/key-builder'

const HR = {
  check: v => v === 'hr',
  build: v => ({ type: 'hr', is: 'hr' })
}

const BREAK = {
  check: v => v === '->',
  build: v => ({ type: 'break', is: 'div', attrs: { class: 'flex-break' } })
}

const ROW = {
  check: v => Array.isArray(v),
  build: v => ({ type: 'row', is: 'mu-form-row', attrs: { items: v } })
}

const TITLE = {
  check: v => isString(v),
  build: v => ({ type: 'title', is: 'div', attrs: { class: 'mu-form__title' }, text: v })
}

const CUSTOM = {
  check: v => v?.is,
  build: v => {
    const { is, text, ...attrs } = v
    return { type: 'custom', is, attrs, text }
  }
}

const FIELD = {
  check: v => v?.prop,
  build: v => {
    const { is, ...attrs } = v
    return { type: 'field', is: 'mu-form-field', attrs }
  }
}

const FORM_ITEM_TYPES = [HR, BREAK, ROW, TITLE, CUSTOM, FIELD]
const FORM_ROW_ITEM_TYPES = [TITLE, CUSTOM, FIELD]

function useItems (props, itemTypes) {
  const keyGen = autoIncrementKeyBuilder()

  const items = computed(() => {
    const result = []

    props
      .items
      .forEach(el => {
        const type = itemTypes.find(t => t.check(el))

        if (type) {
          const item = type.build(el)
          item.key = keyGen(el)
          result.push(item)
        }
      })

    return result
  })

  return {
    items
  }
}

export function useFormItems (props) {
  return useItems(props, FORM_ITEM_TYPES)
}

export function useFormRowItems (props) {
  return useItems(props, FORM_ROW_ITEM_TYPES)
}
