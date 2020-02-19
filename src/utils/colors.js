function safe () {
  const colors = []
  const base = ['00', '33', '66', '99', 'CC', 'FF']
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      for (let k = 0; k < 6; k++) {
        colors.push(`#${base[i]}${base[j]}${base[k]}`)
      }
    }
  }
  console.log(colors)
  return colors
}

export default {
  safe: safe()
}
