import { computed, ref, watch } from 'vue'

// 启用 favorites 时内置「我的收藏」一级组的保留 key
export const FAVORITES_KEY = '__favorites__'

// 深于三层的菜单数据告警（模块级标志：每会话仅告警一次）
let levelWarned

export function warnDeepLevel () {
  if (levelWarned) return

  levelWarned = true
  console.warn(
    '[MUSSEL:SideMenu]',
    'Menu data deeper than 3 levels is not recommended.'
  )
}

/**
 * 侧边菜单展开状态：keys 集合，受控 / 非受控二选一。
 * expandedKeys 为数组时以 props 为准（只读 + 发起 update:expanded-keys），
 * 否则用内部 Set（defaultExpandAll 时初始收集全部组 key）；accordion 展开时收拢同级已展开组。
 * walkTo / expandTo 只在 sourceData（原菜单树）上查找，收藏组为派生视图不参与。
 */
export function useSideMenuExpand ({
  data,
  sourceData,
  keyProp,
  childProp,
  expandedKeys,
  defaultExpandAll,
  accordion,
  onChange
}) {
  const innerKeys = ref(new Set())

  const isControlled = computed(() => Array.isArray(expandedKeys.value))

  const keys = computed(() =>
    isControlled.value ? new Set(expandedKeys.value) : innerKeys.value
  )

  function commit (next) {
    if (isControlled.value) expandedKeys.value = [...next]
    else innerKeys.value = next
  }

  function isGroup (node) {
    return !!node?.[childProp.value]?.length
  }

  // 根到 key 所在节点的路径（含目标，沿分组深入），未命中为空数组
  function findPath (key, nodes = data.value) {
    for (const node of nodes || []) {
      if (node[keyProp.value] === key) return [node]

      if (isGroup(node)) {
        const sub = findPath(key, node[childProp.value])
        if (sub.length) return [node, ...sub]
      }
    }

    return []
  }

  // 结构树（含收藏内置组）中按 key 取节点
  function findNode (key) {
    return findPath(key).at(-1) || null
  }

  function getSiblings (key) {
    const path = findPath(key)

    return !path.length
      ? []
      : path.length > 1
        ? path[path.length - 2][childProp.value]
        : data.value
  }

  function isExpanded (key) {
    return keys.value.has(key)
  }

  // defaultExpandAll：非受控下一次性收集全部组 key（初始填充不追溯 accordion 收拢）；
  // 初始 data 为空时等首次非空数据到达补一次，生命周期内仅此一次；受控模式忽略
  let expandedAllOnce = false

  function applyDefaultExpandAll () {
    if (
      expandedAllOnce ||
      isControlled.value ||
      !defaultExpandAll?.value ||
      !sourceData.value?.length
    ) return

    expandedAllOnce = true

    const groupKeys = new Set()

    function walk (nodes) {
      (nodes || []).forEach(node => {
        if (isGroup(node)) {
          groupKeys.add(node[keyProp.value])
          walk(node[childProp.value])
        }
      })
    }

    walk(data.value)
    innerKeys.value = groupKeys
  }

  watch(data, applyDefaultExpandAll)
  applyDefaultExpandAll()

  // 批量更新：一轮 Set 操作累积后单次 commit。
  // 受控模式下 props 滞后于 emit，逐 key 提交时每次都从旧 props 重建集合，会互相覆盖
  function update (entries) {
    const next = new Set(keys.value)
    let changed = false

    for (const [key, value] of entries) {
      if (!isGroup(findNode(key)) || next.has(key) === value) continue

      if (value && accordion.value) {
        getSiblings(key).forEach(sibling => {
          const siblingKey = sibling[keyProp.value]

          if (siblingKey !== key && isGroup(sibling) && next.delete(siblingKey)) {
            onChange?.(siblingKey, false)
          }
        })
      }

      if (value) next.add(key)
      else next.delete(key)

      changed = true
      onChange?.(key, value)
    }

    if (changed) commit(next)
  }

  function setExpanded (key, value) {
    update([[key, value]])
  }

  function expand (...nodeKeys) {
    update(nodeKeys.map(key => [key, true]))
  }

  function collapse (...nodeKeys) {
    update(nodeKeys.map(key => [key, false]))
  }

  // 原树根到目标的节点路径（含目标），未命中为空数组
  function walkTo (key) {
    return findPath(key, sourceData.value)
  }

  // 展开到指定项的父链（含目标自身，目标为组时一并展开）
  function expandTo (key) {
    expand(...walkTo(key).map(node => node[keyProp.value]))
  }

  // data 刷新时清理已不存在（或不再是组）的展开 key；
  // 数据未就绪/为空时跳过，避免异步刷新等场景误清全部展开态
  // （守卫用 sourceData：data 为含内置收藏组的 rootData，收藏启用时即便 props.data 为空仍非空）
  function prune () {
    if (!sourceData.value?.length) return

    const current = keys.value
    const next = new Set()

    current.forEach(key => {
      if (isGroup(findNode(key))) next.add(key)
    })

    if (next.size !== current.size) commit(next)
  }

  return {
    isExpanded,
    setExpanded,
    expand,
    collapse,
    expandTo,
    walkTo,
    prune
  }
}
