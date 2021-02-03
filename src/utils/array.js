export function fillGrid (rowCount, colCount, callbackFn) {
  const rows = []
  for (let i = 0; i < rowCount; i++) {
    const row = []
    for (let j = 0; j < colCount; j++) {
      callbackFn(row, i, j)
    }
    rows.push(row)
  }
  return rows
}
