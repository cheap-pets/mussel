# 实施记录（修复轮 1 / 验证轮 2）— spans 自检 5 警告坐标断言

对应 05-verify-1.md 失败项 1（唯一失败项）：spans 自检 5 期望警告含 `(1, 3)`，实现输出 `(0, 3)`。

## 裁定

**断言笔误，修断言；实现坐标口径正确，零改动。** 依据：

1. 设计 §2.3 规则 6 / §3.2 规则 4 / §7：重叠丢弃警告描述的对象是「被整条丢弃的声明」，其去重键 `(row, col, 原因)` 中的 `(row, col)` = **声明的锚格**——row 为产出该声明的 spanMethod 行、col 为解析后的目标列。实现（spans.js `registerRegion` 的 emitWarn，`${row}|${colIndex}` 即声明锚格）与该口径一致。
2. 自检 5 夹具中 spanMethod 仅在 `recordIndex === 0` 产出声明（`{ ka: 2, kb: 3, fb: 2, ghost: 2 }`），fb→列 3 的声明锚格即 `(0, 3)`；它与 kb 区域 [0,3)×{3} 在格 (0,3)、(1,3) 相交 → 整条丢弃 + 警告，警告坐标 = 声明锚格 (0, 3)。
3. 即使退一步按「首个相交格」口径，fb 声明 [0,2)×{3} 与 kb 区域的首个相交格也是 (0, 3)——`(1, 3)` 在任何口径下均不成立，系编写期从相邻断言 `anchors.get(1)?.get(3) == null`（验证行 1 无锚）误挪行号的笔误。
4. 功能行为本身 verifier 已确认正确（丢弃发生、警告存在、anchors(0,3).rowspan=3、anchors(1,3)=undefined 均符合 §2.3/§3.2），与裁定一致。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `demo/src/data/table-ex/self-checks/spans.js` | §9 自检 5 | L207-208：重叠丢弃警告断言坐标 `(1, 3)` → `(0, 3)`，补一行坐标口径注释（§3.2/§7 = 声明锚格）。仅此一处，其余断言与库代码未动 |

## 偏离

无。

## 自检

- Node 冒烟（/tmp/spans-smoke.mjs，esbuild 打包 spans/cell-painters/row-geometry/tree 源码，断言与修复后自检 5 同口径——含 `重叠 + (0, 3)` 精确坐标）：15 项全 PASS（自检 1–12 等价断言 + tree parentKeys + §7 接管 info）。
- `npm run build`：exit 0，mussel dev/prod + mussel.ex dev/prod 四段全过。
- demo 构建（`npx vite build --config vite.demo.config.js` 单次非 watch）：通过，self-checks/spans.js 编译入 `demo/dist/data/table-ex/main.js`。
- 浏览器侧自检面板复验（应 185/185）由后续 verifier 负责。

## 遗留

无新增。05-verify-1.md「需人工检查」两项（demo 17 视觉细目、demo 15 img 异步重绘链路）非代码失败项，维持原状待人工。
