export default function delay (ms = 1) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
