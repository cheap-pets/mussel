# 数据展示组件 API

### MuListItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 图标 |
| `label` | String | 标题文字 |
| `tag` | String | 渲染标签：默认渲染 `span`，`'a'` 时渲染链接 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（缺省渲染 icon + label） |

### MuListDivider

列表分隔项。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 分隔项图标 |
| `label` | String | 分隔项文字 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（缺省渲染 icon + label） |

---

### MuTree

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `data` | Array | — | 树节点数据 |
| `props` | Object | — | 节点数据字段映射，默认 `{ key: 'id', icon: 'icon', label: 'label', title: 'title', disabled: 'disabled', childNodes: 'childNodes' }`（`isLeaf`/`checked` 默认不映射，可显式指定字段名） |
| `buttons` | Array | — | 节点工具按钮 |
| `checkbox` | Boolean | — | 是否显示勾选框 |
| `cascaded-check` | Boolean | — | 级联勾选。**当前版本未生效**（prop 已声明但未实现），勾选为独立行为 |
| `checked-nodes-keys` | Set | — | 已勾选节点 key 集合 |
| `auto-expand-level` | Number | — | 自动展开层级数 |
| `active-node` | Object\|Number\|String | — | 当前选中节点 |
| `node-icons` | Boolean\|Object | `true` | 是否显示节点图标及自定义图标；默认图标集 `{ leaf: 'file', folder: 'folder', folderOpen: 'folderOpen' }`，可全局经 `$mussel.options.tree.nodeIcons` 定制 |
| `expand-icons` | Boolean\|Object | `true` | 是否显示展开图标及自定义；默认 `{ expanded: 'treeNodeExpand', collapsed: 'treeNodeExpand' }`，可全局经 `$mussel.options.tree.expandIcons` 定制 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-click` | `node` | 节点点击（不含展开按钮） |
| `node-expand` / `node-collapse` | `node` | 展开/收拢（可用于懒加载）|
| `node-button-click` | `node, button` | 节点工具按钮点击 |
| `node-check-change` | `node, checked` | 勾选状态变更 |

| 插槽 | 说明 |
|------|------|
| `default` | 节点内容模板，作用域参数为 `node` |
| `buttons` | 节点工具按钮模板，作用域参数为 `node` |

> 内部节点渲染组件 `MuTreeNode` 虽有导出，但强依赖 MuTree 上下文（脱离使用会报错），请勿单独使用；自定义节点一律通过 MuTree 的插槽实现。

**方法（通过 ref 调用）：**

| 方法 | 说明 |
|------|------|
| `expand(...nodes)` | 展开指定节点（传节点对象） |
| `collapse(...nodes)` | 收拢指定节点 |
| `expandTo(target)` | 展开到目标节点的路径（target 为节点对象或 key） |
| `expandAll({ level })` | 展开到指定层级；缺省用 `auto-expand-level`，两者均未指定时仅展开第一层（需全部展开请显式传足够大的 `level`） |
| `collapseAll()` | 全部收拢 |

---

### MuTags

标签组。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `tags` | Array | — | 标签数据 |
| `max` | Number | — | 最大显示数量，超出合并省略 |
| `removable` | Boolean | — | 是否可删除 |
| `expandable` | Boolean | — | 是否可下拉展开所有标签 |
| `tooltip` | Boolean | `true` | 标签是否显示 tooltip |
| `dropdown-anchor` | — | `'$parent'` | 下拉面板锚点目标 |
| `dropdown-class` | String | — | 下拉面板附加 class |
| `dropdown-style` | String \| Object | — | 下拉面板附加 style |
| `dropdown-width` | String | `'anchor'` | 下拉面板宽度；`'anchor'` 表示与触发器同宽 |

> 组件将 `dropdown-class` / `dropdown-style` / `dropdown-width` / `dropdown-anchor` 传给内部 `MuDropdown`，用于定制溢出标签的下拉面板；触发方式固定为 `click`，不可修改。

| 事件 | 参数 | 说明 |
|------|------|------|
| `tagRemove` | `tag` | 点击删除按钮 |

---

### MuCalendar

月历，用于页面内嵌日期展示与选择。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `model-value` | Date\|String | — | 双向绑定日期值；输出形态由 `value-type` 控制 |
| `value-type` | String | `'date'` | 输出值类型：`'date'`（默认，输出 Date 对象）\| `'string'`（按 `value-format` 输出字符串） |
| `value-format` | String | `yyyy-MM-dd` | 仅 `value-type="string"` 时生效的输出格式 |
| `week-starts-on` | Number | `0` | 每周起始日（0=周日 ~ 6=周六）；默认读全局 `calendar.weekStartsOn` 配置 |
| `min` | Date\|String | — | 最小可选日期 |
| `max` | Date\|String | — | 最大可选日期 |

---

### MuTable

DOM 渲染的数据表格。大数据量、单元格编辑、树形展示、列宽拖拽场景使用 `MuTableEx`（见下节，props / 事件 / 列配置与本组件同源）。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `records` | Array | — | 数据列表 |
| `columns` | Array | — | 列配置，结构见下方 |
| `key-field` | String | — | 唯一标识字段名 |
| `striped` | Boolean | — | 斑马纹 |
| `hover-mode` | String | `row` | `none` \| `row` \| `column` \| `cross` \| `cell` |
| `gridlines` | String | `all` | `none` \| `all` \| `row` \| `column` |
| `selected-record` | Object | — | 当前选中记录（双向绑定）|
| `selected-record-key` | String\|Number | — | 当前选中记录 key（双向绑定）|
| `header-checked` | Object | — | 表头全选框状态（`{ 字段名: Boolean }`），需与列的 `headerCheckbox` 配合才显示表头全选框（双向绑定） |
| `order-by` | String | — | 排序字段，格式 `field:asc` / `field:desc` |
| `records-offset` | Number | `0` | 记录偏移量（影响行号显示）|
| `fixed-left-columns` | Number | — | 固定左侧列数 |
| `placeholder` | String | — | 空单元格占位文本 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `header-click` | `column` | 表头点击 |
| `cell-click` | `{ record, recordIndex, column }` | 单元格点击 |
| `cell-item-click` | `{ record, column, item/tag/button }` | 单元格内条目点击（`link` / `list` 列载荷键 `item`、`tag` 列 `tag`、`button` 列 `button`，值为条目对象原引用，超限省略项为 `'...'`） |
| `update:selected-record` | `record` | 选中记录变更 |
| `update:selected-record-key` | `key` | 选中 key 变更 |
| `update:header-checked` | `column, value` | 表头全选框切换（载荷为列对象与目标勾选值） |
| `update:cell-value` | `{ record, column, value }` | 单元格值变更（check 列）|

#### Column 配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `field` | String | 数据字段名 |
| `key` | String | 列标识（缺省自动生成） |
| `caption` | String | 列标题 |
| `type` | String\|Object | 列类型名（见下表，缺省 `text`）；也可传自定义类型对象 `{ align, width, compile: column => ({ record, value, recordNumber, emit }) => ({ text } \| { items }) }` |
| `width` / `minWidth` / `maxWidth` | String\|Number | 列宽 |
| `align` | String | `left` \| `center` \| `right` |
| `sortable` | Boolean | 是否可排序 |
| `text` | String\|Function | 单元格显示文本（可覆盖默认值，优先于 `mappings` / `options`）|
| `value` | String\|Function | 单元格值（可覆盖 field）|
| `title` | String\|Function\|Boolean | `true` 时为单元格 / 省略项挂原生 title（`MuTableEx` 为溢出才显示的 tooltip）；String / Function 为自定义提示文本 |
| `link` | Boolean | 列级链接形态：`text` 列渲染链色文本（缺省 `primary` 色）；`list` / `button` 列条目按链接样式渲染，整列统一生效 |
| `class` / `style` | String\|Function | 单元格 class / 样式 |
| `headerClass` / `headerStyle` | String | 表头 class / 样式（静态值，不支持函数） |
| `mappings` | Object | 显示映射（`enum` 列）：`{ 值: 文本 }`，按 `String(value)` 匹配；未命中回退 `default` 键，再回退原值；空值（`null` / `undefined`）显示 `placeholder`；映射值可为 `{ text, color, class, style }` 对象 |
| `options` | Array | 选项数组自动转换为显示映射（`enum` 列），格式同 `MuSelect` 的 `options`（`[{ value, label }]` 或字符串数组）；与 `mappings` 同时存在时 `mappings` 优先 |
| `multiline` | Boolean | 多行文本（`text` 类型）|
| `lineClamp` | Number\|Function | 行数限制（`text` 类型）|
| `color` | String\|Function | 单元格文本色（主题色名），可为 `(record, value) => 色名`（`text` / `bool` / `date` / `datetime` / `number` / `currency` / `icon` 类型）|
| `format` | String | 日期格式（`date` / `datetime` 类型）|
| `formatter` | Function | 日期格式化函数 `(value, format) => text`（`date` / `datetime` 类型，默认内置 `toDateString`）|
| `formatOption` | Object | `Intl.NumberFormat` 选项（`number` / `currency` 类型）|
| `locales` | String | 数字 / 货币格式化 locale（默认 `'zh-CN'`）|
| `listItems` | Function | 条目生成函数 `(record, value) => 条目数组`（`list` 列）；不传时取字段值，仅接受数组 |
| `listOption` | Object | `{ max, color, disabled, class, style }`（`list` 列）：`max` 超限以 `...` 省略，`color`（仅列级 `link` 生效）/ `disabled` 为条目缺省值 |
| `links` | Function | 链接生成函数 `(record, value) => 链接数组`（`link` 类型，内部委托 `list` 实现），链接项 `{ label, color, danger, disabled }`（`caption` 键兼容）；不传时按字段值转换（数组逐项、单值单个，对象元素原样保留）|
| `linkOption` | Object | `{ max, danger, disabled, class, style }`（`link` 列）；`danger: true` 等价链接色 `danger` |
| `buttons` | Array\|Function | 按钮数组 `[{ caption, icon, color, disabled }]` 或 `record => 数组`（`button` 列）；`icon` 为图标注册名，与 `caption` 互斥（文本优先）；点击发 `cell-item-click`（载荷 `button`）。DOM 通道渲染 `mu-button`（恒 small，`color` 仅 `normal` / `primary` / `secondary` / `danger`，超出回退缺省色）；canvas 通道支持全部主题色名 |
| `tags` | Function | 标签生成函数 `(record, value) => 标签数组`（`tag` 类型）；不传时按字段值转换 |
| `tagOption` | Object | `{ max, class, style, pill, flat, color }` |
| `iconOption` | Object | `{ size }`（`icon` 类型）：图标尺寸（Number，默认 16）|
| `disabled` | Function | 禁用函数（`check` 类型）|
| `headerCheckbox` | Boolean | 显示表头全选框（`check` 类型）；需同时传表格级 `header-checked` prop 才实际显示 |

#### 列类型（type）

| 类型 | 说明 | 默认对齐 | 默认宽度 |
|------|------|---------|---------|
| `text` | 文本（缺省类型），支持 `multiline` / `lineClamp` / `color` 染色 | left | — |
| `rec_no` | 自动行号 | center | 50px |
| `check` | 复选勾选 | center | 50px |
| `bool` | 布尔，缺省显示 是 / 否，可配 `trueText` / `falseText` | center | — |
| `date` | 日期格式化 | right | — |
| `datetime` | 日期时间格式化 | right | — |
| `number` | 数字格式化 | right | — |
| `currency` | 货币格式化 | right | — |
| `link` | 链接列（竖排，每项一行），配合 `links` 函数或字段值，条目点击发 `cell-item-click`（载荷键 `item`） | left | — |
| `list` | 条目列（竖排，每项一行、超长省略），仅接受数组值；条目 `string` / `number` / `{ label, color, disabled, ...任意属性 }`，配合 `listItems` / `listOption` / 列级 `link`；条目点击发 `cell-item-click`（载荷键 `item`） | left | — |
| `tag` | 标签，配合 `tags` 函数 | left | — |
| `button` | 轻量按钮组，配合 `buttons`（文本 / 图标按钮，互斥文本优先）；点击发 `cell-item-click`（载荷 `button`）| left | — |
| `img` / `image` | 图片缩略图 | left | — |
| `icon` | 图标，值为 `installIcons` 注册名（仅此一种形态），配合 `color` / `iconOption`；纯展示、不可编辑 | center | — |
| `enum` | 枚举显示映射，独占 `mappings` / `options`；映射值可为 `{ text, color, class, style }` 对象 | center | — |

> **`icon` 列**：value 为图标注册名（string），经 `field` / `value` 取值——不支持 svg 串 / 图片 URL / 对象 / 数组直传。`column.color` 设色（主题色名或 `(record, value) => 色名`，与 `text` 列同契约，缺省正文色）；`iconOption: { size }` 设尺寸（Number，默认 16，canvas / DOM 双通道生效）。缺省对齐 `center`；纯展示、无条目点击；空值 / 非 string / 未注册名落 `placeholder` 占位（后两者 dev 环境 warn 一次）。`title: true` 时 DOM 通道条目挂原生 title（显示注册名），canvas 通道不触发。
>
> **`list` / `link` 列**：`list` 仅接受数组值（非数组 / 空数组落 `placeholder`）；`link` 为 `list` 的兼容壳（`links` + `linkOption`）。条目标准键 `label`（`caption` 兼容，dev 警告一次），label 空值条目过滤；列级 `link: true` 整列条目按链接样式渲染（缺省 `primary` 色，条目 `color` 覆盖），纯文本条目同样可点击；`disabled` 条目置灰且点击拦截。
>
> 内置注册名 32 个：`X` `check` `x` `ok` `info` `alert` `question` `chevronUp` `chevronDown` `chevronLeft` `chevronRight` `arrowDownLeft` `arrowUpRight` `list` `grid` `dots` `search` `file` `folder` `folderOpen` `sun` `moon` `star` `starred` `leftCollapse` `leftExpand` `clock` `calendar`（28 个 Tabler 图标）+ `loading` `windowClose` `treeNodeExpand` `dropdownExpand`（4 个组合项，自带动画）。其余图标经 `installIcons({ 名称: svg串或class串 })` 注册后按名引用；运行时注册对新行 / 重绘即时生效。

#### 完整示例

```vue
<template>
  <mu-table
    :records="records"
    :columns="columns"
    key-field="id"
    striped
    v-model:selected-record-key="selectedKey"
    :header-checked="headerChecked"
    @cell-item-click="onItemClick"
  />
</template>

<script setup>
const selectedKey = ref(null)
const headerChecked = ref({ checked: false })
const columns = [
  { type: 'rec_no' },
  { type: 'check', field: 'checked', headerCheckbox: true },
  { field: 'name',    caption: '姓名',   type: 'text', sortable: true },
  { field: 'amount',  caption: '金额',   type: 'currency' },
  { field: 'status',  caption: '状态',  type: 'enum',
    mappings: { active: '启用', inactive: '停用', default: '未知' }
  },
  { field: 'level',   caption: '等级',   type: 'enum',
    options: [{ value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' }]
  },
  { field: 'enabled', caption: '启用',   type: 'bool' },
  { field: 'created', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
  { field: 'owners',  caption: '负责人', type: 'list', listOption: { max: 3 }, link: true },
  { field: 'actions', caption: '操作',   type: 'link', width: 140,
    linkOption: { max: 3 },
    links: (record) => [
      { label: '编辑', action: 'edit' },
      { label: '删除', action: 'delete', danger: true }
    ] },
  { field: 'ops',     caption: '维护',   type: 'button', width: 140,
    buttons: (record) => [
      { caption: '编辑', color: 'primary' },
      { caption: '删除', color: 'danger', disabled: record.locked }
    ] }
]
</script>
```

---

### MuTableEx

canvas 渲染的高性能表格：只绘制可视区域，适合大数据量；props / 事件 / 列配置与 `MuTable` 完全同源（上节全部适用），并扩展单元格编辑、列宽拖拽、树形展示、合并单元格、单元格选中/复制及 `progress` 列类型（`button` 列两组件通用）。

> 仅 `mussel.ex` 版本包含此组件（`dist/mussel.ex.js` + `dist/mussel.ex.css`，基础版 `mussel.js` 不含）；`install` 用法与基础版相同，额外注册 `MuTableEx`。

与 `MuTable` 的差异：

- 组件自身 `width: 100%; height: 100%`，高度须由容器确定（flex 子项 / 固定高），内容区虚拟滚动。
- 列配置 `class` / `style` / `headerClass` / `headerStyle` 为 DOM 通道字段，不生效；`link` / `list` / `tag` 条目的 `class` / `style` 亦不生效，颜色经色名（条目 `color` / `danger` 及各 `*Option.color`）生效。
- `title` 生效为单元格 tooltip：`true` 时溢出才显示全文，String / Function 为 hover 即显示自定义文本（依赖宿主完整 install 提供的 `$mussel.tooltip` 控制器，缺失时 dev 警告并关闭）。
- 点击可排序表头自动发 `update:order-by`（`field:asc → field:desc → ''` 循环），可 `v-model:order-by`。
- 组件不修改数据：勾选翻转与编辑提交均经 `update:cell-value` 通知，需由外部写回 `record`（写回后自动重绘该行）。
- 单元格选中：点击不可编辑格置选中（描边），方向键移动、Ctrl+C 复制（见下）。

#### 扩展属性

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `empty-text` | String | `''` | 无数据占位文本（也可用 `empty` 插槽）|
| `records-version` | Number | `0` | 就地修改 `records` 内容（引用未变）后递增，触发整幅重绘 |
| `editable` | Boolean | `false` | 表格级编辑开关；列须同时配置 `editor` |
| `resizable` | Boolean | `false` | 表头拖拽调整列宽；列级 `resizable: false` 可单独禁止 |
| `tree` | Boolean | `false` | 树模式：按 `tree-props` 从平铺 `records` 构建层级 |
| `tree-props` | Object | — | `{ key, parentKey, isLeaf }`，缺省 `{ key: keyField ?? 'id', parentKey: 'parentId' }`；`isLeaf` 映射懒加载字段名（未映射不生效；映射后 `字段 === false` 且无子级的节点显示展开三角，点击发 `tree-expand`，异步回填 = 就地 push 子级 + `records-version`++）|
| `tree-expanded-keys` | Array | — | 展开节点 key（双向绑定；传入即接管展开状态，`default-expand-level` 不生效）|
| `default-expand-level` | Number | `0` | 初始展开层级（0 基：`level <= 值` 的节点展开；`-1` 全收起）|
| `span-method` | Function | — | 合并单元格：`(info) => { [列 key 或 field]: rowspan \| { rowspan, colspan \| 'rest' } } \| null`，每行调用一次（`info = { record, recordIndex, recordNumber, prevRecord, nextRecord, columns }`），返回该行作为主行的合并声明；也可用列级 `autoRowSpan` |

#### 扩展事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:order-by` | `orderBy` | 点击可排序表头，`field:asc → field:desc → ''` 循环 |
| `column-resize` | `{ column, width }` | 拖拽列宽结束 |
| `update:tree-expanded-keys` | `keys` | 树节点展开 / 收起 |
| `tree-expand` | `{ key, record, level }` | 展开箭头 toggle 展开（每次展开均发；`treeProps.isLeaf` 懒加载在此事件内异步取子级）|
| `tree-collapse` | `{ key, record, level }` | 展开箭头 toggle 收起 |
| `update:cell-value` | `{ record, recordIndex, column, value }` | check 翻转与编辑提交（较 `MuTable` 多 `recordIndex`）|
| `cell-item-click` | `{ record, recordIndex, column, item/tag/button }` | 条目点击（较 `MuTable` 多 `recordIndex`；载荷键 `link` / `list` 列为 `item`、`tag` 列 `tag`、`button` 列 `button`）|
| `edit-button-click` | `{ record, recordIndex, column }` | 点击列 `editButton` 图标按钮（不选中行、不开编辑）|

| 插槽 | 说明 |
|------|------|
| `empty` | 无数据占位内容（缺省显示 `empty-text`）|

**方法（通过 ref 调用）：**

| 方法 | 说明 |
|------|------|
| `scrollToRecord(keyOrIndex)` | 滚动到指定行（优先按 key 匹配，其次行号），返回是否成功 |
| `expandAll()` / `collapseAll()` | 树模式全部展开 / 收起 |
| `getTreeExpandedKeys()` | 当前展开 key 数组 |
| `refreshTheme()` | 重读 `--mu-*` 变量并重绘（运行时覆盖主题 / 尺寸变量后调用）|
| `getCellRect(row, col)` | 单元格矩形（视口坐标），自动化测试用 |
| `getLayoutInfo()` / `getThemeSnapshot()` | 布局 / 主题快照，调试用 |

#### 扩展列配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `editable` | Boolean | 列级编辑开关，`false` 关闭 |
| `editor` | Boolean\|Object | 编辑器配置：`true` 按列类型自动选择；对象 `{ type, props, validate, border }`，见下方「单元格编辑」|
| `editButton` | Object | `{ icon }`：hover 时单元格右侧显示图标按钮（`icon` 为 `installIcons` 注册名），点击发 `edit-button-click` 事件（载荷 `{ record, recordIndex, column }`），不触发选中 / 编辑 |
| `maxLines` | Number | 文本最大行数（1–10）：`> 1` 时自动折行，超出省略；替代 `multiline` + `lineClamp`（两者仍兼容）|
| `maxItems` | Number | `link` / `list` 条目列最大显示条数（1–10，默认 10），超出以 `...` 省略（canvas 绘制层；DOM 通道用 `linkOption.max` / `listOption.max` / `tagOption.max`）|
| `resizable` | Boolean | `false` 禁止拖拽该列宽；`minWidth`（缺省取列类型最小宽，兜底 40）/ `maxWidth` 限制拖拽范围；固定列不可拖拽 |
| `treeNode` | Boolean | 树模式下显示展开箭头与缩进的列，缺省为首个非 `check` / `rec_no` 列 |
| `autoRowSpan` | Boolean\|String\|Function | 列级纵向合并：`true` 按显示值（含 `mappings` 映射）分组、字段名 string 按字段值分组、`(record) => 键` 行级求值；相邻同键行自动合并。与 `spanMethod` 混用时被 `spanMethod` 接管的列全表失效；`order-by` 非空时 dev 警告 |
| `progressOption` | Object\|Function | `progress` 列：`{ color, showText }`，`color` 为主题色名（缺省 `primary`），`showText: false` 隐藏百分比；可为 `record => option` |

#### 扩展列类型

| 类型 | 说明 | 默认对齐 |
|------|------|---------|
| `progress` | 进度条，值 0–100，配合 `progressOption`（canvas 专属，不入 `MuTable` 列类型注册表）| left |

#### 合并单元格

- 表格级 `span-method(info)`：每行调用一次，返回 `{ [列 key 或 field]: rowspan | { rowspan, colspan | 'rest' } } | null`（`'rest'` 占满至本列所在分区末列——固定列区 / 滚动区各自为界）；键先按 `column.key` 精确匹配，否则按 `field` 匹配（命中多列警告）。
- 列级 `autoRowSpan`（见上表）适合相同值自动合并；与 `spanMethod` 可共存（`spanMethod` 声明优先填补，接管列的 `autoRowSpan` 失效）。
- 约束：`spanMethod` 声明落在树形列 / `check` 列时丢弃（dev 警告）；`autoRowSpan: true` 取到对象 / 数组值时不产生合并（dev 警告）；`colspan` 跨固定列边界夹紧到固定区末列；区域重叠整条丢弃（dev 警告）；合并后行高按区域整体内容精算。

#### 单元格选中与复制

- 点击不可编辑单元格置选中格（描边高亮，合并单元格按区域整体选中）；点击可编辑格进入编辑并清除选中。
- 方向键移动选中格（边界 clamp 不环绕，自动滚动到可见区域）。
- `Ctrl` / `Cmd + C` 复制选中格显示文本：条目列（`link` / `list` / `tag`）按换行连接；`check` / `button` / `progress` / `img` / `icon` 图形列可选中但不写剪贴板。
- 点击表头 / 空白延伸区、`records` / `columns` 引用变化时自动清除；编辑器与表单控件聚焦时不抢占键盘。

#### 单元格编辑

- 开启条件：表格 `editable` + 列 `editor`；`rec_no` / `check` / `link` / `list` / `tag` / `img` / `button` / `progress` / `icon` 列不可编辑。单击单元格进入编辑。
- 编辑器类型（`editor.type` 显式指定优先，可选 `input` / `select` / `date` / `switch` / `textarea`）：

| 列类型 | 缺省编辑器 |
|------|------|
| `text`（含未指定 `type`）| `input`；值为数组或 `maxLines > 1` 时为 `textarea` |
| `enum` | `select`（无 `mappings` / `options` 时下拉为空）|
| `number` / `currency` | `input`（`type="number"`）|
| `date` / `datetime` | `date` |
| `bool` | `switch` |

- `editor.props`：透传给编辑器组件（`MuInput` / `MuSelect` / `MuDateInput` / `MuSwitch` / 原生 `textarea`）。`select` 的选项来源优先级：`editor.props.options` > 列 `options` > 由 `mappings` 派生（排除 `default`）。
- `editor.validate(value, { record, column })`：返回 `true` 通过；返回字符串作为错误提示，编辑器标红且不关闭。
- `editor.border: false`：无边框编辑器。
- 提交：`input` 按 Enter；`textarea` 按 Ctrl/Cmd+Enter（Enter 换行）；`select` / `date` / `switch` 值变化即提交；失焦、滚动、点击其他单元格自动提交；Esc 取消。
- 提交值规整：`number` / `currency` 收敛为 number（空值 → `null`）；`textarea` 原值为数组时按换行拆分回数组。

#### 示例

```vue
<template>
  <div class="flex-1" style="min-height: 0;">
    <mu-table-ex
      ref="tableRef"
      :records="records"
      :columns="columns"
      key-field="id"
      editable
      resizable
      tree
      :tree-props="{ key: 'id', parentKey: 'parentId' }"
      :default-expand-level="1"
      v-model:order-by="orderBy"
      v-model:selected-record-key="selectedKey"
      empty-text="暂无数据"
      @update:cell-value="onCellValue"
      @cell-item-click="onItemClick" />
  </div>
</template>

<script setup>
const columns = [
  { type: 'rec_no' },
  { field: 'name',   caption: '名称', sortable: true, minWidth: 120, editor: true },
  { field: 'status', caption: '状态', width: 100, type: 'enum',
    mappings: { active: '启用', archived: '归档', default: '未知' }, editor: true },
  { field: 'count',  caption: '数量', type: 'number', width: 100,
    editor: { validate: v => (v >= 0 ? true : '不能为负数') } },
  { field: 'date',   caption: '日期', type: 'date', width: 120, editor: true },
  { field: 'memo',   caption: '备注', width: 200, maxLines: 3, editor: true },
  { field: 'rate',   caption: '进度', type: 'progress', width: 140,
    progressOption: { color: 'success' } },
  { caption: '操作', type: 'button', width: 160, resizable: false,
    buttons: record => [
      { caption: '编辑', color: 'primary' },
      { caption: '删除', color: 'danger', disabled: record.locked }
    ]
  }
]

// 组件不改数据：提交后由外部写回
function onCellValue ({ record, column, value }) {
  record[column.field] = value
}

function onItemClick ({ record, button }) {
  if (button?.caption === '删除') remove(record)
}
</script>
```

---

### MuPagination

分页组件，常与 `MuTable` 配合使用（作为表格的平级兄弟节点，置于表格下方）。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page-index` | Number | `0` | 双向绑定，当前页码（从 0 开始） |
| `page-size` | Number | `20` | 双向绑定，每页条数 |
| `total` | Number | `0` | 记录总数（总页数由 `total / page-size` 派生） |
| `page-size-options` | Array | — | 可选每页条数，如 `[20, 50, 100]`；提供后渲染下拉切换 |
| `size` | String | — | 按钮尺寸：`small` \| `normal`；未设置时继承外层 MuToolbar 的 `tool-size` |
| `quick-jumper` | Boolean | — | 是否显示快速跳页输入框 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:page-index` | `pageIndex` | 页码变更 |
| `update:page-size` | `pageSize` | 每页条数变更 |

> 页码按钮数按容器宽度自适应收敛（11/9/7 档），全部放不下时降级为「第 X 页，Y / 页」文本模式；容器 resize、`size` 与上述 props 变化自动重算，无需干预。

```html
<mu-table :records="records" :columns="columns" />
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="total"
  :page-size-options="[20, 50, 100]"
  size="small"
  quick-jumper
  class="mt-1x" />
```
