export function formatString (template, ...replacements) {
  return template.replace(
    /\{(\d+)\}/g,
    (match, index) => replacements[index] ?? match
  )
}
