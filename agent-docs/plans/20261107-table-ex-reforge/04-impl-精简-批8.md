# 实施记录（注释精简 批8）

## 改动文件
| 文件 | wc 前→后 | 改动 |
|---|---|---|
| src/components/table/ex/shared/text-wrap.js | 313→312 | 更新 2 行 + 删除 1 行，共 3 处注释 |
| shared/cell-identity.js、constants.js、theme.js、tree.js | 16/63/335/254 不变 | 无可精简项，零改动 |
| editing/editor-geometry.js、editor-resolve.js、editor.js | 114/169/285 不变 | 无可精简项，零改动 |
合计 1549→1548（净 -1）

### 逐条
1. text-wrap.js:25 过时引用更新（派发点名）：`见 painter.headerFontOf` → `见 table-paint/paint-header.js 的 headerFontOf`。证据：headerFontOf 仅存于 table-paint/paint-header.js:39（模块私有），painter.js 不再引用（grep 全 ex/ 唯一定义）。
2. text-wrap.js:73 删：`// 空白与 CJK 集合重叠（如 U+3000 同落 CJK 区间），必须保持空白优先的同序判定` —— 与 isCjkCode 头注释（原 L48-49）重复表述。
3. text-wrap.js:87 空块注释改写：原拟删（与上文"行首空白并入词首"重复），试删后 eslint no-empty 报错（Empty block statement）——该注释是空块 lint 豁免必需，定性非冗余，改为 `// 仅含空白：作为词首前缀保留（空块需注释豁免 no-empty）`。

## 过时引用核查（B4/B1/B2 相关，白名单内 grep）
- 无 `interactions.js` / `painter.cellRectAt` / controller `ctx` 旧引用。
- 引用有效（保留）：`resolveColumnType(undefined) 同回退 TextColumn`（column-types/index.js:37 回退 ColumnTypes.text）、`INPUT_TYPES.memo`（form/input-types.js:3）、`row-geometry / cell-painters / painter`（geometry/、cell-paint/、table-paint/ 均存在）、`paint（paint-overlay）与 interaction（edit-button）`（两文件均存在）、`editor.js 不可 import theme.js`（editor.js:17-18 现状一致）。

## 保留的契约注释（逐字未动）
- text-wrap.js：wrapCache LRU（触碰重插/单步淘汰防死循环/值纯函数）；测量口径（measure 注入、上游缓存、行高与绘制单一事实源）；ellipsize/shrinkToFit 前缀单调二分与 '' 兜底；estimateLineCount 短路契约；isWhitespaceCode 复杂度豁免理由；isCjkCode 空白优先顺序。
- theme.js：createMeasureCache 超限整体清空口径；createTextMeasurer 单例共用；snapshotsEqual 门控与误 rebuild 触发源；hover 走 -4 原始串原因；readColors 固定全量防漏色。
- tree.js：buildFlatRows 平行数组语义 + spans 父链切断单一事实源；expandableAt 三消费点共用；resolveInitialExpandedKeys watch 契约 + BFS 计层鸡生蛋；懒节点 === false 口径。
- editor-geometry.js：editorGridlineFlagsOf 锚点显式化与误缩 1px 缘由；editButtonRectOf 行线间空白中点公式；computeEditorStyle 模块隔离 + spans.spanRectOf 透传。
- editor-resolve.js：usesDerivedOptions 提交值类型区分口径；normalizeCommitValue 规整矩阵；resolveSelectOptions 优先级链。
- editor.js：提交矩阵；blur 兜底三判据；组件壳对接契约；模块隔离清单；flush:'sync' 时序；emittedValue 去重。
- constants.js：各常量镜像来源与消费方；ROW_TOP_INSET 统一垂直锚公式；tag/button pill 非同构说明。
- cell-identity.js：isSamePoint / recordNumberOf 单一事实源收敛记录。

## 死代码存疑清单
无（8 文件均无注释掉的死代码块）。

## 自检
- eslint：`/d/npm/global/eslint src/components/table/ex/shared/text-wrap.js` 通过（零错误）；其余 7 文件零改动未跑。
- git diff 确认：仅注释行变更，零代码 token / 字符串 / 结构变更。
- 未跑 build（按派发留待终验）；未 commit。

## 偏离
无。批内注释密度本身已高（前序批次已覆盖部分文件），本批以核查引用现状 + 清除重复为主。
