# 实施记录（修复第 1 轮）

依据：05-verify-2.md「失败项」2 项（均为自检断言自身缺陷，非组件功能缺陷）。未改动组件源码与已通过断言。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/canvas-table/self-checks/cell-painters.js | 修复 05-verify-2 失败项 1 | L399 期望值 `'1,234.50'` → `'1,234.5'`（NumberColumn `minimumFractionDigits: 0`，src/components/table/column-types/number.js:8）；标签补注口径 |
| demo/src/data/canvas-table/self-checks/editor.js | 修复 05-verify-2 失败项 2 | L472 断言跨 reactive 边界的引用比较改为 `toRaw(...)` 解代理后 `assertEqual` 比原引用；新增 `import { toRaw } from 'vue'` |

## 偏离

无。失败项 2 验证报告给出两个修复方向（assertArray 比内容 / toRaw 后比较），选 `toRaw`：保留断言"原样注入"的引用语义（深拷贝不应通过），与断言名一致；node 最小实验证实读回值是 Proxy 且 `toRaw(read) === column.options` 为 true。

## 自检

| 命令 | 结果 |
|---|---|
| `node --check` 两个改动文件 | OK |
| node 复算 Intl（zh-CN, decimal, min 0 / max 2） | `1234.5 → '1,234.5'`、`12345.678 → '12,345.68'`，与新期望值及通过中的姊妹断言（cell-painters.js:444-445）一致 |
| node 最小验证 vue reactive/toRaw（项目 node_modules） | 读回 `state.editing.props.options` ≠ 原数组（Proxy），`toRaw(读回值) === column.options` = true，与注入链（editor.js:258 → :236-238 直传原引用）一致 |
| `npm run build` | exit 0；dev `✓ built`（dist/mussel.js 615.79 kB）+ prod `✓ built`（dist/mussel.min.js 294.51 kB） |

项目无 js lint script（stylelint 仅样式），适用检查为 node --check + build，均通过。

## 遗留

- 自检面板 169/169 全量复测属下轮 verify（浏览器手段）；本轮两项断言行为已用 node 层直接验证。
- 05-verify-2 的 UNVERIFIED / 需人工项不属本轮范围：验收 #5 改前基线缺失（decisions.md 已裁定转人工）、验收 #6 注释人工抽样。
