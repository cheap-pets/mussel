export default function delay (ms = 20) {
  let canceled = false

  const p = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (canceled) reject(new Error('canceled'))
      else resolve()
    }, ms)
  })
  p.stop = function () {
    canceled = true
  }
  return p
}
