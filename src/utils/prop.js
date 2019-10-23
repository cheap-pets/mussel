export function equalFalse (value) {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 'false'
  )
}
