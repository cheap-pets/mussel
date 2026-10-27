# 实施记录：G2-5（self-checks/interactions.js）

模式：并发（波 2b / 步骤 G2-5）。白名单：`demo/src/data/canvas-table/self-checks/interactions.js`（仅此文件）。
依赖：按 04-impl-G1-c.md 实际落地形态对齐断言（`findHitItem` 透传 `disabled: entry.disabled === true`、`resolveItemClick` 返回 `{ kind, index, row, col, disabled } | null`、签名不变、无 tree 参数）；itemHits 条目契约按 S4 落地形态 `{ kind, index, rect, disabled }`。

## 改动摘要

仅改写「resolveItemClick」一个检查块 + 模块头 docblock 同步，其余 16 个检查块零改动：

- **夹具**：itemHits 条目补 disabled 两态——dots link 条目（row 3 / col 1 / index 2）`disabled: true`；tag 条目（row 3 / col 2）显式 `disabled: false`；首条 link（index 0）保持无字段（覆盖「缺字段得 false」缺省路径）。形状注释更新为 `Map<row, Map<col, Array<{ kind, index, rect, disabled }>>>`。
- **断言**：hitLink 反查断言扩含 disabled（`[kind, index, row, col, disabled]` ↔ `['link', 0, 3, 1, false]`）；新增 disabled 条目 → `true`、正常条目（显式 false）→ `false` 两条；块名与摘要行补「disabled 透传」表述。
- **docblock**：模块头覆盖清单「条目点击反查」行补「disabled 两态透传——问题 7 A7」。

### 断言清单（计数）

| 类别 | 数量 | 明细 |
|---|---|---|
| 新增 | 2 | `hitDots.disabled === true`（disabled 条目）；`hitTag.disabled === false`（正常条目） |
| 改写 | 1 | hitLink 反查 assertArray 扩含 disabled 位（期望 `['link', 0, 3, 1, false]`） |
| 删除 | 0 | — |
| 既有保留 | 6 | dots 命中、间隙不命中、窗口外行不命中、表头不反查、itemHits 缺省安全、（块内其余） |

### 树相关断言处置

文件内**无旧树抑制（问题 8 禁排）断言残留**，无需清理；未新增任何 tree 相关断言。既有 `resolveTreeToggle`（树箭头槽 toggle）与 `resolveCursor` 树槽 pointer 断言属既有树交互行为（与排序抑制无关），按零改动原则保留不动。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/canvas-table/self-checks/interactions.js | G2-5（02-design.md「测试计划」A7 行 + 改动清单 interactions 行） | resolveItemClick 断言扩 disabled 两态透传（true/false/缺字段 false 三路径） |

## 自检

| 判据 | 命令 / 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/canvas-table/self-checks/interactions.js` → exit 0，无输出 | PASS（0 error / 0 warning） |
| 直调走查（对齐 G1-c 纯函数直调方式） | esbuild 打包（alias `@` → src，`.scss` empty loader）→ node 运行 `checks` 全量 17 块 | PASS（17/17，0 failed；含改写块内全部断言） |
| 断言对齐 G1-c 实际形态 | 打包产物直调即对真实 `resolveItemClick` 求值：disabled 条目返回 `disabled: true`、无字段/显式 false 条目返回 `false`、命中形状含 row/col/kind/index | PASS |
| 白名单 | `git status`：本组改动仅 self-checks/interactions.js（并列出现的 cell-painters.js / editor.js / src interactions.js 为 G2-3 / G2-2 / G1-c 在途状态，未触碰） | PASS |

临时打包产物与 runner 在 /tmp，已清理。

## 偏离

无。

## 遗留

- 本组不做页面级验证（派发约束）；自检面板整包 boot 与 A7/A9 运行时断言由 V 集成验证执行（依赖 G2 其余各组 self-checks 同步落地）。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（沿用 G1/S4/S5 环境备注；本地 node_modules 缺 eslint-config-standard）。
