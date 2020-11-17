import postcss from 'postcss'

function transformDecl (decl, variables) {
  if (decl.prop.indexOf('--') === 0) variables[decl.prop] = decl.value

  const s = decl.value
  const startIdx = s.indexOf('var(')
  const endIdx = startIdx === -1 ? -1 : s.indexOf(')', startIdx)
  const variable = endIdx === -1 ? null : s.substring(startIdx + 4, endIdx)
  const value = variable ? variables[variable.trim()] : null

  if (value) {
    decl.cloneBefore({
      value: s.replace(s.substring(startIdx, endIdx + 1), value)
    })
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
