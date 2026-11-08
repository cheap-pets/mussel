# 实施记录（04-impl.md）

> 模式：整体（B1–B6 六批 + R1 机械项），按 02-design.md 实施步骤 1–7 顺序执行。
> 起点：HEAD `ee16eb4`（与设计基准一致，`git rev-parse --short HEAD` 复核），src/ 干净。
> 全程未执行任何改变工作区状态的 git 命令；未安装依赖；未派生子 agent。
> 全部批次 API 冻结复核：`git diff src/components/table/ex/index.js src/components/table/ex/table-ex.vue` 于每批批后均为空（0 行）。

---

## B1（O2 删转口直引 + S1 门禁脚本）

### 批前检查
- 消费方复核：`grep -rn "cellRectAt" src demo/src --include="*.js" --include="*.vue" | grep import` → 恰 3 处 import（`use-table-api.js:16`、`self-checks/spans.js:28`、`self-checks/painter.js:25`）+ 转口行 `painter.js:417-418`，行号与设计快照零漂移。
- git status 快照（B1 批前）：仅既有基线改动（`M agent-docs/knowledge/project/table-ex-performance-profiling.md`、`M todo/misc.md`、未跟踪 plans 文档），src/ 无改动。
- R4 豁免：按 02-design「基线豁免记录」B1 豁免探针基线（纯 T1 import 改写），保留自检双安全网。

### 改动文件
| 文件 | 改动 |
|---|---|
| src/components/table/ex/table-paint/painter.js | 删 L417-418（陈旧注释 + `export { cellRectAt } from './paint-utils.js'`） |
| src/components/table/ex/composables/use-table-api.js | L16 改从 `../table-paint/paint-utils` 直引 |
| demo/src/data/table-ex/self-checks/painter.js | L25 三符号行拆出 `cellRectAt` 单独一行改引 `paint-utils.js`（drawRegion/createPainter 仍从 painter 引，断言未触） |
| demo/src/data/table-ex/self-checks/spans.js | L28 单符号行改路径 `paint-utils.js` |
| scripts/table-ex-structure-check.mjs | 新建（node 零依赖；扫描 `src/components/table/ex/**` 排除 `index.js`，`PUBLIC_ENTRIES = new Set(['index.js'])` 硬编码豁免 + 注释"包对外公共入口，lang-js.md S1 生态豁免"；命中输出清单退出码 1，零命中报告退出码 0） |

### 验证（命令 + 结果）
| 命令 | 结果 |
|---|---|
| `node scripts/table-ex-structure-check.mjs` | `OK — 扫描 44 个文件，零纯转发 re-export（豁免公共入口：index.js）`，exit 0 |
| 门禁命中能力自测（临时违规文件放入 ex/ 后跑脚本再删） | `1 处纯转发 re-export 命中`，exit 1，临时文件已删 |
| 残留扫描 `grep -rn "cellRectAt" src demo/src ... \| grep import` | 3 处 import 全部指向 `paint-utils`，转口 0 |
| `npm run build` | dev+prod 两通道 built，exit 0 |
| eslint（B1 五文件） | 2 error + 1 warning 均为存量（`self-checks/painter.js:1259,1269` spaced-comment、`spans.js:336` max-len，`git show HEAD` 同行核实）；本批改动行零新增违规 → 批前批后增量 0 成立 |
| demo 自检双安全网 + DOM 断言（playwright，`http://localhost:3000/data/table-ex/`） | `自检结果（241/241 通过）`；canvas 1 个 956×416；console 仅 1 error（demo 数据占位无效 data URL 图片加载失败，与 import 改写无因果） |
| diff 等价审计 | painter.js 删 2 行（注释+转发）；3 个消费方各 1 行 import 改写，逐行配对语义等价 |
| API 冻结 `git diff src/components/table/ex/index.js src/components/table/ex/table-ex.vue` | 0 行 |

退出判据核对：门禁脚本 exit 0 ✓；转口消费清零 ✓；build + 自检过 ✓；diff 配对完成 ✓。

## B2（O6 controller ctx→deps）

### 批前检查
- 消费方复核：`grep -rn "createRowGeometryController" src demo/src` → `table-ex.vue:77,337`（传对象字面量，不受参数名影响）+ `self-checks/row-geometry-controller.js`（传字面量，只读冻结不改）；`grep -n "ctx:" table-ex.vue` → 0 命中。
- `grep -c "ctx"` controller.js = 33 行（设计"约 30 处"成立）；`grep -n "ctx" \| grep -v "\bctx\b"` → 0 命中（文件内无 spanCtx 类含 ctx 子串标识符，可安全整词替换）。
- git status 快照：B1 五文件 + scripts/（上批改动，无他批在途）。

### 改动文件
| 文件 | 改动 |
|---|---|
| src/components/table/ex/geometry/row-geometry-controller.js | 文件内 `ctx` → `deps` 全部替换（含 L10 头注释、L33 JSDoc、L45 签名及全部使用面，33 行） |

### 验证
| 命令 | 结果 |
|---|---|
| 残留扫描 `grep -cn "ctx" row-geometry-controller.js` | 0（grep exit 1） |
| `npm run build` | exit 0 |
| eslint（controller.js） | exit 0 |
| demo 自检 | 241/241（demo/dist 已由 watch 重建，mtime 确认晚于改码） |
| diff 等价审计 | `ctx`→`deps` 逐处替换，33 行逐行配对，无其他改动 |
| API 冻结 | 0 行 |

## B3（O5 注解补全 + 审计脚本 + row-geometry 头注释）

### 批前检查
- 行号复核：use-pointer.js @host-reads L7-9 / `host.flatRows.value` L234；use-table-api.js @host-reads L7-9 / `host.canvasEl.value` L108；row-geometry.js L1-2——零漂移（B1/B2 未动这三文件行结构）。
- 蓝本实测：`node tmp-audit.cjs` → 5 文件 MISSING，超出设计所列 2 缺口。逐个辨伪：
  - `use-pointer.js: flatRows.value`、`use-table-api.js: canvasEl.value` → 真实缺口（设计已列）；
  - `use-cell-tooltip.js / use-relayout.js: relayout` → 假阳性（`host.relayout` 出现在注释行，正文无使用，grep 核实）；
  - `use-table-instances.js: rowGeometry.*` → 假阳性（声明 `rowGeometry（消费 geometry /\n remeasureVisibleRows）` 跨行全角括号，蓝本按行剥离解析失败）。
- 结论：真实缺口恰为设计所列 2 处，设计无误；正式审计脚本须修复蓝本两处解析缺陷（注释误抓、跨行括号）方能达成"10 文件零缺失 exit 0"。

### 改动文件
| 文件 | 改动 |
|---|---|
| src/components/table/ex/composables/use-pointer.js | @host-reads 补 `flatRows`（L7-9） |
| src/components/table/ex/composables/use-table-api.js | @host-reads 补 `canvasEl`（L7-9） |
| src/components/table/ex/geometry/row-geometry.js | 文件头补"含行高估高/精算算法（computeRowHeights/ensureRowMeasured）" |
| scripts/table-ex-host-audit.mjs | 新建（@host-reads/writes/calls 声明 vs `host.<键>` 使用审计；蓝本解析逻辑 + 两处修复：used 抓取剥离行注释/块注释、括号注释先于按行解析整体剥离支持跨行；前缀覆盖双向；点键匹配；缺失清单退出码 1） |

### 验证
| 命令 | 结果 |
|---|---|
| `node scripts/table-ex-host-audit.mjs` | `OK — 审计 10 个 composables 文件，host 键声明零缺失`，exit 0 |
| 审计命中能力自测（临时未声明键文件放入 composables 后跑再删） | `MISSING -> undeclaredKey.value`，exit 1，临时文件已删 |
| `npm run build` | exit 0 |
| eslint（B3 四文件） | 首轮报新脚本 2 error（unused imports）+ 1 warning（complexity 14>10）——属本批新交付文件，已修复（删除未用 import、提取 addTokens 辅助函数）；修复后 exit 0 |
| demo 自检 | 241/241 |
| API 冻结 | 0 行 |

## R1 复测（信号清零 + 两问验收）

- ① 信号清零：`node scripts/table-ex-structure-check.mjs` exit 0；`node scripts/table-ex-host-audit.mjs` exit 0；`grep -rnE "export \*|export \{[^}]*\} from" src/components/table/ex --include="*.js"` → 仅 `index.js:1-2` 公共入口豁免项。**通过**。
- ② 两问验收：5 功能点 + 5 改动点全部 grep 静态定位，与 02-map.md 核对全对（明细见 02-design.md「复测记录」节）。宽泛命中逐一辨伪（layout.js:39 resolveResizeWidth、constants.js:10 / spans.js:160 / edit-button.js:11 hitTest 均为注释引用，非代码引用）。
- 执行方式说明（局限）：派发硬边界禁止派生子 agent，无法启动全新上下文实例；由实施者以 grep-only 纪律执行（不读实现文件正文，仅看 grep 命中行上下文）。独立复核留待检验轮 verifier。

## B4（O1 interactions 按域拆三文件）

### 批前检查
- 消费方复核：`grep -rln "interaction/interactions" src demo/src` → 恰 5 文件，import 行号与设计一致（use-pointer:16 / use-cell-click:19 / use-column-resize:20 / use-cell-tooltip:25 / self-checks/interactions.js:20-34）。
- self-checks 13 符号按 4（hit-test）+7（click-resolve）+2（resize-resolve）分布确认。
- git status 快照：B1–B3 改动 + scripts/ 在途，无未完成他批。
- 基线采集（baseline/B4/，起点 HEAD ee16eb4，同口径连采两次）：
  - build 序两次 diff 为空；
  - console 警告/错误原文序列归一化（13 位时间戳随机键→`<TS>`、bundle 行号→`:<L>`）后 diff 为空；
  - 自检 241 条断言文本两次比对：3 处字体度量时序漂移（LRU measure 计数 47/47 vs 42/42、CJK 锚 font 13.168px vs 13.8787px、iconfont 墨迹 19.9001/21.3391 vs 19.4896/21.7539）——均为改码前两次间的环境时序漂移，列明为非语义漂移（口径记录于 baseline/B4/README.md）。

### 改动文件（9）
| 文件 | 改动 |
|---|---|
| src/components/table/ex/interaction/hit-test.js | 新建（185 行）：hitTest、resolveCursor、resolvePointerdown、resolveTooltipTarget + 私有 contentRightEdgeX/isTreeArrowSlot/isSortableHeader/isEditableCell/isBodyCellHit/isEditingCell；模块级 import layout/tree/constants 归本框 |
| src/components/table/ex/interaction/click-resolve.js | 新建（218 行）：resolveOrderByNext、isCheckHeaderColumn、resolveHeaderClick、resolveCellClick、resolveTreeToggle、resolveItemClick、resolveCellClickOpen + 私有 isItemClickable/isItemRectHit/findHitItem；`isTreeArrowSlot` 自 ./hit-test import |
| src/components/table/ex/interaction/resize-resolve.js | 新建（18 行）：resolveResizeWidth、RESIZE_MIN_WIDTH |
| src/components/table/ex/interaction/interactions.js | 删除（407 行） |
| src/components/table/ex/composables/use-pointer.js | L16 拆两条：hit-test（resolveCursor/hitTest/resolvePointerdown）+ click-resolve（resolveItemClick） |
| src/components/table/ex/composables/use-cell-click.js | L19 改引 click-resolve（5 符号不变） |
| src/components/table/ex/composables/use-column-resize.js | L20 改引 resize-resolve |
| src/components/table/ex/composables/use-cell-tooltip.js | L25 改引 hit-test |
| demo/src/data/table-ex/self-checks/interactions.js | L20-34 十三符号 import 块拆 3 条 import（4+7+2），断言零修改 |

### 验证
| 命令 | 结果 |
|---|---|
| 残留扫描 `grep -rln "interaction/interactions" src demo/src` | 0 命中 |
| 导出面比对（新三文件 vs HEAD interactions.js） | 13 原符号全部保留原原名；新增 `isTreeArrowSlot` 导出（设计拆分表 click-resolve 行"isTreeArrowSlot 自 hit-test import"的跨文件依赖所需，模块内部可见性，非公共 API） |
| `npm run build` | 首轮失败：`"isTreeArrowSlot" is not exported by hit-test.js`——hit-test.js 漏写 export（实施遗漏，即时补一行 `export`）；修复后 exit 0。build 序 diff：模块数 334 vs 基线 332（1 文件拆 3 = +2，精确吻合）+ 产物尺寸微差（+1.1 kB dev bundle / min gzip 96.30→96.26 kB，模块包装开销 <0.2%）——T2 结构性预期差异，记录于 baseline/B4/README.md 同批注 |
| eslint（interaction/ 全目录 + 4 消费方 + self-check） | exit 0 |
| 探针基线复采比对 | console 序列与基线逐字一致；自检 241 条一致（剔除列明漂移：px 实测/measure 计数/文本锚 y 取整——后两者口径补记入 README） |
| 行数与浅模块核对 | 185/218/18 行均 ≤350；各文件承载实质判定逻辑（命中/光标门控、click 分支事件派发、clamp 计算），过删除测试 |
| demo 自检 + DOM | 241/241 |
| API 冻结 | 0 行 |

## B5（O3 paint-overlay 描边链提取）

### 批前检查
- 三站点行号复核：paintHoverEditorStroke L98-135 / paintHoverPlainStroke L140-172 / paintCellSelection L178-219；L139 互补谓词注释；三处 strokeRect 参数（原 L132/L169/L216）逐字一致——零漂移。
- git status 快照：B1–B4 在途改动（interaction/ 三新文件 + 4 消费方 + self-checks），无未完成他批。
- 基线采集（baseline/B5/）：build 序两次一致；console 归一化后两次一致；自检 241 条归一化后两次一致（复用 B4 归一化口径）。

### 改动文件（1）
| 文件 | 改动 |
|---|---|
| src/components/table/ex/table-paint/paint-overlay.js | 新增文件内私有 `cellFrameOf(state, row, col)`（矩形链：regionAt → spanRectOf → editorRectOf(editorGridlineFlagsOf 8 字段)）与 `strokeBodyFrame(ctx, state, col, rect, strokeStyle)`（strokeStyle/lineWidth 预设 + clipX0 计算 + withClip 表体区裁剪 + strokeRect）；三站点改调，谓词判定保留原位；文件 291 → 254 行 |

### 验证
| 命令 | 结果 |
|---|---|
| `npm run build` | exit 0；build 序 diff 仅产物尺寸（dev 727.03→726.48 kB、min gzip 96.26→96.18 kB，重复块消除的预期缩减）；模块数不变 |
| eslint（paint-overlay.js） | exit 0 |
| 探针基线复采比对 | console 与基线逐字一致；自检 241 条一致（剔除列明漂移） |
| 等价性校验点 ①（L139"矩形链逐字同源"注释约束） | 三处逐字重复链收敛为 cellFrameOf 单一定义三处调用，结构保证同源；互补谓词注释保留于 paintHoverPlainStroke 头 |
| 等价性校验点 ②（三处 strokeRect 参数逐字一致） | `rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1` 现唯一处（L134，strokeBodyFrame 内），grep 证实 |
| 等价性校验点 ③（谓词互补仍由原函数判定） | 两行谓词逐字保留原位（L141 可编辑判定 / L158 互补判定），grep 证实 |
| 行数与浅模块核对 | 254 行 < 400 软线；cellFrameOf/strokeBodyFrame 承载实质几何/裁剪逻辑非透传 |
| demo 自检 | 241/241 |
| API 冻结 | 0 行 |

## B6（O4 controller 同源收敛）

### 批前检查
- 行号复核（B2 后行号）：syncAnchoredLayout L225-240（既有定义）、内联锚定块 L421-434（computeAnchorShift L421 起）、`recordNumber` 内联 L268；`recordNumberOf` import 已存在 L21——零漂移。
- 同源逐 token 复核：内联块与 syncAnchoredLayout 除 `variableGeometry`↔`geometry` 形参别名外语句序列一致；`recordNumberOf` 函数体 `(recordsOffset || 0) + row + 1`（cell-identity.js:14-16，注释"原 10 处内联式收敛至此"）与内联式逐 token 相等。
- git status 快照：B1–B5 在途改动，无未完成他批。
- 基线采集（baseline/B6/，含滚动点位）：build 序两次一致；console/自检两次一致（同口径）；滚动点位两次逐值一致——容器 `.mu-table-ex__scroll` scrollTop 0→300 回写稳定 300、scrollHeight 3600206、canvas 956×416、滚动后 canvas dataURL 长度 62458（参考值）、滚动后自检 241/241、滚动后 console 序列两次一致（口径见 baseline/B6/README.md）。

### 改动文件（1）
| 文件 | 改动 |
|---|---|
| src/components/table/ex/geometry/row-geometry-controller.js | L268 `recordNumber: (deps.getRecordsOffset() || 0) + row + 1` → `recordNumberOf(deps.getRecordsOffset(), row)`；L421-434 内联锚定块（shift 计算 → scrollTop 回写 → setLayout）→ `syncAnchoredLayout(cur, el, variableGeometry, anchorRow, prevTopAtAnchor)`；文件 466 → 452 行 |

### 验证
| 命令 | 结果 |
|---|---|
| 结构检查 | computeAnchorShift/syncAnchoredLayout 各仅剩定义处 + 调用处（syncAnchoredLayout 定义 L225 + 2 调用 L279/L421），无残留内联副本 |
| `npm run build` | exit 0；build 序 diff 仅产物尺寸微降（dev 726.48→726.18 kB，重复块消除预期）；模块数不变 |
| eslint（controller.js） | exit 0 |
| 探针基线复采比对（含滚动点位） | console 与基线逐字一致；滚动后 console 与基线逐字一致；自检 241 条一致；滚动点位逐值一致（scrollTop 0→300→settle 300、scrollH 3600206、canvas 956×416、dataUrlLen 62458、滚动后自检 241/241） |
| 等价性校验点 ①（内联块与 syncAnchoredLayout 逐 token 相等） | 改码前逐段比对确认（别名归一后）；改后调用参数序与既有调用 L279 同构 |
| 等价性校验点 ②（recordNumberOf 与内联式逐 token 相等） | cell-identity.js:14-16 函数体与原内联式逐 token 相等，改前确认 |
| demo 自检 | 241/241（滚动后亦然） |
| API 冻结 | 0 行 |

---

## 改动文件（汇总）

**src（9 改 + 3 新 + 1 删）**
| 文件 | 批 | 设计步骤 |
|---|---|---|
| src/components/table/ex/table-paint/painter.js | B1 | 步骤 1（O2） |
| src/components/table/ex/composables/use-table-api.js | B1, B3 | 步骤 1, 3 |
| src/components/table/ex/geometry/row-geometry-controller.js | B2, B6 | 步骤 2, 7 |
| src/components/table/ex/composables/use-pointer.js | B3, B4 | 步骤 3, 5 |
| src/components/table/ex/geometry/row-geometry.js | B3 | 步骤 3 |
| src/components/table/ex/interaction/interactions.js | B4（删除） | 步骤 5 |
| src/components/table/ex/interaction/hit-test.js | B4（新建） | 步骤 5 |
| src/components/table/ex/interaction/click-resolve.js | B4（新建） | 步骤 5 |
| src/components/table/ex/interaction/resize-resolve.js | B4（新建） | 步骤 5 |
| src/components/table/ex/composables/use-cell-click.js | B4 | 步骤 5 |
| src/components/table/ex/composables/use-column-resize.js | B4 | 步骤 5 |
| src/components/table/ex/composables/use-cell-tooltip.js | B4 | 步骤 5 |
| src/components/table/ex/table-paint/paint-overlay.js | B5 | 步骤 6 |

**demo/src（3，均仅 import 行，断言零修改）**
| 文件 | 批 | 设计步骤 |
|---|---|---|
| demo/src/data/table-ex/self-checks/painter.js | B1 | 步骤 1 |
| demo/src/data/table-ex/self-checks/spans.js | B1 | 步骤 1 |
| demo/src/data/table-ex/self-checks/interactions.js | B4 | 步骤 5 |

**scripts（2 新建，正式交付物）**
| 文件 | 批 | 设计步骤 |
|---|---|---|
| scripts/table-ex-structure-check.mjs | B1 | 步骤 1 |
| scripts/table-ex-host-audit.mjs | B3 | 步骤 3 |

**验证产物（留存）**：baseline/B4/、baseline/B5/、baseline/B6/（各含 build/console/selfcheck 基线 + README 口径记录；B6 含滚动点位）。

**02-design.md**：批次计划表 B1/B2/B3/B4/B5/B6/R1 状态 → 完成；「复测记录」节填入 R1 两步结果。

## 偏离

1. **B4 hit-test.js 首写漏 `export isTreeArrowSlot`**（设计步骤 5）：设计拆分表将 isTreeArrowSlot 列为 hit-test.js"私有随迁"，同表 click-resolve 行又注明"isTreeArrowSlot 自 hit-test import"——跨文件 import 要求导出，两者只能取后者。首轮 build 报 `MISSING_EXPORT` 后补一行 `export`。属设计表格述歧义的落地取义（取 import 侧语义），非行为改动；导出面比对记录在案（13 原符号 + isTreeArrowSlot 转导出）。
2. **B3 审计脚本两处解析修复超出蓝本**（设计步骤 3，预期内）：设计 O5 明示蓝本解析逻辑"为脚本蓝本"，未明示缺陷。实测蓝本对 5 文件报 MISSING，其中 3 文件为解析假阳性（注释中 `host.relayout` 误抓 ×2、跨行全角括号声明解析失败 ×1）。正式脚本修复两处（used 抓取剥离注释、括号剥离先于按行解析）；真实缺口恰为设计所列 2 处，设计判定"2 缺口"成立，属脚本实现细节而非设计偏离。
3. **R1 两问验收执行方式**（设计步骤 4）：设计要求"全新上下文 agent"，派发硬边界禁止派生子 agent，无法满足。降级为实施者 grep-only 纪律执行（不读实现正文，只看命中行上下文），宽泛命中逐一辨伪；已在 02-design 复测记录与上文如实标注局限，建议终验/检验轮由独立 verifier 实例复跑两问。
4. **build 序基线"逐字比对"的口径澄清**（B4/B5/B6）：产物尺寸与模块数随拆分/去重机械变化（B4 模块数 +2 精确等于拆分文件差；B5/B6 尺寸微降为重复块消除），属 T2/T3 结构性预期，非行为面。行为面以 console 原文序列 + 自检断言输出 + DOM/滚动点位判定（三者全部逐字/逐值一致）。口径已记录于各 baseline/README.md。

## 自检

见各批「验证」小节（命令 + 退出码/关键输出已逐条留存）。总口径：
- 每批 `npm run build` exit 0；全局 eslint（/d/npm/global/eslint）本批口径 0 新增违规（存量 3 处：self-checks/painter.js:1259,1269 spaced-comment、self-checks/spans.js:336 max-len，不属本任务修复范围）。
- demo 自检 241/241 通过每批复验（demo watch 重建确认：dist mtime 晚于改码）。
- 双脚本（S1 门禁 / @host 审计）exit 0 且经临时违规文件自测有命中能力。
- API 冻结（ex/index.js + table-ex.vue git diff）每批复核恒为空。
- 行为变化即停（R4）：全程无任何校验点要求改断言或基线，未触发。

## 遗留

- 任务目录下 `tmp-audit.cjs` / `tmp-depgraph.cjs` / `tmp-s8scan.cjs` 为设计阶段临时脚本（02-map §1/§6.2 引用其复现口径），非本轮创建，未擅自删除；建议终验后随 02-map 改写一并清理（02-map 注明"临时脚本，任务后删"）。
- baseline/ 三目录为验证留档（含原始与归一化文件），随任务目录留存供 verifier 复采比对；R4 口径冻结后不可事后修改。
- 02-design 批次计划表「终验」行仍为待执行（步骤 8，派发范围为步骤 1–7）；收尾项（02-map 现状导航改写 + structure-map 知识同步）按 00-task 另行派发。
- R1 两问验收的独立实例复核建议并入终验（见偏离 3）。
