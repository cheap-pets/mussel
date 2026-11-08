# 实施记录

## 改动文件

| 文件 | 改动 | 对应问题 |
| --- | --- | --- |
| `src/components/table/ex/cell-paint/canvas-kind-painters.js` | ① L138 `layoutButtonEntries(...)` 调用换行；② 新增 `buttonLinkTextColorOf(theme, colored, hovered, disabled)`（disabled → muted 置灰，hover → hover 谱系回退链，常态 → color 回退链），`drawButtonLink` 内嵌套三元改调用；③ `drawButtonPill` 签名换行 | 基线 1（:138 max-len）、基线 2（:226 complexity 11）、基线 3（:262 max-len） |
| `src/components/table/ex/cell-paint/cell-text.js` | `drawTextValue` 多行分支整体提取为 `drawWrappedText`（原 `maxLines > 1 && ...` 分支体逐语句移入，`text` 改由 `String(display)` 在函数内重取，等值）；`drawTextValue` 原块注释保留在其上方 | 基线 4（:171 complexity 15） |
| `src/components/table/ex/cell-paint/cell-tooltip.js` | 新增 `buttonMeasureContextOf(theme, link)`（font/padX/buttonHeight 三切换）与 `iconButtonWidthOf(button, link, buttonHeight)`（无有效 icon 返回 null 哨兵）；`buttonsOverflowOf` 改用两者，判定顺序与算式（caption 截断 `width > contentWidth - consumed`）保持原样 | 基线 5（:72 complexity 13） |
| `src/components/table/ex/cell-paint/item-painters.js` | ① `measureItem` img 分支提取为 `measureImageItem`（空 src / 未加载 / 失败 → null 逻辑原样）；② `drawItem` icon 分支提取为 `drawIconItem`（maxWidth 守卫 + 色名查表回退原样） | 基线 6（:179 complexity 11）、基线 7（:213 complexity 13） |
| `src/components/table/ex/spans/spans-method.js` | `applySpanMethod` 内层 `for (name)` 声明落地块整体提取为 `registerRowDeclarations(declared, spanCtx, index, occupied, warnedKeys, row)`（控制流逐语句原样，spanCtx 传入内部解构）；叠加在基线未提交修复之上 | 基线 8（:242 complexity 11） |

基线编号 = 本记录下方「自检」eslint 基线报告的 8 条 warning。

## 偏离

无。未使用任何 eslint-disable；全部 8 项以格式化 / 行为等价提取消除。

## 自检

1. eslint 基线（修复前，`eslint "src/components/table/ex/" --ext .js,.vue --format unix`，全局 v8.57.0）：

   ```
   canvas-kind-painters.js:138  max-len 122（代码行）
   canvas-kind-painters.js:226  complexity 11  drawButtonLink
   canvas-kind-painters.js:262  max-len 122（代码行）
   cell-text.js:171             complexity 15  drawTextValue
   cell-tooltip.js:72           complexity 13  buttonsOverflowOf
   item-painters.js:179         complexity 11  measureItem
   item-painters.js:213         complexity 13  drawItem
   spans-method.js:242          complexity 11  applySpanMethod
   8 problems（0 error / 8 warning）
   ```

2. eslint 复扫（同命令）：无输出，exit 0 → **0 error 0 warning**。
3. `npm run build`：通过（dev `mussel.ex.js 729.59 kB` + prod `mussel.ex.min.js 333.80 kB`，两次 built）。
4. demo 自检：playwright 访问 `http://localhost:3000/data/table-ex/?t=20261108a`，调试面板显示「自检结果（243/243 通过）」。
   - Console 1 error `ERR_INVALID_URL @ data:image/png;base64,AAAA1:0`：demo 夹具故意坏图，上一任务 `20261108-table-bugfix-pipeline/05-verify-1.md:17` 已记录修复前后一致，非本轮引入。
5. `git status` 核对：本轮改动仅上表 5 文件；基线未提交改动（base/table.vue、use-column-resize.js、editor.js、layout.js、click-resolve.js、spans-method.js、paint-body.js、painter.js、demo 2 文件）、self-checks 他人改动、background.scss、todo/misc.md 均未还原未触碰（spans-method.js 为叠加）。

## 遗留

无。
