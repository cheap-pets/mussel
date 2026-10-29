# 验证报告 — I2 第 2 轮（verifier）

VERDICT: PASS

验证环境：demo watch 常驻 :3000（先行检查两页均 200，非本轮启动，无 PID 需回收）；playwright 页面 `document.visibilityState = 'hidden'`（后台页），原生输入/scroll 事件停发——全部交互经合成 PointerEvent/MouseEvent/KeyboardEvent/scroll Event 驱动 sticky 层与滚动容器真实处理器链（生产路径）；rAF 延迟 ~0.5–1.5s（bringToFront 后可落地，所有滚动/重绘等待用 Node 侧 ≥1.8s）；像素断言经 `getImageData`。上轮 3 项 FAIL 逐项独立复验（不采信 04-impl-修复-1.md 自述），关键回归抽查按派发执行。

## 上轮问题核对（第 2 轮）

| # | 上轮失败项 | 复验结论 | 证据（本轮独立实测） |
|---|-----------|---------|---------------------|
| 1 | 变高行高度重置（scrollHeight 回缩 / 已精算行高丢失 / 门控误判） | **已解决（PASS）** | 见下方「上轮失败项复验表」第 1 行 |
| 2 | fixed 场景夹具缺陷（button 列无 buttons 配置、itemRecords 无 count → NaN） | **已解决（PASS）** | 见复验表第 2 行 |
| 3 | tag.js「已记录-未覆盖」 | **已解决（PASS）** | 见复验表第 3 行 |

上轮测试质量问题：①单调性验证只做正向——本轮已做反向往返（底部↔中部 ≥3 轮）；②fixed 夹具缺陷——已修复并复验；③自检断言质量——维持良好（新增 snapshotsEqual 断言为行为断言，见「测试质量」）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit 0 | dev `mussel.js 603.46 kB / mussel.css 120.64 kB`；prod `mussel.min.js 282.95 kB / min.css 97.55 kB`；两次 `✓ built in`。日志：`evidence/build-r2.log`。备注：首轮后台执行因 evidence/ 目录不存在重定向失败实际未跑（EXIT=1），建目录后复跑成功，以复跑为准 |
| `npx stylelint "src/components/table-ex/*.scss" src/styles/link.scss` | exit 0 | 无输出无错误（不含 --fix，验证态；上轮同命令已过） |
| 自检面板首载 ×2 次（/data/table-ex/） | 通过 | 两次独立导航均「自检结果（143/143 通过）」，0 ✗；分组 text-wrap 10 / row-geometry 12 / tree 8 / theme 15（新增 snapshotsEqual 1）/ layout 21 / cell-painters 28 / painter 14 / interactions 18 / editor 13 / data 4 = 143 |
| 自检面板页内重跑 | 通过 | 合成 click「重跑自检」→ 仍 143/143、0 ✗ |
| 控制台 | 2 error | 均为自检夹具故意 badSrc（`data:image/png;base64,AAAA1/AAAA2`），既有测试行为非缺陷 |

## 上轮失败项复验表

| 项 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1a 单调不回缩（树场景 variable，1 万节点） | 浏览器 | 底部↔中部 3 轮往返 + 终回中部（M350000 ↔ B 最大）+ 第二中部位置（354200/352800）往返：scrollHeight 序列 `360144(初始估高) → 360178(B1 精算 row9998) → 360178×5 腿(M2/B2/M3/B3/M4) → 360212(352800 精算 row9798) → 360212(B6 往返后)`，全程单调不回缩；旧行为 360178↔360144 交替未复现 | PASS |
| 1b 长行滚离再滚回高度不重置 | 浏览器 | row 9998（根 2000，长文本 maxLines 3）：36（估）→ 70（B1 精算）→ 滚离（M2）再滚回（B2/M3/B3/M4/B5/B6）7 次读数恒 70；row 9798（根 1960）：精算 70 后 B6 往返恒 70 | PASS |
| 1c 快照门控不误伤真实主题变更 | 浏览器 | 门控生效侧：11 条滚动腿（含 `mu-table-ex--y-scrolled-end` class 增删翻转，读数中 rootClass 交替可见）`getThemeSnapshot()` 对象引用全程不变（旧行为 class 翻转即换快照对象）。不误伤侧：暗色切换（demo「mu-dark 挂组件根」开关，生产路径）→ 引用更新 + bgNormal `rgb(255,255,255)`↔`rgb(7,8,8)` + 画布像素 `246,246,246`↔`19,21,23`↔还原，且切换中 contentHeight 360212 / h9998=70 不变（色变不触发行高缓存失效，签名设计正确）；`refreshTheme()` → 引用更新（manual 不抑制，theme.js:290 仅抑制 `reason === 'mutation'`），刷新后 contentHeight 仍 360212 不回缩、h9998 仍 70（rebuild 缓存保留） | PASS |
| 1d rebuild 路径缓存保留（树 toggle） | 浏览器 | 同场景内滚底精算（360178/70）→ 收起根 1（359926，7 行移除）→ 重展开：**精确恢复 360178 / row9998=70**（未回退估高基线 360144）——record 引用级 WeakMap 缓存跨 toggle rebuild 复用（table-ex.vue:273/:457-471/:527-533/:610/:723） | PASS |
| 2a fixed 场景 button 列绘制 + 双区命中 | 浏览器 | fillText 探针（refreshTheme 整幅重绘采样）：button 文本（『编辑』『删除』等）在列，数量值 120/456/789/24 在列。合成点击（pointerdown→pointerup→click）：滚动区 button（col 5）→ `cell-item-click {"record":"#1","column":"buttons","button":{"caption":"编辑"},"recordIndex":0}` + 选中链（update:selected-record-key/-record、cell-click column buttons）；固定区 link（col 1）→ `cell-item-click {"column":"links","link":{"caption":"Mussel 文档"},"recordIndex":0}` + cell-click——双区命中均发事件 | PASS |
| 2b 数量列无 NaN | 浏览器 | fillText 全量采样 0 条含 'NaN' 文本（上轮 NaN 已消除；夹具 itemRecords 补 count 字段生效，main-view.vue:648-649 注释与数据核对一致） | PASS |
| 3 02-design.md 补记 tag.js | 人工（文档核对） | 四处补记齐全：:152「共享文件（3…tag.js 为 S1 实施期裁决修复后的文档补记行」；:158 tag.js 完整行（valueToTags 对象条目原样保留 + 原因列含「补记说明（I2-1 裁决）…仅补记不改变技术内容」）；:185 cell-painters 行 TagColumn compile 断言（27→28 条，S1 补记归属）；:191 汇总段列 tag.js 三文件 | PASS |

## 回归抽查表

| 项 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 自检 9 组全绿（首载 + 页内重跑） | 浏览器 | 命令结果表：143/143 ×（首载 2 次 + 重跑 1 次），9 模块组 + data 组全出现，0 ✗ | PASS |
| 单击编辑 | 浏览器 | editable 页：库存列（col 5）单击一次 → 编辑浮层开（内部 INPUT type=number 聚焦、value 0、left 513 = 格左 506+7、高 34 = controlHeight+2，A5.4 公式精确）；Enter（keyCode 13）→ 浮层关 + 「最近提交」库存 `typeof number`；只读金额列（col 6，value 函数列）单击不开编辑 | PASS |
| 树 toggle/展开 | 浏览器 | 箭头中心点击（cellX=16）：keys 2001→2000、contentHeight 360144→359892（Δ−252 = 7×36）、发 `update:tree-expanded-keys {count:2000}`、不发 cell-click；再点恢复 2001/360144；槽外（cellX=120）：不 toggle，选中链照发（update:selected-record + cell-click column name）；toggle 缓存复用见复验表 1d | PASS |
| 列宽拖拽 | 浏览器 | 名称列右缘拖拽 +100：colWidths 160→260，`column-resize {"column":"name","width":260}`；二次拖 +20 → 280；clickGuard：pointerup+click **同任务序**（真实浏览器顺序，interactions.js:477-501 guard 依赖 click 先于 setTimeout 0 释放）→ 拖后 click 被吞，仅发 column-resize，无 header-click/order-by。备注：初次分任务（>100ms 间隔）派发 click 未被吞——guard 设计即同任务序，跨任务释放属预期，非缺陷 | PASS |
| 排序 | 浏览器 | 名称表头三连击：`update:order-by` 三态 `name:asc → name:desc → ''`，各次伴随 `header-click {column:name}` | PASS |
| 暗色模式 | 浏览器 | 复验表 1c：快照刷新（bgNormal/colors 随 readSnapshot 重读）+ 画布像素 246→(19,21,23)→还原 + 行高/contentHeight 不受干扰 | PASS |
| npm run build 复跑 | 命令 | exit 0（命令结果表） | PASS |
| stylelint | 命令 | exit 0 无错误（命令结果表） | PASS |
| 滚动窗口正确性（连带复核） | 浏览器 | 各滚动腿 viewRows 读数正确（底部 start 9991/end 10003 n=12；中部 354200 → start 9836；352800 → start 9797/9798 窗口行含长行）——scrollFrame 真实滚动驱动路径（rAF 落地）正常 | PASS |

## 沿用项清单（05-verify-1.md 已 PASS 且与本轮修复无关，未重跑）

- 验收 1/2（选型决策/路线决策文档核对）——纯文档，本轮修复未触及。
- #3 API 事件全量、#5 列定义/格式化渲染、#6 调宽收缩钳制与定宽语义、#11 defaultExpandLevel 矩阵（0/1/2/−1）、#12 hover 感知/边距两态/switch 高、#13 默认列宽矩阵（TYPE_DEFAULT_WIDTHS 逐列）、#14 items 场景 14 项像素与事件（tag/link/progress/button 取色、dots、disabled、DOM 参照段）——修复仅触及 theme.js 门控、壳行高缓存、demo fixed 夹具与 02-design.md 文档，以上子项行为面未变；其中 theme 快照 21 字段 + colors 17 色由本轮自检 143/143 内 theme 组（15 条）复跑覆盖。
- #7/#15 中与滚动无关的子项（编辑器矩阵、textarea 开值/提交、锚定补偿 +34、行高矩阵 70/88/36/196）。
- 实施约束 1–11 逐条核对（05-verify-1 表）——本轮修复未改变约束相关代码路径（约束 10 的 onChange 链路本轮以更强证据复验：门控后仅真实变更触达 relayout）。
- 文件结构 12 文件（本轮修复无文件增删；git status 与上轮一致 + tag.js 计入已覆盖）。

## 范围核对

- 基线排除项（00-task.md 基线已含，不计改动）：`.gitignore`、`demo/src/catalog.js`、`src/components/index.js`（M，前序任务脏文件）；`src/components/table-ex/`、`demo/src/data/table-ex*/`、`.pipeline/`（untracked，基线即有）。
- 验证产物：`dist/`（npm run build，被 .gitignore 忽略，git status 不可见）；`evidence/build-r2.log`（.pipeline 内）；`.playwright-mcp/`（仓库根，已按规约写入 `.gitignore` 含 `*` / `!.gitignore`）。
- 无法区分：无（基线脏列表与本任务改动文件不相交）。
- 设计外改动：无。`link.js`/`link.scss` 在改动清单（共享文件表）；`tag.js`（+5/−1）上轮「已记录-未覆盖」，本轮设计共享文件表已补记（:158）→ 转为**已覆盖**；demo 两 main-view 与 self-checks theme.js 均在改动清单（demo 表 + 修复记录白名单内）。
- 并行组白名单：与上轮相同结论（G1-a/G1-b/G2/G3 均未越出），本轮无新增源码改动面。

## 测试质量

- 修复轮新增自检 1 条「snapshotsEqual：快照相等判定（mutation 变更抑制门控，verify-1 失败项 1 回归）」——行为断言（同环境相等/同引用/空值不等/fontSize 维度/colors 单色 color+translucent 两维度/浅拷贝/键集合缺失防护），非「不抛错」式；与失败项 1 的门控机制直接对应。
- 上轮质量问题 1（单调性只验正向）已由本轮反向往返补齐（复验表 1a）；问题 2（fixed 夹具）已修复并复验（复验表 2a/2b）。
- 面板断言总体 143 条均为行为断言，重跑稳定（首载 ×2 + 重跑均全绿）。

## 需人工检查（沿用上轮，非本轮新增）

1. 验收 1/2 结论性判断终审（选型与路线决策）。
2. #15「10 万行含 20% 长文本滚动流畅（帧感）」——后台页 rAF 节流无法测帧率，建议真实前台浏览器在 :3000 树场景/多行场景手感复核。
3. 编辑器视觉细节（focus 光环、描边观感、暗色下编辑浮层观感）。
4. 文档三处同步（skills/docs/docs-site）——范围边界 #15，待用户确认启动（非缺陷）。

## 环境阻塞

无（本轮无因环境导致的 UNVERIFIED）。环境限制与适配（不影响结论，手段等价、前轮同款）：
1. 后台页（visibilityState=hidden）：原生输入/scroll 事件停发 → 合成事件驱动真实处理器链；clickGuard 类时序行为按真实派发顺序（pointerup 与 click 同任务）模拟。
2. rAF 延迟 ~0.5–1.5s → 滚动/重绘断言用 Node 侧 ≥1.8s 等待。
3. playwright 原生 click 超时（actionability 检查在后台页挂起）→ 全部改合成 click。
4. MuInput Enter 依赖 keyCode 13（input.js 映射）→ 合成 KeyboardEvent 显式携带。

## UNVERIFIED 项

无（本轮派发范围内全部实测）。上轮 4 项抽验取舍子项（#7 price clearable null e2e、#8 --row-height 48 数值跟随、#12 borderless clear/下拉、#14 progress 全 17 色逐一）按派发「上轮已 PASS 且与修复无关不重跑」沿用 05-verify-1.md 记录，其所属验收项（#7/#8/#12/#14）均有等价核心证据（本轮自检 143/143 含 editor/theme/cell-painters 组对应断言；#8 的 refreshTheme 重估链路本轮已实测缓存保留）。

## 失败项（FAIL 时）

无。
