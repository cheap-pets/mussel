const ColumnWidth = {
  XS: '60px',
  S: '80px',
  M: '135px',
  L: '200px',
  XL: '300px'
}

function convertColumnWidth (v) {
  return ColumnWidth[v?.toUpperCase()] || (isNaN(v) ? v : v + 'px')
}

export {
  ColumnWidth,
  convertColumnWidth
}
