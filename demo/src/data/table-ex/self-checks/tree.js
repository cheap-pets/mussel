/**
 * table-ex 自检断言 — tree 模块（G1-a；G2-7 扩 A8 排序重组断言）。
 *
 * 覆盖（02-design.md G1-a 判据 + 改动清单 self-checks/tree.js 行；实施约束 9：
 * defaultExpandLevel 首次入场解析 + treeProps 变化 / 首开重解析的解析函数语义）：
 * buildChildrenIndex（O(n) Map + hasChildren Set）、buildFlatRows 迭代 DFS
 * （展开序 / 层级数组 / hasChildren 平行数组 / 孤儿挂根 / 环防护 / 字段名可配）、
 * resolveInitialExpandedKeys（0-based level <= defaultExpandLevel、受控优先、
 * 内部 BFS 计层不依赖 buildFlatRows 产物 levels——全收起时深层不可见场景）、
 * toggleKey 展开集增删（纯函数不写回入参）。
 * G2-7 追加（02-design.md 测试计划 A8 行）：乱序平铺数组经 Array.sort（父级排序动作，
 * 组件侧不实现排序）后经 buildChildrenIndex 同级收集 + buildFlatRows DFS 重组——
 * 每级兄弟按排序序（升/降序两态）、父子结构不变、不跨层级穿插、不同父同名子键
 * 各归其父、同 key 兄弟保持原相对序（排序稳定性）。
 */
import {
  buildChildrenIndex,
  buildFlatRows,
  resolveInitialExpandedKeys,
  toggleKey
} from '@/components/table-ex/tree.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

function assertArray (actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)

  if (a !== e) throw new Error(`${label} 期望 ${e}，实际 ${a}`)

  return a
}

const keyOf = record => record.id
const parentKeyOf = record => record.pid

/** 标准夹具：两级 + 三层深链 + 孤儿（pid 指向不存在的 42） */
const RECORDS = [
  { id: 1, pid: null },
  { id: 11, pid: 1 },
  { id: 111, pid: 11 },
  { id: 12, pid: 1 },
  { id: 2, pid: null },
  { id: 21, pid: 2 },
  { id: 99, pid: 42 }
]

// ---------- A8（问题 8 A 案）夹具：平铺排序 → childrenIndex 同级收集 → DFS 重组 ----------
//
// 契约口径（decisions 检查点-人工2 + 02-design.md 问题 8 / 测试计划 A8）：排序本身由
// 父级执行（组件侧不实现排序），组件侧保证 = buildChildrenIndex 同父按出现序收集 +
// buildFlatRows DFS 按根序 + 子序重组 → 每级兄弟继承排序序、父子结构不变、不跨层级穿插。
// 断言仅针对组件纯函数：排序输入由夹具以 Array.sort 生成，比较器与 demo
// main-view.vue applyOrder 的字符串分支逐字同口径（name 为字符串 → localeCompare，
// 勿自创 a < b）；本文件不 import demo main-view.vue。

/** A8 排序比较器（夹具）：与 demo main-view.vue applyOrder 字符串分支同口径（desc 取反）。 */
function compareByName (direction) {
  return (a, b) => {
    const cmp = a.name.localeCompare(b.name)

    return direction === 'desc' ? -cmp : cmp
  }
}

/**
 * A8 夹具：3 层（根 / 子 / 孙）、同级 ≥3 节点（3 根；k2 下 3 子）、不同父下同名子键
 *（'子-a' 分布于 k1/k2、'孙-1' 分布于 k1-a/k2-a/k3-a）、同父同名兄弟（k2-c / k2-a
 * 均 '子-a'，稳定性用例）。数组刻意乱序（子先于父出现，重组前无任何结构序）。
 */
const SORT_RECORDS = [
  { id: 'k2-a-1', pid: 'k2-a', name: '孙-2' },
  { id: 'k1-b', pid: 'k1', name: '子-a' },
  { id: 'k3', pid: null, name: '根-3' },
  { id: 'k2-c', pid: 'k2', name: '子-a' },
  { id: 'k1', pid: null, name: '根-2' },
  { id: 'k2-a-2', pid: 'k2-a', name: '孙-1' },
  { id: 'k3-a', pid: 'k3', name: '子-b' },
  { id: 'k1-a-1', pid: 'k1-a', name: '孙-1' },
  { id: 'k2', pid: null, name: '根-1' },
  { id: 'k3-a-1', pid: 'k3-a', name: '孙-1' },
  { id: 'k2-b', pid: 'k2', name: '子-c' },
  { id: 'k1-a', pid: 'k1', name: '子-b' },
  { id: 'k2-a', pid: 'k2', name: '子-a' }
]

/** id → pid（结构不变断言的期望父链）。 */
const SORT_PARENT_OF = new Map(SORT_RECORDS.map(record => [record.id, record.pid]))

/** pid → 子 id 集合（排序不改父子归属的期望桶成员）。 */
const SORT_CHILDREN_OF = (() => {
  const map = new Map()

  for (const record of SORT_RECORDS) {
    if (record.pid == null) continue

    if (!map.has(record.pid)) map.set(record.pid, new Set())

    map.get(record.pid).add(record.id)
  }

  return map
})()

/** 乱序平铺 → Array.sort（父级排序动作）→ childrenIndex 收集 + DFS 全展开重组。
 * expandedKeys 直用 hasChildren（全部内层节点展开，三层全部可见）。 */
function rebuildSorted (direction) {
  const sorted = [...SORT_RECORDS].sort(compareByName(direction))
  const childrenIndex = buildChildrenIndex(sorted, { keyOf, parentKeyOf })

  return buildFlatRows(sorted, {
    keyOf,
    parentKeyOf,
    expandedKeys: childrenIndex.hasChildren,
    childrenIndex
  })
}

/**
 * DFS 重组结构重放：栈式重放开放祖先链——每行层级相对前行至多 +1（更深即跨层级穿插），
 * 非根行的父 = 上一层开放行 = 夹具 pid（子节点仍在原父下，同名子键不跨节点）。
 * 返回 Map<''（根）| pid, 按输出序的兄弟行数组> 供同级有序断言。
 */
function replayStructure (rows, levels) {
  const stack = []
  const groups = new Map()

  for (let i = 0; i < rows.length; i++) {
    const record = rows[i]
    const level = levels[i]
    const id = keyOf(record)
    const expectedPid = SORT_PARENT_OF.get(id)

    assert(level >= 0 && level <= stack.length, `行 ${id} 层级 ${level} 相对前序深度 ${stack.length} 越位（跨层级穿插）`)

    if (level === 0) {
      assert(expectedPid == null, `行 ${id}（pid=${expectedPid}）非根却被重组为根`)
    } else {
      const actualPid = keyOf(stack[level - 1])

      assert(expectedPid === actualPid, `行 ${id} 父级错位：期望 ${expectedPid}，实际 ${actualPid}`)
    }

    stack.length = level + 1
    stack[level] = record

    const groupKey = level === 0 ? '' : expectedPid

    if (!groups.has(groupKey)) groups.set(groupKey, [])

    groups.get(groupKey).push(record)
  }

  return groups
}

/** 每个父的子集合与夹具一致（排序不改父子归属——不跨节点）；根数 = 3。 */
function assertChildrenSets (groups) {
  assertEqual(groups.get('').length, 3, '根数')

  for (const [pid, expectedIds] of SORT_CHILDREN_OF) {
    const bucket = groups.get(pid)

    assert(bucket != null, `父 ${pid} 无重组桶`)
    assertEqual(bucket.length, expectedIds.size, `父 ${pid} 子数`)

    for (const id of expectedIds) {
      assert(bucket.some(record => keyOf(record) === id), `父 ${pid} 缺子 ${id}`)
    }
  }
}

/** 每组兄弟按排序序：升序 name 非递减 / 降序非递增（比较器与夹具排序同口径）。 */
function assertSiblingOrder (groups, direction) {
  for (const [parentKey, siblings] of groups) {
    for (let i = 1; i < siblings.length; i++) {
      const cmp = siblings[i - 1].name.localeCompare(siblings[i].name)
      const label = `父 ${parentKey || '(根)'} 第 ${i + 1}/${siblings.length} 个兄弟`

      if (direction === 'desc') {
        assert(cmp >= 0, `${label} 降序错位：'${siblings[i - 1].name}' 应不早于 '${siblings[i].name}'`)
      } else {
        assert(cmp <= 0, `${label} 升序错位：'${siblings[i - 1].name}' 应不晚于 '${siblings[i].name}'`)
      }
    }
  }
}

export const checks = [
  {
    name: 'buildChildrenIndex：O(n) 子级 Map（同父按出现序）+ hasChildren Set',
    fn: () => {
      const index = buildChildrenIndex(RECORDS, { keyOf, parentKeyOf })

      assertArray([...index.childrenMap.get(1)].map(keyOf), [11, 12], '1 的子级出现序')
      assertArray([...index.childrenMap.get(11)].map(keyOf), [111], '11 的子级')
      assertArray([...(index.childrenMap.get(42) ?? [])].map(keyOf), [99], '孤儿父键 42 有桶（孤儿由 keySet 判定挂根）')
      assertArray([...index.hasChildren], [1, 11, 2, 42], 'hasChildren = 被 parentKey 引用过的 key（含孤儿父键 42）')
      assert(index.hasChildren.has(99) === false, '叶子 99 无子级')
      assertArray([...index.keySet], [1, 11, 111, 12, 2, 21, 99], 'keySet 全量（不含 42）')

      return 'childrenMap{1:[11,12], 11:[111], 2:[21], 42:[99]}；hasChildren={1,11,2,42}'
    }
  },
  {
    name: 'buildFlatRows：DFS 展开序 + 层级数组 + hasChildren 平行数组（父行 true / 叶行 false）',
    fn: () => {
      const { rows, levels, hasChildren } = buildFlatRows(RECORDS, {
        keyOf,
        parentKeyOf,
        expandedKeys: new Set([1, 11])
      })

      assertArray(rows.map(keyOf), [1, 11, 111, 12, 2, 99], 'DFS 展开序（2 未展开 → 21 隐藏）')
      assertArray(levels, [0, 1, 2, 1, 0, 0], '层级数组')
      assertArray(hasChildren, [true, true, false, false, true, false], 'hasChildren 平行数组')

      return '序 [1,11,111,12,2,99]；levels [0,1,2,1,0,0]；父行箭头/叶行空槽判定源'
    }
  },
  {
    name: 'buildFlatRows：全收起仅根可见；孤儿挂根（父 key 不在集合中容错）',
    fn: () => {
      const collapsed = buildFlatRows(RECORDS, { keyOf, parentKeyOf, expandedKeys: new Set() })

      assertArray(collapsed.rows.map(keyOf), [1, 2, 99], '全收起仅根（含孤儿）')
      assertArray(collapsed.levels, [0, 0, 0], '根层级 0')
      assertArray(collapsed.hasChildren, [true, true, false], '收起态 hasChildren')

      const expanded = buildFlatRows(RECORDS, { keyOf, parentKeyOf, expandedKeys: new Set([1, 11, 99]) })

      assertArray(expanded.rows.map(keyOf), [1, 11, 111, 12, 2, 99], '孤儿 99 参与平铺（2 未展开 → 21 隐藏）')

      return '收起 [1,2,99]；孤儿 99 挂根参与平铺'
    }
  },
  {
    name: 'buildFlatRows：环防护（A→B→A 不死循环，迭代栈终止）',
    fn: () => {
      const cycle = [
        { id: 'a', pid: 'b' },
        { id: 'b', pid: 'a' }
      ]
      const isolated = buildFlatRows(cycle, { keyOf, parentKeyOf, expandedKeys: new Set(['a', 'b']) })

      assertEqual(isolated.rows.length, 0, '纯环互为父级 → 不可达，终止不死循环')

      const withRoot = buildFlatRows(
        [{ id: 'r', pid: null }, ...cycle],
        { keyOf, parentKeyOf, expandedKeys: new Set(['a', 'b', 'r']) }
      )

      assertArray(withRoot.rows.map(keyOf), ['r'], '环外根正常输出，环节点不引发死循环')

      return '纯环 → []；根 + 环 → [r]；visited Set 防护均终止'
    }
  },
  {
    name: 'buildFlatRows：树字段名可配（keyOf/parentKeyOf 函数注入，非 id/pid 字段）',
    fn: () => {
      const records = [
        { code: 'n1', pcode: '' },
        { code: 'n1-1', pcode: 'n1' },
        { code: 'n2', pcode: null }
      ]
      const { rows, levels, hasChildren } = buildFlatRows(records, {
        keyOf: record => record.code,
        parentKeyOf: record => record.pcode,
        expandedKeys: new Set(['n1'])
      })

      assertArray(rows.map(record => record.code), ['n1', 'n1-1', 'n2'], '自定义字段 DFS 序')
      assertArray(levels, [0, 1, 0], '自定义字段层级')
      assertArray(hasChildren, [true, false, false], '自定义字段 hasChildren')

      return "code/pcode 字段：['n1','n1-1','n2']，levels [0,1,0]"
    }
  },
  {
    name: 'resolveInitialExpandedKeys：defaultExpandLevel 0/1/2/-1（0-based level <= limit，仅收有子级者）',
    fn: () => {
      const base = { records: RECORDS, keyOf, parentKeyOf }

      assertArray(resolveInitialExpandedKeys({ ...base, defaultExpandLevel: 0 }), [1, 2], '0 → 根层有子级 key')
      assertArray(resolveInitialExpandedKeys({ ...base, defaultExpandLevel: 1 }), [1, 11, 2], '1 → level 0+1')
      assertArray(resolveInitialExpandedKeys({ ...base, defaultExpandLevel: 2 }), [1, 11, 2], '2 → 叶子 111 无子级不入选（深层证明见深链用例）')
      assertArray(resolveInitialExpandedKeys({ ...base, defaultExpandLevel: -1 }), [], '-1 → 全收起')
      assertArray(resolveInitialExpandedKeys({ ...base }), [1, 2], '缺省 0')

      return '0→[1,2]；1→[1,11,2]；2→[1,11,111,2]；-1→[]；缺省同 0'
    }
  },
  {
    name: 'resolveInitialExpandedKeys：受控优先（treeExpandedKeys 非空直返）与深层 BFS 计层独立于 buildFlatRows',
    fn: () => {
      assertArray(
        resolveInitialExpandedKeys({ treeExpandedKeys: ['x', 'y'], records: RECORDS, keyOf, parentKeyOf }),
        ['x', 'y'],
        '受控 prop 直返（跳过解析）'
      )

      // 深链夹具：默认配置下 buildFlatRows 不展开时 b/c 层级不可见，
      // 解析函数仍须经内部 BFS 得到其层级（defaultExpandLevel 2 → b 有子级入选）
      const deepRecords = [
        { id: 'r', pid: null },
        { id: 'a', pid: 'r' },
        { id: 'b', pid: 'a' },
        { id: 'c', pid: 'b' }
      ]
      const deepBase = { records: deepRecords, keyOf, parentKeyOf }

      assertArray(resolveInitialExpandedKeys({ ...deepBase, defaultExpandLevel: 1 }), ['r', 'a'], 'level 1（不依赖平铺产物）')
      assertArray(resolveInitialExpandedKeys({ ...deepBase, defaultExpandLevel: 2 }), ['r', 'a', 'b'], '全收起时深层 b 层级仍正确')

      // 孤儿层级：孤儿挂根 = level 0
      assertArray(resolveInitialExpandedKeys({ ...deepBase, defaultExpandLevel: 0 }), ['r'], '孤儿不计入（无子级）')

      // 预构建 childrenIndex 传入（组件壳复用索引场景）
      const index = buildChildrenIndex(RECORDS, { keyOf, parentKeyOf })

      assertArray(
        resolveInitialExpandedKeys({
          defaultExpandLevel: 1, records: RECORDS, keyOf, parentKeyOf, childrenIndex: index
        }),
        [1, 11, 2],
        '外部 childrenIndex 复用一致'
      )

      return "受控 ['x','y'] 直返；深链 b 层级 BFS 可得；childrenIndex 复用一致"
    }
  },
  {
    name: 'toggleKey：展开集增删返回新 Set，不写回入参',
    fn: () => {
      const source = new Set([1])

      const added = toggleKey(source, 2)

      assertArray([...added], [1, 2], '新增 key')
      assert(source.has(1) && !source.has(2), '原 Set 不被写回')

      const removed = toggleKey(added, 1)

      assertArray([...removed], [2], '移除 key')
      assertArray([...added], [1, 2], '中间 Set 不受影响')
      assertArray([...toggleKey(null, 1)], [1], 'null 入参容错')

      return 'add → {1,2}；remove → {2}；入参不可变'
    }
  },
  {
    name: '平铺排序 → buildChildrenIndex 同级收集：同父桶按排序序（升/降序两态，桶成员 = 夹具子集合）',
    fn: () => {
      const parts = []

      for (const direction of ['asc', 'desc']) {
        const sorted = [...SORT_RECORDS].sort(compareByName(direction))
        const index = buildChildrenIndex(sorted, { keyOf, parentKeyOf })

        for (const [pid, expectedIds] of SORT_CHILDREN_OF) {
          const bucket = index.childrenMap.get(pid)

          assert(bucket != null, `${direction}：父 ${pid} 无桶`)
          assertEqual(bucket.length, expectedIds.size, `${direction}：父 ${pid} 桶成员数`)

          for (const id of expectedIds) {
            assert(bucket.map(keyOf).includes(id), `${direction}：父 ${pid} 桶缺子 ${id}`)
          }

          for (let i = 1; i < bucket.length; i++) {
            const cmp = bucket[i - 1].name.localeCompare(bucket[i].name)

            if (direction === 'desc') {
              assert(cmp >= 0, `${direction}：父 ${pid} 桶内降序错位（${bucket[i - 1].name} → ${bucket[i].name}）`)
            } else {
              assert(cmp <= 0, `${direction}：父 ${pid} 桶内升序错位（${bucket[i - 1].name} → ${bucket[i].name}）`)
            }
          }
        }

        parts.push(`${direction} ${SORT_CHILDREN_OF.size} 桶全过`)
      }

      return `收集序 = 平铺出现序（父级 Array.sort 产物入桶）：${parts.join('；')}`
    }
  },
  {
    name: '平铺排序 → childrenIndex + buildFlatRows 重组（升序）：每级兄弟有序 + 父子结构不变 + 不跨层级穿插',
    fn: () => {
      const { rows, levels } = rebuildSorted('asc')

      assertEqual(rows.length, SORT_RECORDS.length, '全展开平铺行数')

      const groups = replayStructure(rows, levels)

      assertChildrenSets(groups)
      assertSiblingOrder(groups, 'asc')

      return `${rows.length} 行全展开；3 根 + ${SORT_CHILDREN_OF.size} 父桶子集合与夹具一致；同级 name 非递减`
    }
  },
  {
    name: '平铺排序重组（降序两态）：兄弟逆序 + 行集合与父子归属同升序产物（排序不改结构）',
    fn: () => {
      const asc = rebuildSorted('asc')
      const desc = rebuildSorted('desc')

      assertEqual(desc.rows.length, SORT_RECORDS.length, '全展开平铺行数')

      const groups = replayStructure(desc.rows, desc.levels)

      assertChildrenSets(groups)
      assertSiblingOrder(groups, 'desc')

      const idsOf = result => result.rows.map(keyOf).sort().join()

      assertEqual(idsOf(desc), idsOf(asc), '升/降序行集合一致')

      return `${desc.rows.length} 行；同级 name 非递增；行集合与父子归属同升序产物`
    }
  },
  {
    name: '排序稳定性 + 不同父同名子键不穿插：同 key 兄弟保持原相对序、各归其父',
    fn: () => {
      const { rows, levels } = rebuildSorted('asc')
      const groups = replayStructure(rows, levels)

      // 稳定性：k2 下两个同名 '子-a' 兄弟保持乱序夹具中的相对出现序
      // （ES2019+ Array.sort 稳定：等值键在排序产物中保持输入相对序）。
      const sameKeyIds = groups.get('k2').filter(record => record.name === '子-a').map(keyOf)
      const expectedIds = SORT_RECORDS
        .filter(record => record.pid === 'k2' && record.name === '子-a')
        .map(keyOf)

      assertArray(sameKeyIds, expectedIds, '同父同名兄弟相对序')

      // 不同父下同名子键各归其父：'子-a' ×3 分布于 k1/k2、'孙-1' ×3 分布于 k1-a/k2-a/k3-a
      const distributionOf = name => {
        const found = new Map()

        for (const [pid, siblings] of groups) {
          const hit = siblings.filter(record => record.name === name).length

          if (hit > 0) found.set(pid, hit)
        }

        return found
      }

      const ziA = distributionOf('子-a')

      assertEqual(ziA.size, 2, "'子-a' 出现的父数")
      assertEqual(ziA.get('k1'), 1, "k1 下 '子-a' 数")
      assertEqual(ziA.get('k2'), 2, "k2 下 '子-a' 数")

      const sun1 = distributionOf('孙-1')

      assertEqual(sun1.size, 3, "'孙-1' 出现的父数")
      assertEqual(sun1.get('k1-a'), 1, "k1-a 下 '孙-1' 数")
      assertEqual(sun1.get('k2-a'), 1, "k2-a 下 '孙-1' 数")
      assertEqual(sun1.get('k3-a'), 1, "k3-a 下 '孙-1' 数")

      return `同 key 兄弟序 [${expectedIds.join(', ')}]；'子-a' k1×1/k2×2、'孙-1' 三父各 ×1`
    }
  }
]
