// base 与 ex 共用的选中键回退链：显式 key → selectedRecord[keyField] → '_key'
export function resolveSelectedKey (props) {
  return props.selectedRecordKey ?? props.selectedRecord?.[props.keyField || '_key']
}

// —— 单元格取值 / orderBy 解析单一事实源（base 与 ex 共引，零依赖纯函数） ——

/** 单元格取值链：列 _value 函数优先（求值结果空值回落），再按 field 取字段；
    field 为 null/undefined 时不取字段。_mapText 映射不在此链——row-geometry
    估高取映射 .text、spans-auto 分组取映射对象，各自调用点自持 */
export function readCellValue (col, record) {
  return col._value?.(record) ?? (col.field != null ? record?.[col.field] : undefined)
}

/** orderBy 解析：'field:direction' 仅替换第一个冒号后按空白切分（保留
    'a:b:c' → direction 'b:c' 语义）；null/undefined 归一空串切分
    （field ''、direction undefined），调用点各自先行判空短路 */
export function parseOrderBy (orderBy) {
  const [field, direction] = String(orderBy ?? '').replace(':', ' ').split(' ')

  return { field, direction }
}
