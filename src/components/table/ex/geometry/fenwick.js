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

export function createFenwick (values) {
  const n = values.length
  let tree = buildFenwick(values)
  // 倍增下降起始步长（≤ n 的最高 2 幂，随创建时 n 定死）
  let power = 1

  while (power * 2 <= n) power *= 2

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
    // TODO 换树不复算 n/power：变长入参时 findRowAtOffset 起始步长与上界按
    // 旧行数失配（定位错行）、prefix/add 按旧 n 截断；现调用方
    // applyEstimatedHeights 仅行数不变时触达，支持变长 rebuild 须先修此处
    rebuild (nextValues) {
      tree = buildFenwick(nextValues)
    }
  }
}
