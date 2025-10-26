import { ensureFn } from '../utils'

function isValidTag (tag) {
  return tag.caption != null && tag.caption !== ''
}

export const TagColumn = {
  compile: column => {
    function valueToTags (record, value) {
      if (value != null) {
        return Array.isArray(value)
          ? value.map(el => ({ caption: el }))
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
          if (color) itemClass.push(`mu-tag--${color}`)
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
