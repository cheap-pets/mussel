export function generateUUID () {
  return crypto.randomUUID()
}

// FNV-a1 algorithm
export function generateHash (str, length = 8) {
  const OFFSET = BigInt('14695981039346656037')
  const MASK64 = BigInt('0xFFFFFFFFFFFFFFFF')
  const PRIME = BigInt('1099511628211')
  const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'

  let hash = OFFSET

  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i))
    hash = (hash * PRIME) & MASK64
  }

  let result = ''

  while (hash > 0 && result.length < length) {
    const r = hash % BigInt(36)

    result = CHARS[Number(r)] + result
    hash = hash / BigInt(36)
  }

  return result.padStart(length, '0').slice(0, length)
}
