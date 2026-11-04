# 设计：table-ex enum 列恢复并独占 mappings/options

## 方案概述

映射职责从 text 列迁移到 enum 列，text 列回归纯文本渲染：

1. **enum 恢复一级列类型**：重写 `EnumColumn`（去掉废弃警告），`compile(column, dom)` 双通道，内部经 `createDisplayMapper` 实现显示映射；注册进 `ColumnTypes`（现未注册，`type: 'enum'` 静默回退 TextColumn——column-types/index.js:30-32）。
2. **text 列去 mappings**：`TextColumn.compile` 删除 mapper（所有 text 列不再走 map 过程），新增 `column.color`（色名 | `(record, value) => 色名`，bool/number 同款），multiline/lineClamp/title 逻辑不动。
3. **canvas 适配**：`_mapText` 改挂 EnumColumn（估高取显示文本）；`isPlainTextColumn` 去掉映射源排除条件（text+options/mappings 回归短路直渲原值），改以 `column.color == null` 为短路前提——text 列染色须经 compile 产出 color，短路直渲产物只有 `{ text }`，否则 canvas 端 color 丢失。
4. **编辑器**：`COLUMN_TYPE_EDITORS` 注册 `enum: 'select'`；删除 text 列「带下拉来源缺省 select」分支与 `hasSelectSource`。select 仅来自 enum 类型或显式 `editor.type: 'select'`。

**mappings 与 options 兼容关系（enum 列，优先级固化在既有代码）**：

- 显示：`mappings` 优先；无 mappings 才由 `options` 转换为显示映射（mappings.js:50 `column.mappings ?? mappingsFromOptions(column.options)`）。
- 编辑下拉 options 三级来源：`editor.props.options`（原样）> `column.options`（原样）> `mappings` 派生（排除 `default`，value = key 字符串）（editor.js:232-242）。
- 共存示例：`mappings: { a: '甲' }` + `options: [{ value: 'a', label: '乙' }]` → 显示「甲」，下拉项为「乙」。

触及边界：`column-types/`（mu-table DOM 与 table-ex canvas 双端共用注册表，base/table.vue:168/180 与 ex/cell-painters.js:178/147 同源消费）、`ex/cell-painters.js`、`ex/editor.js`、demo 夹具与自检。`mappings.js`、`row-geometry.js`、`base/*` 不改。

## 遵循约定与复用

无探索报告，约定自行提取自源码与 `agent-docs/knowledge/INDEX.md`：

- `createDisplayMapper(column)`（mappings.js:48-56）：**原样复用不改**。空映射源返回恒等 `v => ({ text: v })`；有映射 `v == null → null`，命中/default/原值回退链见 mappings.js:55。
- 双通道协议 `compile(column, dom = false)`：dom=true 产 `is/class/style/events`，否则产 `color` 等数据属性（INDEX.md 条目 35；text.js:5 与 bool.js:6 为范本）。color 落地：DOM 通道 class `text-{c}`，canvas 通道平铺 `color` 色名（bool.js:21-23）。
- `column.color` 选项约定：色名 | `(record, value) => 色名`，`ensureFn` 包装（bool.js:10-13；INDEX.md 条目 34）。
- 编辑器类型→组件映射单一事实源 `COLUMN_TYPE_EDITORS`（editor.js:101-108）；显式 `editor.type` 恒优先（editor.js:141-142）。
- 派生 options 的开值/提交规整（`usesDerivedOptions` / `normalizeEditorOpenValue` / `normalizeCommitValue`，editor.js:158-228）按列配置工作，与列 type 无关（self-checks editor.js:415-419 已断言），enum 直接继承。
- `_mapText` 协议：mapper 产物对象取 `.text`（row-geometry.js:63-66），createDisplayMapper 天然满足。
- 命名/错误处理：列类型对象 `{ align, compile }` 形态（各 column-types 一致）；无新增错误通道，非法配置走既有回退链。
- 术语与知识库条目 33/36（mappings text 独有 / enum 废弃）冲突：本任务为用户指定的方向反转，知识更新由主会话收尾处理（见未解问题 2）。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/column-types/enum.js` | 重写：删 `warnDeprecated` 与废弃注释；`compile(column, dom)` 双通道 + `createDisplayMapper`；保留 `align: 'center'`（历代版本一致，ca0ea97/1c8f326） | A1/A2/A3 |
| `src/components/table/column-types/index.js` | import EnumColumn，注册 `enum: EnumColumn` | A1 |
| `src/components/table/column-types/text.js` | 删 `createDisplayMapper` import 与 mapper；新增 `column.color`（`getColor = ensureFn(column.color)`）；渲染取 `text = value`，其余 multiline/lineClamp/title/class/style 管线不动 | A4 |
| `src/components/table/ex/cell-painters.js` | `_mapText` 门控 `type === TextColumn` → `type === EnumColumn`（import 替换）；`isPlainTextColumn` 删 `column.mappings == null && column.options == null` 条件，改为 `column.color == null`（带 color 的 text 列须走 compile 产 color；`resolveCellContent` 短路产物仅 `{ text }`，:217-231）；相关注释同步（:22、:29-30、:165-171、:202-203、:225） | A2/A4/A6 |
| `src/components/table/ex/editor.js` | `COLUMN_TYPE_EDITORS` 加 `enum: 'select'`；`resolveEditorType` 删 ② text+hasSelectSource 分支；删 `hasSelectSource`（仅 :129 定义 :147 消费，无外部引用）；函数注释同步（:135-138） | A5/A6 |
| `demo/src/data/table-ex/main-view.vue` | 状态列 `type: 'text'` → `'enum'`（mappings/编辑配置不变）；等级列 `type: 'number'` → `'enum'` + `options: [{value:1,label:'低'},{value:2,label:'中'},{value:3,label:'高'}]`（number 编辑演示由数量列保留覆盖）；备注列加 `color: (r, v) => (v ? 'primary' : null)` 夹具；:448-450 过时注释更新 | demo 验证 A1-A5 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 「mappings 显示映射」「mappings/options 优先级」两块（:396-452）夹具 text→enum 并补 enum 断言（默认 align center、无映射原值显示）；「_mapText/_plainText 判定」块（:498-537）重写：text+mappings/options 不挂 `_mapText` 且 `_plainText === true`、enum+mappings/options 挂 `_mapText`、enum 不短路、text+color `_plainText === false`；新增 text color 双通道断言（canvas `{ text, color }` / dom `text-{c}`，仿 bool 块 :474-493）；「各类型离屏绘制非空像素」块（:773-795）的 `text+mappings` 项改 enum（标签同步）；新增 EnumColumn / resolveColumnType import 供身份断言；头注释 :3-8 同步 | A1-A4/A6 自检 |
| `demo/src/data/table-ex/self-checks/editor.js` | 「编辑器解析」块（:118-210）同步：text+mappings → input（:127/:202/:205 组件身份与直调断言）、enum → select（:132）、非法 `editor.type` + mappings → input（:136-143）；`resolveEditorType` 块（:427-468）重写：text+mappings/options/editor.props.options → input（形态判定），enum → select（含 :464 旧「enum 回退 input」断言翻转）；「仅 options 的 select」块（:469+）夹具 text→enum；`numericEnumColumn` 夹具（:877）type text→enum（断言值不变）；`usesDerivedOptions`/规整层断言中 type 改 enum（行为不变，:254/:317-328）；头注释 :7 同步 | A5/A6 自检 |
| `demo/src/data/table-ex/self-checks/painter.js` | status 夹具 3 处（:77、:1170、:1209）`type: 'text'` → `'enum'` 并显式 `align: 'left'`（enum 默认 center，避免像素采样坐标漂移——INDEX.md 条目 28 教训） | A2 自检像素断言不破 |

不改动：`mappings.js`（全部导出原样）、`row-geometry.js`、`ex/layout.js`（`TYPE_DEFAULT_WIDTHS.enum` 100/60 已存在，注释「废弃兼容」仅措辞过时）、`ex/spans.js`（消费 `_mapText` 取 autoRowSpan 显示值：enum 挂载后按映射文本分组、text 回归原值分组，代码不改）、`base/table.vue`、`base/table-row.vue`、`ex/interactions.js`、`ex/table-ex.vue`、form 组件。文档（skills/docs-site/docs）按任务约束在用户确认前不更新。

## 接口 / 数据结构

**EnumColumn（重写后）**

```js
// column-types/enum.js
export const EnumColumn = {
  align: 'center',
  compile: (column, dom = false) => {
    const mapper = createDisplayMapper(column)   // mappings ?? options 转换（mappings.js:50）
    return ({ value }) => {
      const mapped = mapper(value)               // null（value==null 有映射）| { text, color?, class?, style?, ... }
      if (!mapped?.text) return null             // 空文本落占位链（与现 text 门控同式）
      const { text, color, class: mClass, style: mStyle, ...attrs } = mapped
      return dom
        ? { text, class: [mClass, color && `text-${color}`], style: [mStyle], ...attrs }  // class/style 数组同 text.js:35-38，空项由 Vue 绑定归一
        : { text, color, ...attrs }
    }
  }
}
```

- 对象形式映射值 `{ text, color, class, style }` 经 `normalizeMappings`（mappings.js:34-46）归一后透传，双通道落地同 text。
- mappings 对象值带 color 时 canvas 直取色名查 `theme.colors`（cell-painters.js:432），DOM 落 `text-{c}`（与 text.js:38 同式）。

**TextColumn（改造后）**

```js
compile: (column, dom = false) => {
  const getLineClamp = ensureFn(column.multiline ? column.lineClamp : 1)
  const showTitle = column.title === true || null
  const getColor = ensureFn(column.color)        // 新增：色名 | (record, value) => 色名
  return ({ record, value }) => {
    if (!value) return null                      // 与现 !mapped?.text 门控等价（空文本落占位链）
    const text = value
    const color = getColor(record, value) || null
    // ……以下 lineClamp / dom 分支 class、style、items 管线与现状一致（text.js:24-62）
  }
}
```

- `mappings`/`options` 在 text 列不再被读取（传入不报错、不产生效果）。

**column-types/index.js**：`ColumnTypes` 增 `enum: EnumColumn`；`resolveColumnType('enum')` 不再回退 TextColumn。

**ex/cell-painters.js**

```js
col._mapText = !column.text && type === EnumColumn &&
  (column.mappings != null || column.options != null)
  ? createDisplayMapper(column) : null          // 现为 TextColumn（:204-207）

function isPlainTextColumn (column, canvasOnlyKind) {
  return !column.text && !column.multiline && !canvasOnlyKind &&
    column.color == null &&
    (column.type == null || column.type === '' || column.type === 'text')
}                       // 删 mappings/options 排除；color 须走 compile 产色（:167-171）
```

**ex/editor.js**

```js
const COLUMN_TYPE_EDITORS = { text: 'input', enum: 'select', number: 'input', currency: 'input', date: 'date', datetime: 'date', bool: 'switch' }

// resolveEditorType：① editor.type 显式合法直取（不变）→ ② text 列按开值形态与
// maxLines 判定（不变）→ ③ 其余按类型映射（enum → 'select'），未知回退 input
// 删除：hasSelectSource 与「text 带下拉来源 → select」分支
```

- enum 编辑器恒 select（无 mappings/options 时下拉为空数组：`resolveSelectOptions` 返回 []，editor.js:241；自检 self-checks/editor.js:422 同口径）。
- 提交写入原始值：`column.options` 原样通道提交 option value 原类型（self-checks editor.js:481-498 既有断言）；mappings 派生通道 value = key 字符串，数值原值经 `normalizeDerivedSelectCommit` 回写 number（editor.js:195-199/221-223）。

## 被拒绝的备选

1. **EnumColumn 委托 TextColumn.compile 复用渲染管线**——text.compile 不再构建 mapper，委托需额外传 mapper 或恢复 text 的映射通道，破坏「text 不走 map 过程」目标；且 enum 语义（居中、无多行、纯映射）与 text 不同，耦合后 multiline 改动会波及 enum。
2. **text 列保留条件化 mapper（仅 mappings/options 存在时构建）**——违背任务「去掉 text 列的 mappings」；「所有 text 列都走 map 过程」的负担正来自 compile 期无条件 `createDisplayMapper`（text.js:8），条件化只是缩小而非消除。
3. **enum 编辑器走 `resolveEditorType` 内 `typeName === 'enum'` 特判分支**——违背类型→编辑器单一事实源 `COLUMN_TYPE_EDITORS`（editor.js:101-108）；1c8f326 时期的特判写法（`typeName === 'enum' || ...`）已在后续重构中收敛为表驱动，不应回退。
4. **`isPlainTextColumn` 保留映射源排除条件**——text 忽略 mappings 后，text+options 列的短路产物与 compile 产物显示等价（均为原值），保留条件只会让这类列绕经 compile 多一层对象分配，且与「options 对 text 不产生效果」语义不符。

## 风险与回滚

- **合并风险：双向门**。无对外导出删除（mappings.js 四个导出、TextColumn 导出均保留），行为变化可经单次 `git revert` 回滚。爆炸半径：`column-types/` 注册表被 mu-table（DOM）与 table-ex（canvas）双端共用，text.js/enum.js 改动对两组件同时生效——其中 DOM 侧 `type: 'enum'` 恢复渲染（2026-11-03 前行为），DOM 侧 text+mappings 用户代码不再映射（任务目标内、双端一致）。
- **预期内行为断裂**（验收标准明示）：text+mappings/options 显示原值、编辑器不再自动 select；enum 不再输出 dev 废弃警告。
- **enum 显示语义随 createDisplayMapper 收敛**（实现方式变更，非验收项）：`value == null` 落占位链——旧实现有 `default` 时兜底 default（enum.js:28 `enumMap[value] ?? enumMap.default ?? { text: value }`），新实现按 mappings.js:55 `v == null → null`；数组形式 `mappings` 按 options 口径转换（旧实现按数组下标为键）。
- **非本任务 demo 页不同步**：`demo/src/data/table/main-view.vue:108-152`（DOM 版 mappings 演示段——实际受影响仅无 type+mappings 列 :109/:149 显示原值；:111/:113/:135/:150/:151 的 bool+mappings 与 number+options 本就不映射、行为不变；:136「枚举」列 `type: 'enum'` 现回退 TextColumn，恢复后经 EnumColumn 映射显示不变、align left→center、不再输出废弃警告）、`demo/src/data/table-ex-basic/main-view.vue:152`（「映射」列）、`demo/src/data/table-ex/main-view.vue:713`（默认宽夹具状态列）将显示原值；三者均不在 A1-A6 验收路径（验收只用 `/data/table-ex/`），维持原样，文档三处按约束推迟。
- **painter 自检像素坐标**：enum 默认 `align: 'center'` 与 text `left` 不同，夹具不固定 align 会使采样区漂移误报组件缺陷（INDEX.md 条目 28）——设计已要求夹具显式 `align: 'left'`。
- **demo 等级列语义变更**：number 纯数值演示夹具被替换（number 编辑演示仍由数量列 count 覆盖，main-view.vue:417-425），自检无该列几何依赖（自检夹具自持，painter.js:74-83）。

## 测试计划（单片；全项目无测试框架，自检 = demo 页内建清单）

| 验收标准 | 归属 | 手段 | 检查方式 |
|---|---|---|---|
| A1 enum 注册可渲染 | 单片 | `浏览器` + 自检 | 自检：`resolveColumnType('enum') === EnumColumn`、`prepareColumn({ type: 'enum' })._align === 'center'`、无映射源 enum 原值显示；浏览器：demo `http://localhost:3000/data/table-ex/` 状态列显示「启用/待处理/已归档」映射文本 |
| A2 enum+mappings 经 createDisplayMapper | 单片 | 自检 + `浏览器` | 自检：enum+mappings 命中取 text、对象形式 `{ text, color }` 取 text/color、default 兜底、`value == null` 落占位链、`_mapText` 挂载；浏览器：状态列文本与映射一致 |
| A3 enum+options 兼容（优先级） | 单片 | 自检 + `浏览器` | 自检：mappings+options 共存显示取 mappings（mappings.js:50 口径）、仅 options 显示 label、`resolveSelectOptions` column.options 原样透传、派生排除 default；浏览器：等级列显示「低/中/高」 |
| A4 text 不走 mappings、color 保持 | 单片 | 自检 + `浏览器` | 自检：text+mappings/options 显示原值、`_plainText === true`、`_mapText === null`；text+color `_plainText === false` 且断言 canvas `{ text, color }` / dom `text-{c}`（字符串与函数色名两形态）；浏览器：备注列非空值染 primary 色 |
| A5 enum 编辑 select、写原始值 | 单片 | 自检 + `浏览器` | 自检：enum resolveEditorType → 'select'、组件 MuSelect、options 原样通道提交 number、派生通道 open 字符串化/提交回写 number（复用既有断言改 type）；浏览器：点击状态/等级格出现 mu-select 下拉，点选后单元格值与映射域一致 |
| A6 其余类型 options 无效、无 select | 单片 | 自检 | 自检：number/bool/currency/text + mappings/options → input/switch/按形态、无 type+options → input、`editor.props.options` 无 type 不再升级 select；显示侧 number+mappings 仍 Intl 文本（既有断言 :441-448 保留） |
| 构建/静态检查 | 终验 | `命令` | `npm run build` 通过；`npx eslint src demo/src` 无错（口径见 .eslintignore，INDEX.md 条目 43） |
| demo 自检全绿 | 终验 | `浏览器` | 打开 demo 页，自检清单全部 PASS（DOM 文本断言，不截图） |

## 实施步骤（单片，不切片）

1. **列类型层**：重写 `enum.js`、注册 `index.js`、改造 `text.js`。完成判据：`npx eslint src/components/table` 无错；`npm run build` 通过（自检尚未改，此时 demo 自检允许红）。文件集合：`src/components/table/column-types/{enum.js,index.js,text.js}`。依赖：无。
2. **canvas 适配**：`cell-painters.js` 的 `_mapText`/`isPlainTextColumn`/注释。完成判据：build 通过。文件集合：`src/components/table/ex/cell-painters.js`。依赖：步骤 1。
3. **编辑器**：`editor.js` 注册 enum、删 text 自动 select 分支。完成判据：eslint/build 通过。文件集合：`src/components/table/ex/editor.js`。依赖：步骤 1。
4. **demo 夹具与自检同步**：`main-view.vue` 列调整；self-checks 三文件断言重写（见改动清单）。完成判据：demo 页（rollup watch 常驻）自检清单全部 PASS。文件集合：`demo/src/data/table-ex/main-view.vue`、`demo/src/data/table-ex/self-checks/{cell-painters.js,editor.js,painter.js}`。依赖：步骤 1-3。
5. **终验**：`npm run build`、`npx eslint src demo/src`、按「测试计划」逐条验证 A1-A6（手段列：自检 / `浏览器` / `命令`，DOM/可访问性快照优先）。完成判据：全部通过。文件集合：无新增（验证 only）。依赖：步骤 4。

## 未解问题

1. **[解释性决定，请审改/用户复核]** A4「text 列 color 选项能力保持不变」：现 `TextColumn` 并无 `column.color` 选项（text.js 全文无读取；color 仅能经 mappings 对象值 `color` 字段流入，text.js:15-22）。本设计将 A4 解释为「text 增加 `column.color`（bool/number/currency/date/datetime 同款，INDEX.md 条目 34），映射移除后 text 仍具备染色能力」。若用户意图仅为「不破坏其他类型既有 color 能力」，可剔除 text.js 的 color 增项，其余设计不受影响（此时 `isPlainTextColumn` 的 `column.color == null` 条件与 A4 的 text+color 断言一并省略）。
2. 知识库 INDEX.md 条目 33（mappings text 独有）/36（enum 废弃兼容）与本设计冲突：按项目惯例知识沉淀由主会话在任务收尾统一处理，本任务不改 `agent-docs/knowledge/`。
3. 文档三处同步（skills/mussel-ui、docs/quick-reference、docs-site）按任务约束推迟至用户确认后，不在本实施范围。
