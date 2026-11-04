# 实施记录（R1 修复轮 · 整体 1/2，primary 实施）

按 02-design.md「R1 修复轮」R1-1~R1-5 执行：人工-1 [1-1] 列级 link 语义迁移 + 05-verify-1.md 三项 FAIL 修复。首轮改动（04-impl.md）全部保留，仅在其上修改。

## 改动文件

| 路径 | 修复项 |
|---|---|
| src/components/table/column-types/list.js | R1-1：link 判定改列级单点——删除 `isLinkEntryOf`（`entry.link ?? listOption.link ?? false`），compile 一次求值 `isLink = column.link === true` 传入 canvasItemOf/domItemOf；listOption 摘除 link 键；dots/普通条目判定同源；文件头注释同步（条目级 link 键不参与渲染，随任意属性原样传出） |
| src/components/table/column-types/link.js | R1-1：兼容壳委托对象顶层 `link: true`（原 `listOption.link: true`），`{...column}` 展开后显式覆盖 |
| src/components/table/ex/cell-painters.js | R1-3：linkTextColorOf/linkHoverColorOf 无 color/danger 条目恢复 HEAD `colors.primary` 谱系回退（`linkPaletteOf(...) ?? theme?.colors?.primary`，hover ?? color ?? primaryColor），`item.link === false` 分支保持 textColor——老式自定义 kind:'link' 条目（无 link 字段）悬停色回归 HEAD。R1-4（复测发现的真实缺陷）：reportHitRect 与 drawLinkItems 条目回报附 `link: item.link !== false` 门控布尔（绘制层 dots 随列取首条目值），供光标/悬停消费 |
| src/components/table/ex/interactions.js | R1-4：findHitItem 透传 `link: entry.link !== false`（缺字段 true，老式条目行为不变），JSDoc 同步 |
| src/components/table/ex/table-ex.vue | R1-4：applyItemCursor 追加 `item.link !== false` 门控——list 非 link 列条目不再显示 pointer（对齐设计「无 pointer 样式，与 DOM 端 span 一致」承诺） |
| demo/src/data/table/main-view.vue | R1-1：listColumns/listRecords 迁移为「list 全 text 列」（遗留 `{ label, link: true }` 条目键夹具 → 负向断言载体）+ 新增「list 全 link 列」表（column.link，缺省 primary/color 变体/disabled/超限 dots/附加键/caption 兼容）+ 第三 payload 日志 span；listCode/note 文案同步列级口径 |
| demo/src/data/table-ex/main-view.vue | R1-1：itemColumns 增拆「list 全 text 列」（遗留 link 键负向夹具）与「list 全 link 列」（column.link，teal 变体/disabled/caption/dots）；itemRecords 增 listLink 字段（第 3 行标量落占位）；默认场景 createRecords list 条目改遗留 link 键负向夹具（渲染为纯文本）；注释同步 |
| demo/src/data/table-ex/self-checks/cell-painters.js | R1-2：stub `PRIMARY_COLOR`/`PRIMARY_HOVER` 常量——THEME_COLORS.primary 与 THEME.primaryColor 同源同值（对齐 theme.js readColors 语义色读 `--mu-{name}-color`），hover 保持可区分。R1-1：ListColumn compile 用例改列级口径（全 text 列遗留 link 键条目恒 span/无色类负向断言、全 link 列恒 a + color 覆盖、canvas link 字段列级来源）；「link 列竖排」用例增全 link 列断言（缺省 primary 同源、color 查表）与遗留 link 键不参与断言；兼容壳 link:true 断言文案改列级来源；文件头覆盖说明同步 |

不改动（与设计一致）：row-geometry.js / spans.js / editor.js / style.scss / text.js / index.js（R1 无涉；row-geometry/spans 自检手写 `_render` 不依赖 list.js 语义，核对无需迁移）；`src/styles/link.scss`（用户基线改动，未触及）。

## 偏离

1. **R1-4 定位结论：命中链无代码缺陷，verify 失败签名 = 验证侧坐标口径（非设计预期中的实现缺陷，设计该步骤已声明"以实际定位为准"）**。定位过程与证据：
   - 临时插桩（table-ex.vue finishCellClick/onClick/updateHoverItem、painter.js setItemHitGroup/trimItemHits，验后已全部移除）实测：复现序列下 itemHits 全程有值（row0/col2 组 3 条 rect）、hover 链 resolveItemClick 正常命中（hoverItem {kind:link,index:0}）。
   - 失败签名（cell-click column=list、无 cell-item-click）可由两类坐标伪影精确复刻：① 点击落在多行条目单元格的条目带外区（70px 行内条目 rect 仅占 y[45,99)，上下 padding 带点击不命中条目——与 DOM 版点 padding 不命中语义一致，属正确行为）；② 点击落在「列中心 x」而条目 rect 左对齐且宽 = 文本实宽（如 '纯文本项' rect 宽 ~56px < 列宽 170px），列中心落空。另：页面滚动使 canvas 移出视口后按旧坐标点击亦全数落空（实测点「重跑自检」后页面滚动 5276px，canvas 距视口 -5156px）。
   - 修正坐标（条目 rect 内：cellRect.left+20、cell.y+18）后四种操作序列（直接点击 / 先滚动 / 先 hover 他格 / 场景切换后点击）× 三列（links / list 全 text / list 全 link）9/9 稳定触发 cell-item-click（payload 键 item、含 recordIndex）。
   - 修复动作：命中链无缺陷不改；但复测发现一处真实缺陷（见改动文件 cell-painters/interactions/table-ex 三行）：list 非 link 列条目 cursor=pointer（applyItemCursor 只判 kind 未判 link 态），违反设计「无 pointer 样式」承诺，已按 `item.link !== false` 同谓词修复。
2. **非偏离澄清（demo 基础设施）**：demo 静态服务对 `catalog.js` 无缓存失效头，浏览器模块缓存可跨 reload 存续旧构建（本轮实测需 `fetch(url, {cache:'reload'})` 后 reload 或路由拦截才能加载新模块）——verify-1 会话级"点击全程失效"不排除此因素叠加。属 demo 服务特性，不在本任务改动范围，建议验证轮加载页面后以内容标记（如列 caption）确认所跑为最新构建。

## 自检

| 命令 / 手段 | 结果 |
|---|---|
| `npm run build`（项目根） | exit 0；4 次 vite build 全部 `✓ built`（base dev 283 / base prod / ex dev 301 / ex prod 模块数不变） |
| `npx eslint <8 个本轮改动文件>`（--fix 后复跑） | 0 error / 3 warning，warning 全部位于既有行（data/table:16 列类型 note、table-ex:217 treeProps 展示，本轮未改这两行） |
| `npx stylelint src/components/table/column-types/style.scss` | clean（本轮未改该文件） |
| playwright DOM 断言 /data/table/ | 全 text 列：`mu-table__list-cell` + 条目全 SPAN 无色类（含 `{label,link:true}` 遗留键条目 → span 负向断言通过）、标量落占位 `-`、dots SPAN；全 link 列（column.link）：条目全 A + `text-primary`/`text-teal`/`text-danger`、disabled `disabled=""`、dots A+text-primary；A7 兼容列 danger→text-danger、color:teal→text-teal；A6：全 text 列点击 payload `item={"label":"遗留 link 键项","link":true}`（条目原引用含遗留键）、全 link 列点击 payload `item={"label":"附加键链接","id":42}`、column 为原始列引用 |
| playwright DOM 断言 /data/table-ex/ 参照表 | 默认场景 list 全 text 列：条目 3 个全 SPAN 无色类（「遗留 link 键条目」负向断言通过）；「text 数组值（占位）」列在列 |
| playwright canvas 四变体复测（终版构建，去插桩后） | 直接点击 / 先滚动 / 先 hover 他格 / 场景切换后点击 × links、list 全 text、list 全 link = 9/9 触发 cell-item-click（payload 键 item、含 recordIndex）；cursor：links=pointer、list 全 link=pointer、list 全 text=default（门控修复生效）、text.link=default |
| self-checks 面板（重跑自检） | **201/201 通过，0 FAIL**（含 R1-1b linkHoverColorOf HEAD 口径断言、R1-2 同源化后「全 link 列缺省 primary」断言、列级迁移后的 ListColumn/兼容壳用例） |
| console（demo `__env__='development'`） | caption 兼容警告出现 1 次（utils/warn once 去重）；既有 img 容错用例 ERROR 为基线行为 |
| 插桩移除核对 | `grep TODO-DEBUG/__dbg src/components/table/ex/*` 0 命中；页面 `typeof window.__dbgClick === 'undefined'` |

## 遗留

1. canvas 目检项（A1 链色、A5 逐条省略、A9 不拆行形态）仍留验证轮目检（与 verify-1 相同口径，无 DOM 断言手段）；本轮以像素行带佐证 list 全 text/全 link 列各 3 条目竖排且全 link 列呈链色（teal 变体条目实测 [40,169,132]）。
2. 验证轮点击坐标注意：条目命中矩形 = 左对齐文本实宽（非整列宽），点击取 `getCellRect(col).left + 20`、`.top + 18` 类坐标；点列中心或条目带外区不触发 cell-item-click 属预期（DOM padding 同语义）。页面滚动后需按最新 `getBoundingClientRect` 换算并确保 canvas 在视口内。
3. demo 模块缓存问题（偏离 2）：建议验证轮以内容标记确认页面跑最新构建，或考虑后续给 demo 服务加 no-cache 头（独立小任务，本任务不含）。
