/**
 * canvas-table 自检断言 — tree 模块（G1-a）。
 *
 * 覆盖（02-design.md G1-a 判据 + 改动清单 self-checks/tree.js 行；实施约束 9：
 * defaultExpandLevel 首次入场解析 + treeProps 变化 / 首开重解析的解析函数语义）：
 * buildChildrenIndex（O(n) Map + hasChildren Set）、buildFlatRows 迭代 DFS
 * （展开序 / 层级数组 / hasChildren 平行数组 / 孤儿挂根 / 环防护 / 字段名可配）、
 * resolveInitialExpandedKeys（0-based level <= defaultExpandLevel、受控优先、
 * 内部 BFS 计层不依赖 buildFlatRows 产物 levels——全收起时深层不可见场景）、
 * toggleKey 展开集增删（纯函数不写回入参）。
 */
import {
  buildChildrenIndex,
  buildFlatRows,
  resolveInitialExpandedKeys,
  toggleKey
} from '@/components/canvas-table/tree.js'

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
  }
]
