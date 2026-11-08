// 直通 render 形态（无 compile）：recordNumber 由渲染层注入（行号，非 record 字段取值）
export const RecordNumberColumn = {
  align: 'center',
  width: '50px',
  render: ({ recordNumber }) => ({ text: recordNumber })
}
