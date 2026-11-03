import { ensureFn } from '@/utils/type'

function isValidLink (link) {
  return link.caption != null && link.caption !== ''
}

export const LinkColumn = {
  compile: (column, dom = false) => {
    function valueToLinks (record, value) {
      if (value != null) {
        return Array.isArray(value)
          // 对象元素原样保留（{ caption, color, danger, disabled }——对象用于设置
          // 链接颜色等；现状被包成 { caption: 对象 } 渲染为 [object Object]），
          // 字符串/数字元素仍包 { caption: el }
          ? value.map(el => (el != null && typeof el === 'object' ? el : { caption: el }))
          : [{ caption: value }]
      }
    }

    const { linkOption = {} } = column
    const { max, danger: _danger, disabled: _disabled } = linkOption

    const getLinks = ensureFn(column.links || valueToLinks)
    const getLinkClass = ensureFn(linkOption.class)
    const getLinkStyle = ensureFn(linkOption.style)

    const showTitle = column.title === true || null

    return ({ record, value, emit }) => {
      const links = getLinks(record, value)?.filter(isValidLink)

      if (!links?.length) return

      const dotsIndex = max > 0 && links.length > max ? max - 1 : null

      // canvas 通道：平铺数据字段（danger/disabled）+ onItemClick 事件句柄，
      // payload 与 dom 通道 events.click 同构（dots 条目 payload 值 '...'）；
      // 恒两色不引入 color 参数
      if (!dom) {
        return {
          items: (max ? links.slice(0, max) : links).map((link, idx) => {
            if (idx === dotsIndex) {
              return {
                kind: 'link',
                text: '...',
                title: showTitle && links.slice(idx).map(el => el.caption).join('\n\n'),
                onItemClick: () => emit('cell-item-click', { record, column, link: '...' })
              }
            }

            const { caption, disabled = _disabled, danger = _danger } = link

            return {
              kind: 'link',
              text: caption,
              title: showTitle && caption,
              danger: danger || null,
              disabled: disabled || null,
              onItemClick: () => emit('cell-item-click', { record, column, link })
            }
          })
        }
      }

      // dom 通道：DOM 形态条目（is/class/style/events/attrs）
      const _class = getLinkClass(record)
      const _style = getLinkStyle(record)

      const items = (max ? links.slice(0, max) : links).map((link, idx) => {
        const itemClass = ['mu-link', _class]
        const events = {}

        const item = {
          is: 'a',
          attrs: { class: itemClass, style: _style },
          events
        }

        if (idx === dotsIndex) {
          item.text = link = '...'
          item.title = showTitle && links.slice(idx).map(el => el.caption).join('\n\n')
        } else {
          const { caption, disabled = _disabled, danger = _danger } = link

          item.text = caption
          item.title = showTitle && caption

          if (disabled) item.attrs.disabled = ''
          if (danger) itemClass.push('mu-link--danger')
        }

        events.click =
          () => emit('cell-item-click', { record, column, link })

        return item
      })

      return {
        class: 'mu-table__link-cell',
        items
      }
    }
  }
}
