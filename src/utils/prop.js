export function unsetOrFalse (value) {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 'false'
  )
}
