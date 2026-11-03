import { ensureFn } from '@/utils/type'

function isValidTag (tag) {
  return tag.caption != null && tag.caption !== ''
}

export const TagColumn = {
  compile: (column, dom = false) => {
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

      const dotsIndex = max > 0 && tags.length > max ? max - 1 : null

      // canvas 通道：平铺数据字段（color）+ onItemClick 事件句柄，
      // payload 与 dom 通道 events.click 同构（dots 条目 payload 值 '...'）
      if (!dom) {
        return {
          items: (max ? tags.slice(0, max) : tags).map((tag, idx) => {
            if (idx === dotsIndex) {
              return {
                kind: 'tag',
                text: '...',
                title: showTitle && tags.slice(idx).map(el => el.caption).join('\n\n'),
                onItemClick: () => emit('cell-item-click', { record, column, tag: '...' })
              }
            }

            const { caption, color = _color } = tag

            return {
              kind: 'tag',
              text: caption,
              title: showTitle && caption,
              color: color || null,
              onItemClick: () => emit('cell-item-click', { record, column, tag })
            }
          })
        }
      }

      // dom 通道：DOM 形态条目（is/class/style/events/attrs）
      const _class = getItemClass(record)
      const _style = getItemStyle(record)

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

          const name = color || 'gray'

          itemClass.push(`text-${name}`, `bg-${name}-translucent`)
          if (pill) itemClass.push('mu-tag--pill')
          if (flat) itemClass.push('mu-tag--flat')
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
