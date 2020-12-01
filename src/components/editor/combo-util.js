import isPlainObject from 'lodash.isplainobject'

export function getOptionValue (value, option, fields) {
  const valueField = fields?.value || 'value'

  return value === undefined
    ? (
        isPlainObject(option)
          ? (valueField in option ? option[valueField] : option.key)
          : option
      )
    : value
}

export function getOptionLabel (label, value, option, fields) {
  return label || (
    isPlainObject(option)
      ? option[fields?.label || 'label']
      : null
  ) || value || ''
}
