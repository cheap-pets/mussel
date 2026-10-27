# 实施记录 — S1 集成收尾 + 全量验证

步骤：S1（02-design.md 实施步骤表 S1 行）。模式：集成（读全部实施记录 G1-a/G1-b/G2/G3；遗留收尾白名单 = `src/components/canvas-table/painter.js`、`src/components/canvas-table/canvas-table.scss`）。

## 改动文件

| 文件 | 对应步骤 | 说明 |
|------|---------|------|
| `src/components/canvas-table/painter.js` | S1 遗留① | 树箭头 hover 主色（G3 遗留 1）：`paintOverlay` hover 命中树形列父行格时以主色重画箭头三角盖住分区 1 的常态 textColor 箭头（新增 `paintTreeArrowAccent`；三角几何与展开判定镜像 cell-painters `drawTreeAffordance`，`TREE_INDENT` 复用 row-geometry 导出；取色 = 快照 `colors.primary.color`，缺 colors 回退 `primaryColor`；受 hoverMode none 抑制，与 A5.3 描边一致）。模块头注释分区 5 描述同步 |
| `src/components/canvas-table/canvas-table.scss` | S1 遗留②（零改动） | `__overlay` overflow 已为 `clip`（本轮开始时文件已含该规则及注释，mtime 晚于 G3 记录——判为 G3 收尾已落地或中断运行已应用，非本轮改动）。本轮完成其回归验证（见自检） |

stylelint：`npx stylelint "src/components/canvas-table/*.scss" src/styles/link.scss --fix` 通过，无残留错误（--fix 后复检无新增，两文件均无调整输出）。

build：`npm run build` exit 0（dev `dist/mussel.js 600.70 kB / css 120.64 kB` + prod `dist/mussel.min.js 282.14 kB / min.css 97.55 kB`，全流程单次，写共享 dist/）。

## 偏离

1. **树箭头 hover 主色为格级粒度，非设计的 hit.cellX 槽位级**（遗留①）：壳的 hover 载荷为 `{ row, col }`（G3 hitTest 产出的 `hit.cellX` 未入 paintState），且 `updateHover` 仅按 (row,col) 变化触发脏区重绘——同格内槽位进出既拿不到指针 x 也不会触发重绘。槽位级命中需改 `canvas-table.vue`（hover 载荷加 cellX + 相等性比较含 cellX + 槽界跨越 invalidate），壳不在 S1 白名单 → 按白名单内可实现的自洽语义落地：hover 停留在树形列父行格上即箭头主色，移出该格随行带重绘还原（颜色变化与重绘触发同键，无滞后）。后续如需槽位精度：壳侧约 3 行改动。
2. **`__overlay` overflow: clip**：文件在派发时已含 `clip` 规则（含 G3 实证注释），本轮按"确认兼容后落地"口径完成验证未再改动；G3 的 focusEditor JS 复位（scrollLeft/Top=0）保留，与 clip 双保险。
3. **rAF 依赖路径验证采用 hybrid rAF shim（环境受限方案）**：本 playwright 会话浏览器窗口被遮挡（`document.visibilityState === 'hidden'`，bringToFront/resize/CDP setWindowBounds 均不可用/被拒），原生 rAF 停发且 scroll 事件停发（渲染管线挂起，G1-b/G2/G3 同款陷阱）。按派发"消费 G3 通道、保持页面前台"不可达成，改用 addInitScript 注入会话级 shim：`requestAnimationFrame` = 原生优先 + 120ms setTimeout 兜底（真实前台环境行为不变），scroll 事件以合成 Event 驱动真实 onScroll 处理器链。仅影响本会话自动化，不触及源码。
4. **测试计划 #11"展开/收起视口上方节点 → 视口内容不动"子项**：toggle 仅能经画布点击触发，被 toggle 行必须可见 → 结构上无法点击"视口上方"的行（hitTest 坐标越界即 miss）；其锚定补偿与 `remeasureVisibleRows` 滚动帧精算共享同一 shift 机制（`computeAnchorShift` + scrollTop 补偿），后者已由渐进精算端到端验证（见 #15）。同粒度机制 `applyTreeToggle` 的 Δ 补偿 + spacer/窗口同步已由槽位 toggle 精确值验证（Δ −252）。
5. **#6 调宽拖拽与 #11/#14 点击交互经合成 PointerEvent/MouseEvent 驱动真实处理器链**（同 G3 口径，后台页原生输入事件被丢弃）。拖拽走 sticky pointerdown + window pointermove/pointerup，效果：colWidths 160→199、`column-resize` 发出、拖后 click 被 clickGuard 吞、`--mu-*` 参考线正常。
6. **#7 "数字原值 text 列 textarea 提交 typeof number 保持" 无 e2e 夹具**：editable 页无"number 原值 + 无 type 文本列"组合列；规整层 ⑤ 数字回转由 self-checks/editor 组断言覆盖。**"borderless 态 clear/下拉可用"未单列 e2e**：scss 白名单不触 clear/下拉（G2 已证）+ 本轮 borderless 态编辑/聚焦/提交正常。**"固定列编辑浮层横向滚动后不错位"未在 editable 页重跑**：该页无 fixedLeftColumns 夹具控件；由 self-checks computeEditorStyle 固定列用例（i < fixedCount 不减 scrollLeft）+ clip 结构性防漂移（overlay 不可滚动）+ G3 e2e（left = 格左+7、overlay.scrollLeft=0）覆盖。

## 自检

### 测试计划全表（#3–#15 + 自检回归 + 构建/风格）

| # | 结果 | 关键证据 |
|---|------|---------|
| 3 API 对照 | ✅ | 事件全量：`header-click`/`update:order-by` 三态 `'name:asc'→'name:desc'→''`/`cell-click`+`update:selected-record`+`update:selected-record-key` 选中链/`update:header-checked`/`update:cell-value`（check 翻转 value:false）/`column-resize {column:name,width:199}`/`update:tree-expanded-keys {count:2000}`/`cell-item-click`（link 对象 `{caption,color}`、dots `'...'`、button `{caption}`、附加 recordIndex）；方法：`scrollToRecord(40)` scrollTop=7128=198×36、`getLayoutInfo` 含 rowGeometryMode、`getThemeSnapshot` 21 固定字段 + colors 17 色（gray 不入）、`getCellRect` 变高行高 = heightAt、`expandAll/collapseAll/getTreeExpandedKeys` |
| 4 渲染架构/虚拟滚动 | ✅ | uniform 100000 行：refreshTheme 整幅后 lastPaint rowCount 13 ≤ ceil(764/36)+2+1=15（scrollTop 含非行对齐值）；scroll 同 tick 3 次合帧一次 flush → rowStart 240 = scrollTop/36 精确；spacer = contentHeight+head−视口；variable：rowCount == viewRows.count；数据契约通道：就地改 + recordsVersion++（check 表头）、引用替换（场景切换）、树 toggle、调宽、主题/字号失效全走通 |
| 5 列定义 | ✅ | colWidths clamp/定宽（备注 180∈[120,260]、'56px' 解析 56）；enum/date/currency/number 格式化文本渲染正常；数组值列多行；覆盖文本列走同一 render 管线（夹具可见） |
| 6 调宽与排序 | ✅ | 拖拽 160→199 + column-resize；move 无残影（colFrom 竖带重绘）；拖后 click 被吞；固定列缘拖拽无效（自检覆盖）；拖拽下限（自检 resolveTypeMinWidth 组合断言 text 80/bool 40/minWidth 显式与 '96px' 优先）；变高模式拖宽 up 后行高重估（remeasureRow 通道，#15 联动）；排序三态循环 |
| 7 编辑 | ✅ | 浮层 rect = 内容区矩形（border：left = 格左+7、h 34 = controlHeight+2；textarea h 54 = clamp(70−16,32,196) 精确）；Enter/Esc/滚动提交（滚动提交 e2e：库存 77 typeof number + 关闭）、blur 兜底（pointerdown 提交多次实证）；validate 失败不关闭 + `invalid="true"` 落 mu-input 根 + title=「名称不能为空」；editable=false/只读列（金额）click 不开编辑；规整层 e2e：库存文本输入 typeof number 42、数值枚举 open 字符串化'低'、单价清空 null（typeof object）；textarea：开值 join（数组/链接对象数组取 caption）、Enter 换行不提交、Ctrl+Enter 提交、数组提交 typeof array Array(2)、字符串原值提交保持 string |
| 8 样式/暗色 | ✅ | theme 自检组（21 字段 + colors 17 色形态）全绿；mu-dark 挂根 → MutationObserver 重读（bgNormal 255→7,8,8、colors 17 色刷新、画布像素变化）；check disabled 底衬合成色：盒中心 [227,227,227] = 斑马底 246 ∘ bgStrong α0.08（理论 226.9 精确吻合）、未禁用行盒无底衬；--row-height 48 + refreshTheme → 行高 48/contentHeight 4800036；根字号 18 → fontSize 18 且 variable 模式行高重估跟随（契约⑤：444→480→444 可逆）；tag/progress/button 像素见 #14 |
| 9 文件结构 | ✅ | `src/components/canvas-table/` = 12 文件（9 js + vue + scss + index），无设计外增删；`npm run build` exit 0 |
| 10 范围边界 | ✅（人工） | demo 无 A8 范围外能力实现（行级 editable/插槽通道/行选择矩阵等未出现）；文档三处未动（边界 #15，待用户确认） |
| 11 树 | ✅ | defaultExpandLevel 边界（首开解析）：−1→0 keys/2000 行全收起、0→2000/10001、1→2001/10003、2→2001/10003；槽内 toggle（cellX=14）→ keys 2000 + contentHeight Δ −252（=7 行）+ 不发 cell-click、槽外（cellX=192）→ 选中链不发 toggle；expandAll/collapseAll 生效（2001/0）；收起到底 scrollTop clamp（359728→71620 = maxAllowed）；叶行空槽 cursor default / 父行槽 pointer；treeProps 字段名切换重解析（受控优先 [] 语义正确）；树形列 + maxLines 长文本：根 40/80 行高精算 70（树缩进扣减后折行）渐进精算 + 单调；scrollToRecord 树 key 定位（198×36）；树行选中/hover 主色（①）/编辑（列编辑器同管线）正常；孤儿/环由自检覆盖 |
| 12 编辑 UI | ✅ | 单击可编辑格一次完成：浮层出现 + 内部 INPUT 聚焦（value = 开值'红富士苹果'）；只读格/表头 click 不开编辑；拖后 click 被吞；hover 可编辑 cursor='text' + 1px 主色内描边像素（左缘 [136,186,230] = 0.45 primary ∘ hover 带、顶缘 [119,165,207]）、只读格 cursor default 无描边；activeElement：input→内部 input、switch→容器（tabindex −1）；边距一致：border 态文本左缘 = 格左+7+1+0 = 格左+8 精确、borderless 态 = 格左+8+1（透明边框 1px）差 1px ≤ 1px；switch 浮层高 = 32 = controlHeight + --borderless 类；textarea 浮层高 = clamp 公式精确（54）；固定列不错位（见偏离 6） |
| 13 默认列宽 | ✅ | 全类型场景 colWidths = [50,50,160,100,110,100,110,160,60,140,140,100,140,80,80] 与 TYPE_DEFAULT_WIDTHS 逐列一致（check/rec_no 50 定宽、bool 60、无 type 160、自定义 80、img/image 80）；窄容器（958px demo 容器）逐列 = 默认宽 + 横向滚动；宽容器（拉至 1800px）弹性列拉伸 160→524 ≥ 默认宽、显式 width 列不变；minWidth 显式（备注 120 < width 180）/ 字符串 '56px' 定宽解析；拖拽 override 生效（199） |
| 14 新列型 | ⚠️ 部分（tag 色 FAIL，见偏离/BLOCKED） | progress：轨道 bgStrong 8px 圆角、填充精确（30% success [55,178,77] / 75% warning / 100% primary / 50% danger，含 `(record)=>` 记录级色）、showText、不回报 itemHits；button：多按钮渲染、彩色（红/indigo）、disabled 点击不发 item 事件、按钮间/超出点击不命中、点击 payload `{button:{caption},recordIndex}` + cell-click 照发；link：字符串数组竖排、对象数组四态取色像素（主色 [38,126,206]/danger [228,68,69]/disabled muted [171,175,181]/teal [23,162,121]）、单值数字 String 化、dots 第 10 条点击 payload `link:'...'`、disabled 条目点击只发选中链、对象条目 payload = 原对象；DOM 参照段（G3）：对象数组 caption 渲染 + mu-link--{color} class + getComputedStyle 色值 ✓；**tag 彩色像素 FAIL**：`tags` 字段对象条目 `{caption,color}` 经 TagColumn 默认 `valueToTags` 包装为 `{caption:{…}}` → 画布全格无绿/蓝色像素（仅灰文本），色 class 从不产生 |
| 15 多行变高 | ✅ | 行高精确：deep 196（maxLines 10 钳制）/ shallow 70（long3 3 行）/ 函数 lineClamp 按 record（deep 3 行、shallow 1 行）/ 数组 maxItems 3 → 70 / 数字数组 12 → maxItems 10 dots / 混排取多列最大；溢出末行收缩与钳制由 text-wrap/cell-painters 自检覆盖（'...' 口径）；树场景 1 万节点长文本：contentHeight 360144→360178→360212（两长行各 +34 = 70−36）渐进精算、全程单调不回缩；滚动锚定与窗口同步（toggle Δ−252 + 精算 Δ+34 两路径）；编辑提交改值行高重估（remeasureRow：tagList 3→2 项后行高由 3 行列决定保持正确——记录 0 链接数组 3 条为剩余最高列，语义正确）；10 万行 uniform 滚动 lastPaint 窗口断言 ✓（"20% 长文本 10 万行"无专用夹具，以树 1 万含长文本 + multiline 全项覆盖）；自检 text-wrap/row-geometry/tree/layout/painter/cell-painters 新增组全绿 |
| 自检回归 | ✅ | `/data/canvas-table/` 面板 **141/141 全绿**，首次加载与页内「重跑自检」均全绿；9 模块组 + data 组全部出现（text-wrap 10 / row-geometry 12 / tree 8 / theme 14 / layout 21 / cell-painters 27 / painter 14 / interactions 18 / editor 13 / data 4）；dblclick 断言已删换 click 语义组、ESM 无缺失导出 |
| 构建/风格 | ✅ | `npm run build` exit 0（单次）；stylelint --fix 通过无残留 |

### 遗留收尾三项（派发步骤 1）

1. **树箭头 hover 主色** ✅：像素断言——hover 前 [58,63,67]（textColor）→ hover 树形列父行格 [28,126,214]（= colors.primary.color 精确）→ 移出还原 [65,69,74]（textColor ∘ hover 带）；展开（▾）与收起（▸）两方向分支均验证。粒度偏离见偏离 1。
2. **__overlay clip** ✅：computed `overflow: clip`；编辑浮层超视口右缘（editor right 1800 > 视口 1278）场景 focus 后 `overlay.scrollLeft/Top` 恒 0（原缺陷值 83 不可能再现——clip 盒程序化滚动无效）；浮层渲染/聚焦/提交无视觉回归。
3. **rAF 依赖路径端到端** ✅（shim 方案，偏离 3）：scroll 合帧（同 tick 3 次 scroll → 1 次 flush、rowStart 精确、rowCount 窗口内）、img onload → invalidateCell 联动（全类型场景图片列进视口 → `drawImage` 经 painter rAF 队列在内容坐标落画）、hover 时序（同步 immediate 脏带重绘，像素即时反映）。

### 控制台

canvas-table 页 1 error = 自检夹具故意 badSrc 无效图（既有测试行为）；editable 页 0 error。

## BLOCKED 项（阻塞测试 #14 tag 断言）

**类型：拆分过粗（必需改动落在共享文件，且不在任何实施步骤的文件集内）**

- 现象：测试计划 #14「tag 多标签 17 色中抽样 3 色像素断言」FAIL——条目/新列型场景 tag 列对象条目 `{caption:'新品', color:'green'}` 渲染为灰色默认文本，画布全格扫描无任何色板色像素。
- 原因：`src/components/table/column-types/tag.js`（共享文件，DOM 版 table 同消费）的默认 `valueToTags` 将数组元素一律包装 `el → ({ caption: el })`——对象条目被包成 `{ caption: {…} }`，`color` 字段丢失、`mu-tag--{color}` class 从不产生，item.text 退化为对象。这是评审 6 P1 对 link.js 所做修复（对象条目原样保留 + color 落 class）的孪生缺口：link.js 进了改动清单，tag.js 没进，而人工意见 4/测试计划 #14 要求 tag 颜色可定义（含记录级）。
- 证据：tag.js `valueToTags`（`value.map(el => ({ caption: el }))`）与 `const { caption, pill, flat, color } = tag` 解构（对象条目需直接作为 tag 才能取到 color）；画布像素扫描（tag 格色相簇为空集）；DOM 侧同样受影响（对象条目 `[object Object]` 坏显示，与 link.js 修复前同型）。
- 最小修复（约 2 行，与 link.js P1 同型）：`valueToTags` 改为 `value.map(el => (el != null && typeof el === 'object') ? el : ({ caption: el }))`（字符串/数字路径行为不变，DOM 版零回归面与 link.js 同承诺）；如需"记录级 tag.color"（tagOption.color 为 `(record)=>` 函数形态），还需 `ensureFn(tagOption.color)(record)` 求值——建议一并确认口径。修复后补跑 #14 tag 像素断言即可。
- 该文件不在 S1 白名单（遗留收尾仅 painter.js + canvas-table.scss），按角色规则停止并上报，不自行修改。

## 遗留

1. **tag.js 对象条目支持**（BLOCKED 项）——待调度者扩白名单或派修复步骤，修复后重跑 #14 tag 像素断言。
2. 树箭头 hover 主色如需 hit.cellX 槽位级精度：壳侧改动点 = updateHover 载荷加 cellX、相等性比较含 cellX、槽界跨越时 invalidate（偏离 1）。
3. 文档三处同步（skills/docs/docs-site）：范围边界 #15，需用户确认后另行执行（本轮 API 面已扩大，同步范围随之扩大）。
4. 环境备忘：本会话浏览器窗口遮挡导致原生 rAF/scroll 事件停发，自动化验证依赖会话级 hybrid rAF shim + 合成 scroll 事件（仅影响自动化会话）；真实前台行为建议用户在 ：3000 交互复核一遍滚动/图片列/暗色切换的帧感。
5. demo watch 常驻 :3000；`npm run build` 已单次执行；未做 git 提交（未被要求）。

---

# 续做（tag.js 修复）

步骤：S1-续（decisions.md「[S1 集成] BLOCKED 处置」授权：白名单临时增补 tag.js，修复 #14 tag 彩色像素 FAIL）。模式：续做 + 修复。遗留 1（tag.js 对象条目支持）就此关闭。

## 改动文件

| 文件 | 对应步骤 | 说明 |
|------|---------|------|
| `src/components/table/column-types/tag.js` | S1-续 | 最小修复（同 link.js P1 型，≈2 行逻辑）：`valueToTags` 数组元素改为 `el => (el != null && typeof el === 'object' ? el : { caption: el })`——对象条目 `{ caption, color, pill, flat }` 原样保留，color/pill/flat 经既有解构落 `mu-tag--{color}` / `mu-tag--pill` / `mu-tag--flat` class（canvas 端 cell-painters 按该 class 查 colors 17 色板取色；DOM 端同 class 生效）；字符串/数字元素仍包 `{ caption: el }`，标量路径不变。附注释说明意图。该文件其余逻辑零改动 |
| `demo/src/data/canvas-table/self-checks/cell-painters.js` | S1-续（DOM 版 mu-table 回归断言） | 追加 TagColumn compile 产物断言（镜像 LinkColumn compile 断言写法，白名单授权项）：对象数组 caption 文本/条目级 color 落 class 且覆盖 tagOption.color/tagOption.color 缺省落全部条目/数字元素包裹行为不变、条目级 pill:false 覆盖与 pill/flat 落 class、字符串数组行为不变且无色类、max 超限 dots `'...'` 字面 + click 绑定 payload.tag=`'...'`、条目 payload tag=原对象、缺 caption 对象经 isValidTag 过滤；另在文件头注释覆盖清单补一行 TagColumn compile 断言说明（文档性，2 行） |

lint：eslint tag.js 0 问题。cell-painters.js 报 3 error + 1 warning 全部位于本轮未触碰的既有行（L304/501/690 模板串引号、L69 长行，为前序实例遗留，非本轮新增代码引入；项目无 lint script，前序轮次同状态）→ 按范围克制不动。stylelint 本轮无 scss 改动，不适用。

## #14 复验结果

页面 `http://localhost:3000/data/canvas-table/`，items 场景（demo watch 已自动重建，含新自检），整格像素扫描命中数（容差 ±40，0 = 无该色像素）：

| 项 | 修复前 | 修复后 |
|----|--------|--------|
| tag row0 新品 green `rgb(55,178,77)` | 0（FAIL） | **154** ✅ |
| tag row0 置顶 blue `rgb(28,126,214)` | 0（FAIL） | **161** ✅ |
| tag row1 V4 violet / LTS orange | — | 96 / 82 ✅ |
| link 四态取色（主色/danger/disabled muted/teal，回归复核） | ✅ | 152 / 157 / 612 / 199 ✅ |
| progress（success/warning 填充） | ✅ | 134 / 356 ✅ |
| button（红/indigo/disabled muted） | ✅ | 148 / 160 / 483 ✅ |

结论：#14 由「⚠️ 部分」转全项 PASS——tag 彩色像素 FAIL 根因消除（对象条目 color 经 class → colors 查表取色生效），同测试项 link 四态/progress/button 取色无回归。tag dots 行为未改动（由自检断言覆盖）。

## 自检复核结果

- 首载：**142/142 全绿**（141 + 新增 TagColumn compile 断言 1 条，cell-painters 组 27→28）；页内「重跑自检」：**142/142 全绿**；再 reload 后首载同样 142/142。
- 控制台仅 2 error = 自检夹具故意 badSrc 无效图（既有测试行为，首载 + 重跑各一次），无新增报错。

## build

**重跑 1 次**：tag.js 属库源码（dist UMD 消费），修复影响 dist → `npm run build` exit 0（dev `dist/mussel.js 600.74 kB / css 120.64 kB`、prod `dist/mussel.min.js 282.16 kB / min.css 97.55 kB`；较修复前 js +0.04 kB，css 不变）。

## 验证环境备注

沿用 S1 偏离 3：本会话浏览器窗口遮挡（`document.visibilityState === 'hidden'`），主画布绘制依赖会话级 hybrid rAF shim（原生优先 + 120ms setTimeout 兜底，addInitScript 注入，仅影响自动化会话不触源码）；items 场景 4 行全在视口内，无需合成 scroll。

## 遗留（续做后）

1. 原 BLOCKED 项（tag.js 对象条目）已修复并验证，遗留 1 关闭。
2. 其余遗留（树箭头槽位级精度、文档三处同步、真实前台帧感复核）不变，见上文遗留 2–4。
3. 未做 git 提交（未被要求）。
