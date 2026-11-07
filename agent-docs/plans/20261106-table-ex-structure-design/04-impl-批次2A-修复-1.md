# 实施记录（批次 2A 修复轮 1：use-cell-tooltip isSameCell 漏网）

依据：`05-verify-批次2A-1.md`「失败项」（唯一 FAIL：use-cell-tooltip.js:141 残留自由标识符
`isSameCell`，hover 时 ReferenceError，tooltip 展示全断）+ 派发修复内容三项。

## 缺陷定位

- 批次 2A（04-impl §4.2-10）删除 use-cell-tooltip.js 局部 `isSameCell`（HEAD:37–41）时，
  仅转换了 HEAD:64 去重点（现 :68 `isSamePoint`），漏转换 HEAD:137 过期守卫（现 :141）。
  04-impl 记录「调用点改 isSamePoint」按 1 处计，实际调用点 2 处——与验证报告归因一致。
- 修复语义等价性：HEAD 局部 `isSameCell`（null 归一 + row/col 两字段相等）与
  `shared/cell-identity.js:7–11` `isSamePoint` 逐字同源（cell-identity.js:4 注释明示收敛
  来源即本函数），替换不改行为。

## 改动文件

| 文件 | 对应问题 | 改动 |
|---|---|---|
| src/components/table/ex/composables/use-cell-tooltip.js | 验证报告失败项 1 | :141 `isSameCell` → `isSamePoint`（仅此 1 行标识符替换；import 已在 :29 存在，未新增） |

## 同类漏网全量自查（派发第 2 项，一次修净）

注意：`git grep` 不覆盖未跟踪文件（cell-identity.js / editor-geometry.js 均为 ?? 新建），
扫描用 `grep -rn` 全仓（含未跟踪）执行。

| 扫描项 | 结果 | 结论 |
|---|---|---|
| `isSameCell`（src/ + demo/src/） | 仅 cell-identity.js:4–5 注释（历史来源说明，非代码） | 无调用残余，:141 为唯一漏网站点，已修 |
| `-w isSameHover` | 0 命中；`isSameHoverItem`（use-pointer.js:164/200）为独立五字段谓词，cell-identity.js:5 明示不并入本谓词、04-impl 清单亦未迁移 | 非漏网，不动 |
| editor-geometry 4 符号消费点 vs import | use-cell-click.js:22→:304；edit-button.js:7→:19；paint-overlay.js:4→:115/:157/:203/:117/:159/:205/:248；demo editor.js:35→多处；demo painter.js:25→:1151；demo spans.js:29→:535 等，全部配对（editor.js:3 / constants.js:34 / demo 各处为注释指涉） | 无漏网 |
| `recordNumber` 非 NumberOf 残余 | 仅 row-geometry-controller.js:298 内联式 + 各文件 `recordNumber` 数据字段名（props/载荷键，合法） | :298 为 04-impl 偏离 1 已登记项（待调度者决定归属批次），非自由标识符、不抛错，不在本缺陷与同类漏网范围，未动 |

## 偏离

无。

## 自检

- `npm run build`：exit 0，4 段 vite build 全 `✓ built in 476–524ms`（base ×2 + ex 332
  modules ×2），无 error/warning（除 npm config 无关告警）。
- 修复行核对：use-cell-tooltip.js:141 现为 `if (!isSamePoint(tooltipCell, cell)) return`；
  :29 `import { isSamePoint, recordNumberOf } from '../shared/cell-identity'` 未动。
- 本轮改动仅 1 行标识符替换，未触 §4.0 避让文件，未扩改动面。
- 项目无 lint/typecheck 脚本，以 build 代替（与 04-impl 同口径）。
- hover 交互路径运行时复证（tooltip 弹出）属验证员职责，本轮未执行（派发仅要求 build 过）。

## 遗留

- row-geometry-controller.js:298 内联 recordNumber 站点（04-impl 偏离 1）仍待调度者决定。
- 验证报告「测试质量问题」建议（后续批次探针基线追加 hover 交互步）属验证方案改进，非代码改动，未实施。
