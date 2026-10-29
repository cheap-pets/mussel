/**
 * table-ex 树纯函数（02-design.md A2.4，评审 6 P7）。
 *
 * records 为平铺数组，每行含树 key 字段值与 parentKey 字段值（字段名经
 * treeProps 配置，缺省 keyField ?? 'id' / 'parentId'——对齐 tree 组件
 * DEFAULT_DATA_PROPS 可配置模式）。脏数据容错：孤儿（parentKey 指向不存在
 * 的 key）挂根、环（A→B→A）经 visited Set 防护不死循环、重复 key 行为未定义。
 *
 * 本模块全部为纯函数：不持有状态、不写回入参。
 */

function isRootParentKey (parentKey) {
  return parentKey == null || parentKey === ''
}

/**
 * 展开 key 集合命中（Set/Array 双形态容错）：树箭头展开态判定的共享谓词
 * （C2 收拢——cell-painters.drawTreeAffordance 与 painter.paintTreeArrowAccent
 * 原各自持同款实现）。
 */
export function isExpandedKey (expandedKeys, key) {
  if (expandedKeys == null || key == null) return false

  if (typeof expandedKeys.has === 'function') return expandedKeys.has(key)

  return typeof expandedKeys.includes === 'function' ? expandedKeys.includes(key) : false
}

/**
 * 子级索引：一次遍历建 Map<parentKey, row[]>（同父按 records 出现序）
 * + hasChildren Set（被 parentKey 引用过的 key）+ keySet（全部 key）。
 * O(n)。
 *
 * @param {Array} records 平铺记录
 * @returns {{ childrenMap: Map, hasChildren: Set, keySet: Set }}
 */
export function buildChildrenIndex (records, { keyOf, parentKeyOf } = {}) {
  const list = records ?? []
  const childrenMap = new Map()
  const hasChildren = new Set()
  const keySet = new Set()

  for (const record of list) {
    keySet.add(keyOf(record))
  }

  for (const record of list) {
    const parentKey = parentKeyOf(record)

    if (isRootParentKey(parentKey)) continue

    hasChildren.add(parentKey)

    const children = childrenMap.get(parentKey)

    if (children) children.push(record)
    else childrenMap.set(parentKey, [record])
  }

  return { childrenMap, hasChildren, keySet }
}

/** 根集栈构建（逆序入栈，DFS pop 顺序 = records 出现序）：parentKey 空，
 * 或父 key 不在集合中（孤儿挂根）。栈项含 parentKey（父链输出，§5.7）。 */
function buildRootStack (list, { keyOf, parentKeyOf }, keySet) {
  const stack = []

  for (let i = list.length - 1; i >= 0; i--) {
    const record = list[i]
    const parentKey = parentKeyOf(record)

    if (isRootParentKey(parentKey) || !keySet.has(parentKey)) {
      stack.push({ record, level: 0, parentKey: null })
    }
  }

  return stack
}

/** 展开节点的子级逆序压栈（level + 1、parentKey = 父 key，pop 顺序 = children 出现序）。 */
function pushChildren (stack, childrenMap, key, level) {
  const children = childrenMap.get(key)

  for (let i = (children?.length ?? 0) - 1; i >= 0; i--) {
    stack.push({ record: children[i], level: level + 1, parentKey: key })
  }
}

/**
 * 迭代 DFS 平铺（显式栈防爆栈；visited Set 防环）：从根集（parentKey 空或
 * 孤儿——父 key 不在集合中，容错挂根）出发，仅展开节点递归子级。
 * 产出 levels / hasChildren / parentKeys / expandable 四个与 rows 同序的平行数组：
 * parentKeys 为各行直接父 key（根行 null）——spans 构建树模式父链切断
 * （autoRowSpan 分段在层级变化或父链不同处切断）的单一事实源，消费方免
 * O(n) 反查、不求数据新增字段；expandable 为行可展开判定（hasChildren 或
 * isLeafOf(record) === false 的懒节点——20261029 问题 3 分级加载），
 * hasChildren 语义保持纯「被 parentKey 引用」不变。
 *
 * @param {Array} records 平铺记录
 * @param {Set} [params.expandedKeys] 展开节点 key 集合
 * @param {Object} [params.childrenIndex] buildChildrenIndex 产物（缺省内部构建）
 * @param {Function} [params.isLeafOf] record => isLeaf 字段值读取器（未传 = 特性
 *   关闭，expandable 退化为 hasChildren；对齐 tree 组件 DEFAULT_DATA_PROPS.isLeaf
 *   缺省 undefined「未映射不生效」兼容语义）
 * @returns {{ rows: Array, levels: Number[], hasChildren: Boolean[], parentKeys: Array, expandable: Boolean[] }}
 */
export function buildFlatRows (records, { keyOf, parentKeyOf, expandedKeys, childrenIndex, isLeafOf } = {}) {
  const list = records ?? []
  const { childrenMap, hasChildren, keySet } = childrenIndex ?? buildChildrenIndex(list, { keyOf, parentKeyOf })
  const stack = buildRootStack(list, { keyOf, parentKeyOf }, keySet)

  const rows = []
  const levels = []
  const hasChildrenFlags = []
  const parentKeys = []
  const expandableFlags = []
  const visited = new Set()

  while (stack.length) {
    const { record, level, parentKey } = stack.pop()
    const key = keyOf(record)

    // 防环 / 防 repeated key 重复展开：已访问的 key 跳过
    if (visited.has(key)) continue

    visited.add(key)

    // 仅明确 === false 视为懒节点（undefined / 缺字段 / true 不算，与用户口径一致）
    const hasKids = hasChildren.has(key)

    rows.push(record)
    levels.push(level)
    hasChildrenFlags.push(hasKids)
    parentKeys.push(parentKey ?? null)
    expandableFlags.push(hasKids || isLeafOf?.(record) === false)

    if (expandedKeys?.has(key)) pushChildren(stack, childrenMap, key, level)
  }

  return { rows, levels, hasChildren: hasChildrenFlags, parentKeys, expandable: expandableFlags }
}

/**
 * 行可展开判定（20261029 问题 3）：树箭头三角显示（cell-painters.drawTreeAffordance）、
 * 箭头槽命中/光标（interactions.isTreeArrowSlot）、hover 主色箭头（painter.
 * paintTreeArrowAccent）三消费点共用单函数防公式漂移（isExpandedKey 同款模式）。
 * expandable = 有子级（hasChildren）或 isLeaf:false 懒节点；flatInfo.expandable
 * 缺省回退 flatInfo.hasChildren（旧形态兼容——组件壳恒提供 expandable，回退
 * 面向自检夹具等旧构造者）。
 *
 * @param {Object} flatInfo buildFlatRows 产物（树关 = null）
 * @param {Number} row 行号
 * @returns {Boolean}
 */
export function expandableAt (flatInfo, row) {
  if (!flatInfo) return false

  if (Array.isArray(flatInfo.expandable)) return flatInfo.expandable[row] === true

  return flatInfo.hasChildren?.[row] === true
}

/** BFS 根集入队（0-based 计层，根 = 0；孤儿挂根；同 key 重复行只入队一次）。 */
function enqueueRootKeys (list, { keyOf, parentKeyOf }, keySet, levelsByKey, queue) {
  for (const record of list) {
    const parentKey = parentKeyOf(record)

    if (isRootParentKey(parentKey) || !keySet.has(parentKey)) {
      const key = keyOf(record)

      if (!levelsByKey.has(key)) {
        levelsByKey.set(key, 0)
        queue.push(key)
      }
    }
  }
}

/** BFS 计层：由已入队的根 key 逐层扩散，levelsByKey<key, level>（层号 = 父 + 1）。 */
function assignChildLevels (childrenMap, keyOf, levelsByKey, queue) {
  for (let head = 0; head < queue.length; head++) {
    const key = queue[head]
    const level = levelsByKey.get(key)
    const children = childrenMap.get(key)

    if (!children) continue

    for (const child of children) {
      const childKey = keyOf(child)

      if (!levelsByKey.has(childKey)) {
        levelsByKey.set(childKey, level + 1)
        queue.push(childKey)
      }
    }
  }
}

/** 收集 level 达标且有子级的 key（按 records 出现序，Set 去重同 key 重复行）。 */
function collectExpandableKeys (list, keyOf, levelsByKey, hasChildren, limit) {
  const keys = []
  const collected = new Set()

  for (const record of list) {
    const key = keyOf(record)

    if (collected.has(key)) continue

    const level = levelsByKey.get(key)

    if (level != null && level <= limit && hasChildren.has(key)) {
      collected.add(key)
      keys.push(key)
    }
  }

  return keys
}

/**
 * 初始展开集解析（defaultExpandLevel 首次入场解析；watch 契约——treeProps
 * 变化 / tree 关闭→开启首开时重解析，由组件壳调用，A2.4 / 评审 6 P7）。
 *
 * - treeExpandedKeys 非空（!= null）→ 受控优先，直接返回 prop（跳过解析）；
 * - 否则按 defaultExpandLevel 解析：节点层级 level <= defaultExpandLevel
 *   （0-based，根 = 0，对齐 tree 组件 autoExpandLevel）且节点有子级；
 * - level 来源 = 函数内部从根集迭代 BFS 计层（levelsByKey）——不依赖
 *   buildFlatRows 产物 levels（展开集是 buildFlatRows 的输入，鸡生蛋；
 *   且全收起时深层节点不在平铺中），孤儿/深层节点层级亦正确。
 *
 * @param {Array} [params.treeExpandedKeys] 受控展开 key 数组（非空时直接返回）
 * @param {Number} [params.defaultExpandLevel=0] 0-based 初始展开层级（-1 = 全收起）
 * @param {Array} params.records 平铺记录
 * @param {Object} [params.childrenIndex] buildChildrenIndex 产物（缺省内部构建）
 * @returns {Array} 展开节点 key 数组（新数组，不改写入参）
 */
export function resolveInitialExpandedKeys ({
  treeExpandedKeys,
  defaultExpandLevel = 0,
  records,
  keyOf,
  parentKeyOf,
  childrenIndex
} = {}) {
  if (treeExpandedKeys != null) return treeExpandedKeys

  const list = records ?? []
  const { childrenMap, hasChildren, keySet } = childrenIndex ?? buildChildrenIndex(list, { keyOf, parentKeyOf })
  const limit = defaultExpandLevel ?? 0

  if (!(limit >= 0)) return []

  const levelsByKey = new Map()
  const queue = []

  enqueueRootKeys(list, { keyOf, parentKeyOf }, keySet, levelsByKey, queue)
  assignChildLevels(childrenMap, keyOf, levelsByKey, queue)

  return collectExpandableKeys(list, keyOf, levelsByKey, hasChildren, limit)
}

/**
 * 展开集 toggle：增删 key，返回新 Set（不写回入参——纯函数约定）。
 *
 * @param {Set} keys 展开节点 key 集合
 */
export function toggleKey (keys, key) {
  const next = new Set(keys ?? [])

  if (next.has(key)) next.delete(key)
  else next.add(key)

  return next
}
