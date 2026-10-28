import { ensureFn } from '../utils'

function isValidTag (tag) {
  return tag.caption != null && tag.caption !== ''
}

export const TagColumn = {
  compile: column => {
    function valueToTags (record, value) {
      if (value != null) {
        return Array.isArray(value)
          // 对象元素原样保留（{ caption, color, pill, flat }——对象用于设置标签
          // 颜色等；现状被包成 { caption: 对象 } 渲染为 [object Object]），
          // 字符串/数字元素仍包 { caption: el }
          ? value.map(el => (el != null && typeof el === 'object' ? el : { caption: el }))
          : [{ caption: value }]
      }
    }

    const { tagOption = {} } = column
    const { max, pill: _pill, flat: _flat, color: _color } = tagOption

    const getTags = ensureFn(column.tags || valueToTags)
    const getItemClass = ensureFn(tagOption.class)
    const getItemStyle = ensureFn(tagOption.style)

    const showTitle = column.title === true

    return ({ record, value, emit }) => {
      const tags = getTags(record, value)?.filter(isValidTag)

      if (!tags?.length) return

      const _class = getItemClass(record)
      const _style = getItemStyle(record)

      const dotsIndex = max > 0 && tags.length > max ? max - 1 : null

      const items = (max ? tags.slice(0, max) : tags).map((tag, idx) => {
        const itemClass = ['mu-tag', _class]

        const item = {
          is: 'span',
          attrs: { class: itemClass, style: _style },
          events: {}
        }

        if (idx === dotsIndex) {
          item.text = tag = '...'
          item.title = showTitle && tags.slice(idx).map(el => el.caption).join('\n\n')
        } else {
          const { caption, pill = _pill, flat = _flat, color = _color } = tag

          item.text = caption
          item.title = showTitle && caption

          if (pill) itemClass.push('mu-tag--pill')
          if (flat) itemClass.push('mu-tag--flat')
          if (color) {
            // mu-tag--{color} 仅供 canvas-table 从 class 解析色名绘制；
            // DOM 着色走 tones 淡底类（视觉与旧 mu-tag--{color} 一致）
            itemClass.push(`mu-tag--${color}`)
            itemClass.push(`mu-faint-${color}`)
          }
        }

        item.events.click =
          () => emit('cell-item-click', { record, column, tag })

        return item
      })

      return {
        class: 'mu-table__tag-cell',
        items
      }
    }
  }
}
