import { ensureFn } from '@/utils/type'
import { ListColumn } from './list'

// link 列兼容壳：构造 list 语义列对象后委托 ListColumn.compile（无自有渲染逻辑）；
// col.type 保持 'link'（注册表层转换，canvas 侧 type 字符串分发无感）。
// 兼容映射：danger:true → color 'danger'，disabled 原样保留，link 对象既有
// color 键顺势激活（caption 遗留键不再读取）

function valueToLinks (record, value) {
  if (value != null) {
    return Array.isArray(value)
      ? value.map(el => (el != null && typeof el === 'object' ? el : { label: el }))
      : [{ label: value }]
  }
}

export const LinkColumn = {
  compile: (column, dom = false) => {
    const { linkOption = {} } = column
    const { max, danger, disabled, class: linkClass, style: linkStyle } = linkOption

    const getLinks = ensureFn(column.links || valueToLinks)

    // 透传 (record, value)（缺省 valueToLinks 依赖 field 值）：danger 条目映射为
    // 含 color 的派生对象并作为 payload，其余对象原引用保留、primitive 包 { label: el }
    const listItems = (record, value) => {
      const links = getLinks(record, value)

      if (!Array.isArray(links)) return links

      return links.map(el => {
        if (el != null && typeof el === 'object') {
          return el.danger === true ? { ...el, color: el.color ?? 'danger' } : el
        }

        return { label: el }
      })
    }

    return ListColumn.compile({
      ...column,
      type: 'list',
      // 列级 link：{...column} 展开后显式覆盖
      link: true,
      _raw: column,
      listOption: {
        max,
        disabled,
        color: danger === true ? 'danger' : undefined,
        class: linkClass,
        style: linkStyle
      },
      listItems
    }, dom)
  }
}
