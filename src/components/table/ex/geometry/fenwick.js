// —— Fenwick 树（BIT，Float64Array） ——

function buildFenwick (values) {
  const n = values.length
  const tree = new Float64Array(n + 1)

  for (let i = 1; i <= n; i++) {
    tree[i] += values[i - 1]
    const parent = i + (i & -i)

    if (parent <= n) tree[parent] += tree[i]
  }

  return tree
}

/** 倍增下降起始步长（≤ n 的最高 2 幂） */
function highestPow2 (n) {
  let power = 1

  while (power * 2 <= n) power *= 2

  return power
}

export function createFenwick (values) {
  let n = values.length
  let tree = buildFenwick(values)
  let power = highestPow2(n)

  return {
    add (index, delta) {
      for (let k = index + 1; k <= n; k += k & -k) tree[k] += delta
    },
    /** 前 count 项之和（count = 计入项数，非末项下标） */
    prefix (count) {
      let sum = 0

      for (let k = Math.min(count, n); k > 0; k -= k & -k) sum += tree[k]

      return sum
    },
    /** 偏移定位（倍增下降）：前 pos 项和 ≤ offset 的最大 pos（∈ [0, n]） */
    findRowAtOffset (offset) {
      let pos = 0
      let remaining = offset

      for (let step = power; step > 0; step >>= 1) {
        const next = pos + step

        if (next <= n && tree[next] <= remaining) {
          pos = next
          remaining -= tree[next]
        }
      }

      return pos
    },
    /** 整体重建 O(n)：同步 n/power/tree，支持变长入参 */
    rebuild (nextValues) {
      n = nextValues.length
      tree = buildFenwick(nextValues)
      power = highestPow2(n)
    }
  }
}
