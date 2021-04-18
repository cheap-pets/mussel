export function unsetOrFalse (value) {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 'false'
  )
}

export function duplicateFromPropOrOptions (vueInstance, props) {
  const options = vueInstance.$options
  const result = {}

  props = props || Object.keys(options.props)

  props.forEach(
    key => { result[key] = vueInstance[key] ?? options[key] }
  )
  return result
}
