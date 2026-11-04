import { createDisplayMapper } from '../mappings'

// enum 列类型：显示映射独占 mappings/options（经 createDisplayMapper，mappings 优先、
// 仅 options 时转换为显示映射）；编辑态由 ex/editor.js COLUMN_TYPE_EDITORS 映射为 select
export const EnumColumn = {
  align: 'center',
  compile: (column, dom = false) => {
    const mapper = createDisplayMapper(column)

    return ({ value }) => {
      const mapped = mapper(value)

      // 空文本落占位链（与 text 列 !mapped?.text 门控同式；value == null 有映射时 mapper 产 null）
      if (!mapped?.text) return null

      const {
        text,
        color,
        class: mClass,
        style: mStyle,
        ...attrs
      } = mapped

      return dom
        ? { text, class: [mClass, color && `text-${color}`], style: [mStyle], ...attrs }
        : { text, color, ...attrs }
    }
  }
}
