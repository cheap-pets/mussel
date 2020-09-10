import postcss from 'postcss'

function transformDecl (decl, variables) {
  if (decl.prop.indexOf('--') === 0) variables[decl.prop] = decl.value
  const s = decl.value.trim()
  const idx = s.indexOf('var(')
  if (idx === 0 && s.length > 7 && s.indexOf(')') === s.length - 1) {
    const v = s.substr(4, s.length - 5).trim()
    if (variables[v]) decl.cloneBefore({ value: variables[v] })
  }
}

function plugin () {
  const variables = {}

  return style => {
    style.walkDecls(decl => {
      transformDecl(decl, variables)
    })
  }  
}

export default postcss.plugin('postcss-custom-properties-polyfill', plugin)
