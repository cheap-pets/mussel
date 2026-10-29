// base 与 ex 共用的选中键回退链：显式 key → selectedRecord[keyField] → '_key'
export function resolveSelectedKey (props) {
  return props.selectedRecordKey ?? props.selectedRecord?.[props.keyField || '_key']
}
