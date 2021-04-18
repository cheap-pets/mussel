export function isRailExist (el) {
  return !!Array
    .from(el.childNodes)
    .find(child => child.classList?.contains('mu-scrollbar_rail'))
}
