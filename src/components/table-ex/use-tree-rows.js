/**
 * table-ex 树接线 composable（C1 壳拆分自 table-ex.vue；02-design.md
 * A2.1/A2.4、评审 6 P7/P8）。
 *
 * 职责：树展开集（内部持有 + 受控 prop 覆盖）、childrenIndex/flatRows 平铺
 * 链、displayRows 读行集合（树开 = 平铺、树关 = records 原序）、树形列缺省
 * 接线（wiredColumns）与缩进回调、toggle/expandAll/collapseAll 操作与三条树
 * watch（tree 开关 / treeProps / treeExpandedKeys）。
 *
 * 平铺与索引全部由 tree.js 纯函数产出；DOM 接线（锚定补偿写入 scrollTop、
 * 重绘）经 ctx 回调交回组件壳。
 */
import { computed, shallowRef, watch } from 'vue'

import { TREE_INDENT } from './constants'
import { buildChildrenIndex, buildFlatRows, resolveInitialExpandedKeys, toggleKey } from './tree'

/**
 * 创建树接线（组件壳 setup 内调用；内部注册三条树 watch）。
 *
 * @param {Object} ctx 组件壳注入
 * - props / emit                    组件 props（tree/treeProps/treeExpandedKeys/
 *                                   defaultExpandLevel/records/keyField）与 emit
 * - getPreparedColumns ()           → prepareColumn 后的内部列数组（wiredColumns 输入）
 * - commit ()                       → editor.commit()（行号语义失效先提交，幂等）
 * - relayout ()                     → 壳 relayoutAndRedraw
 * - recomputeViewWindows () / redraw() → 窗口同步与整幅重绘
 * - getScrollEl () / getLayout ()   → 滚动容器与 layout 快照（toggle 锚定补偿）
 * @returns {{
 *   treeExpanded: Object, treeOptions: Object, childrenIndex: Object|null,
 *   flatRows: Object|null, displayRows: Array, wiredColumns: Array,
 *   treeColumnIndex: Number, treeIndentsOf: Function,
 *   applyTreeToggle: Function, expandAll: Function, collapseAll: Function,
 *   getTreeExpandedKeys: Function
 * }}
 */
export function useTreeRows (ctx) {
  const { props, emit } = ctx

  // 展开节点 key 集合（内部持有；受控 prop 引用变化覆盖，点击箭头 toggle + emit）
  const treeExpanded = shallowRef(new Set())

  const treeOptions = computed(() => ({
    key: props.treeProps?.key ?? props.keyField ?? 'id',
    parentKey: props.treeProps?.parentKey ?? 'parentId'
  }))

  // 子级索引（O(n) Map + hasChildren Set；树关 = null 零成本）
  const childrenIndex = computed(() => {
    if (!props.tree) return null

    const { key, parentKey } = treeOptions.value

    return buildChildrenIndex(props.records, {
      keyOf: record => record?.[key],
      parentKeyOf: record => record?.[parentKey]
    })
  })

  // DFS 展开序平铺（迭代防爆栈、visited 防环、孤儿挂根）；树关 = null
  const flatRows = computed(() => {
    if (!props.tree) return null

    const { key, parentKey } = treeOptions.value

    return buildFlatRows(props.records, {
      keyOf: record => record?.[key],
      parentKeyOf: record => record?.[parentKey],
      expandedKeys: treeExpanded.value,
      childrenIndex: childrenIndex.value
    })
  })

  // 读行集合（A2.1 paintState 契约）：树开 = 平铺行数组、树关 = records 原序；
  // painter/interactions/editor 全消费方经此取行
  const displayRows = computed(() => (props.tree ? flatRows.value?.rows ?? [] : props.records))

  // 列接线：树开且未显式指定 treeNode 时缺省首个数据列为树形列（A3.4；
  // check/rec_no 为图形列不作为树形列缺省）
  const wiredColumns = computed(() => {
    const cols = ctx.getPreparedColumns()

    if (!props.tree || cols.some(col => col._isTreeColumn)) return cols

    let index = cols.findIndex(col => col.type !== 'check' && col.type !== 'rec_no')

    if (index < 0) index = 0

    return cols.map((col, i) => (i === index ? { ...col, _isTreeColumn: true } : col))
  })

  const treeColumnIndex = computed(() => wiredColumns.value.findIndex(col => col._isTreeColumn))

  /** 树形列缩进回调（评审 6 P8：签名带列号——仅树形列返回 16×level+16，
      非树形多行列返回 0 不误扣；A2.4/实施约束 6）；无树传 null 零成本 */
  function treeIndentsOf () {
    if (!props.tree) return null

    const colIndex = treeColumnIndex.value
    const levels = flatRows.value?.levels

    return (i, row) => (i === colIndex ? TREE_INDENT * (levels?.[row] ?? 0) + TREE_INDENT : 0)
  }

  // —— 展开操作（A1 方法 / A2.4 watch 契约） ——

  /** defaultExpandLevel 初始解析（约束 9）：首次入场 + tree 关闭→开启首开 +
      treeProps 变化时调用；treeExpandedKeys 受控非空时经
      resolveInitialExpandedKeys 直接取 prop（受控优先） */
  function resolveInitialExpansion () {
    if (!props.tree) return

    const { key, parentKey } = treeOptions.value

    treeExpanded.value = new Set(resolveInitialExpandedKeys({
      treeExpandedKeys: props.treeExpandedKeys,
      defaultExpandLevel: props.defaultExpandLevel,
      records: props.records,
      keyOf: record => record?.[key],
      parentKeyOf: record => record?.[parentKey],
      childrenIndex: childrenIndex.value
    }))
  }

  /** 树箭头 toggle（A2.4 联动链）：行号语义失效先提交（commit 幂等）→
      toggle + emit → 平铺重建（displayRows computed 失效）→ 全量估高 + 几何
      rebuild + spacer + 锚定（视口首行内容保持）+ 整幅重绘 */
  function applyTreeToggle (key) {
    const el = ctx.getScrollEl()
    const cur = ctx.getLayout()
    let anchor = null

    if (el && cur) {
      const geometry = cur.rowGeometry
      const row = geometry.offsetToRow(el.scrollTop)

      anchor = { record: displayRows.value?.[row], top: geometry.topAt(row) }
    }

    ctx.commit()

    treeExpanded.value = toggleKey(treeExpanded.value, key)
    emit('update:tree-expanded-keys', [...treeExpanded.value])

    ctx.relayout()

    if (anchor && el && ctx.getLayout()) {
      const row = (displayRows.value ?? []).indexOf(anchor.record)

      if (row >= 0) {
        const shift = ctx.getLayout().rowGeometry.topAt(row) - anchor.top

        if (shift) el.scrollTop += shift
      }
    }

    // 锚定补偿写入后以最终 scrollTop 同步窗口并重绘（不等下一帧 scroll 事件）
    ctx.recomputeViewWindows()
    ctx.redraw()
  }

  /** 展开全部（A1：等价展开集 = 全部有子节点 key） */
  function expandAll () {
    if (!props.tree || !childrenIndex.value) return

    ctx.commit()
    treeExpanded.value = new Set(childrenIndex.value.hasChildren)
    emit('update:tree-expanded-keys', [...treeExpanded.value])
    ctx.relayout()
  }

  /** 收起全部（A1：清空展开集） */
  function collapseAll () {
    ctx.commit()
    treeExpanded.value = new Set()
    emit('update:tree-expanded-keys', [])
    ctx.relayout()
  }

  /** 当前展开 key 数组（A1：调试/受控回读） */
  function getTreeExpandedKeys () {
    return [...treeExpanded.value]
  }

  // —— 树 watch 契约（A2.4 / 约束 9） ——

  // tree 开/关 → displayRows 切换 records 原序/平铺 + 几何 rebuild + spacer + 锚定 +
  // 整幅重绘；关闭→开启首开重解析展开集（受控 prop 非空时经受控优先直取 prop）。
  // immediate：首布局前解析（首次入场 defaultExpandLevel 解析）
  watch(() => props.tree, (now, before) => {
    if (now && !before) resolveInitialExpansion()
    ctx.relayout()
  }, { immediate: true })

  // treeProps 引用变化 → key/parentKey 字段名变化使既有展开集语义失效 →
  // 清空展开集 + defaultExpandLevel 重解析 → childrenIndex/displayRows 全链重建
  watch(() => props.treeProps, () => {
    if (!props.tree) return

    resolveInitialExpansion()
    ctx.relayout()
  })

  // treeExpandedKeys 受控引用变化 → 覆盖内部 Set → 重建平铺（A2.4）
  watch(() => props.treeExpandedKeys, value => {
    if (value == null) return

    const next = new Set(value)
    const current = treeExpanded.value
    const same = current.size === next.size && [...next].every(k => current.has(k))

    treeExpanded.value = next

    if (!same) ctx.relayout()
  })

  return {
    treeExpanded,
    treeOptions,
    childrenIndex,
    flatRows,
    displayRows,
    wiredColumns,
    treeColumnIndex,
    treeIndentsOf,
    applyTreeToggle,
    expandAll,
    collapseAll,
    getTreeExpandedKeys
  }
}
