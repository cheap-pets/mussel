export function kebabCase (str) {
  return str
    .replace(/(\W|_)/g, '-')
    .replace(/([A-Z])/g, s => '-' + s.toLowerCase())
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function camelCase (str) {
  return kebabCase(str)
    .replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())
    .replace(/-/g, '')
}
