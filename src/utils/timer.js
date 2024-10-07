export function delay (ms = 20) {
  return new Promise(
    resolve => ms ? setTimeout(resolve, ms) : resolve()
  )
}
