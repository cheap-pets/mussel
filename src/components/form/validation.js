import { computed, inject } from 'vue'
import { debounce } from 'throttle-debounce'

import { isString, isFunction, isObject } from '@/utils/type'
import { t } from '@/langs'

const RULE_TYPES = {}

function parseStringRule (rule, required) {
  const result = []
  const keys = rule.split('|')

  if (keys[0] === 'required') {
    result.required = true
    result.type = keys[1]
  } else {
    result.required = keys[1] === 'required'
    result.type = keys[0]
  }

  return result
}

export function normalizeRule (rule) {
  const normalized =
    isObject(rule)
      ? { ...rule }
      : isFunction(rule)
        ? { validator: rule }
        : isString(rule)
          ? parseStringRule(rule)
          : {}

  normalized.validator ||= RULE_TYPES[normalized.type]

  return (normalized.required || normalized.validator) && normalized
}

export function validateRequired (value, params) {
  const label = params.label || t('Validation.DEFAULT_LABEL')

  return value == null || (isString(value) && !value.trim())
    ? params.requiredMessage || params.message || t('Validation.REQUIRED', label)
    : undefined
}

export function executeValidator (validator, value, params) {
  const label = params.label || t('Validation.DEFAULT_LABEL')
  const ret = validator(value, params)

  return ret === false
    ? params.message || t('Validation.INVALID', label)
    : ret && isString(ret)
      ? ret
      : undefined
}

export function useFieldModel (props, modelProp, emit) {
  const field = inject('formField', {})

  const debounceValidate = debounce(300, () => field.validate?.())

  const model = computed({
    get () {
      return props[modelProp]
    },
    set (v) {
      emit(`update:${modelProp}`, v)
      debounceValidate()
    }
  })

  return {
    model
  }
}
