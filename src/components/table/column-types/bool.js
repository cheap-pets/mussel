export const BoolColumn = {
  align: 'center',
  compile (options) {
    const { mappings = {} } = options

    const {
      null: nullText,
      true: trueText = '是',
      false: falseText = '否'
    } = mappings

    return ({ value }) => ({
      text: value == null && nullText !== undefined
        ? nullText
        : (value ? trueText : falseText)
    })
  }
}
