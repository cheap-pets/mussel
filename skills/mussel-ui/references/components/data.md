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
| `cell-item-click` | `{ record, column, link/tag }` | 单元格内链接/标签点击 |
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
| `title` | String\|Function | 单元格 title（`true` 时为 link/tag 类型开启省略项的 title 提示）|
| `class` / `style` | String\|Function | 单元格 class / 样式 |
| `headerClass` / `headerStyle` | String\|Function | 表头 class / 样式 |
| `mappings` | Object | 显示映射（`text` / `number` / `bool` 列及未指定 `type` 的列）：`{ 值: 文本 }`，按 `String(value)` 匹配；未命中回退 `default` 键，再回退原值（`number` 列此时不再格式化）；空值（`null` / `undefined`）显示 `placeholder` |
| `options` | Array | 选项数组自动转换为显示映射，格式同 `MuSelect` 的 `options`（`[{ value, label }]` 或字符串数组）；与 `mappings` 同时存在时 `mappings` 优先 |
| `multiline` | Boolean | 多行文本（`text` 类型）|
| `lineClamp` | Number\|Function | 行数限制（`text` 类型）|
| `format` | String | 日期格式（`date` / `datetime` 类型）|
| `formatter` | Function | 日期格式化函数 `(value, format) => text`（`date` / `datetime` 类型，默认内置 `toDateString`）|
| `formatOption` | Object | `Intl.NumberFormat` 选项（`number` / `currency` 类型）|
| `locale` | String | 数字格式化 locale（`number` 类型，默认 `'zh-CN'`）|
| `locales` | String | 货币格式化 locale（`currency` 类型，默认 `'zh-CN'`）|
| `links` | Function | 链接生成函数 `(record, value) => 链接数组`（`link` 类型），链接项 `{ caption, color, danger, disabled }`；不传时按字段值转换（数组逐项、单值单个，对象元素原样保留）|
| `linkOption` | Object | `{ max, class, style, color, danger, disabled }`，为全部链接项设置缺省值 |
| `tags` | Function | 标签生成函数 `(record, value) => 标签数组`（`tag` 类型）；不传时按字段值转换 |
| `tagOption` | Object | `{ max, class, style, pill, flat, color }` |
| `disabled` | Function | 禁用函数（`check` 类型）|
| `headerCheckbox` | Boolean | 显示表头全选框（`check` 类型）；需同时传表格级 `header-checked` prop 才实际显示 |

#### 列类型（type）

| 类型 | 说明 | 默认对齐 | 默认宽度 |
|------|------|---------|---------|
| `text` | 文本（缺省类型），可配 `mappings` / `options` | left | — |
| `rec_no` | 自动行号 | center | 50px |
| `check` | 复选勾选 | center | 50px |
| `bool` | 布尔，缺省显示 是 / 否；可配 `mappings: { true: '…', false: '…' }` | center | — |
| `date` | 日期格式化 | right | — |
| `datetime` | 日期时间格式化 | right | — |
| `number` | 数字格式化，可配 `mappings` / `options` | right | — |
| `currency` | 货币格式化 | right | — |
| `link` | 链接，配合 `links` 函数 | left | — |
| `tag` | 标签，配合 `tags` 函数 | left | — |
| `img` / `image` | 图片缩略图 | left | — |
| `enum` | **已废弃**（使用时控制台告警），改用 `text` + `mappings` / `options`；兼容期内映射值仍可为 `{ text, class, style }` 对象 | center | — |

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
  { field: 'status',  caption: '状态',
    mappings: { active: '启用', inactive: '停用', default: '未知' }
  },
  { field: 'level',   caption: '等级',   type: 'number',
    options: [{ value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' }]
  },
  { field: 'enabled', caption: '启用',   type: 'bool', mappings: { true: '是', false: '否' } },
  { field: 'created', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
  { field: 'actions', caption: '操作',   type: 'link',
    linkOption: { max: 3 },
    links: (record) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]
</script>
```

---

### MuTableEx

canvas 渲染的高性能表格：只绘制可视区域，适合大数据量；props / 事件 / 列配置与 `MuTable` 完全同源（上节全部适用），并扩展单元格编辑、列宽拖拽、树形展示及 `progress` / `button` 列类型。

> 仅 `mussel.ex` 版本包含此组件（`dist/mussel.ex.js` + `dist/mussel.ex.css`，基础版 `mussel.js` 不含）；`install` 用法与基础版相同，额外注册 `MuTableEx`。

与 `MuTable` 的差异：

- 组件自身 `width: 100%; height: 100%`，高度须由容器确定（flex 子项 / 固定高），内容区虚拟滚动。
- 列配置 `class` / `style` / `headerClass` / `headerStyle` / `title` 为 DOM 通道字段，不生效；`link` / `tag` 条目的 `class` / `style` 亦不生效，颜色经色名（`linkOption` / `tagOption` 及条目的 `color` / `danger`）生效。
- 点击可排序表头自动发 `update:order-by`（`field:asc → field:desc → ''` 循环），可 `v-model:order-by`。
- 组件不修改数据：勾选翻转与编辑提交均经 `update:cell-value` 通知，需由外部写回 `record`（写回后自动重绘该行）。

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

#### 扩展事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:order-by` | `orderBy` | 点击可排序表头，`field:asc → field:desc → ''` 循环 |
| `column-resize` | `{ column, width }` | 拖拽列宽结束 |
| `update:tree-expanded-keys` | `keys` | 树节点展开 / 收起 |
| `tree-expand` | `{ key, record, level }` | 展开箭头 toggle 展开（每次展开均发；`treeProps.isLeaf` 懒加载在此事件内异步取子级）|
| `tree-collapse` | `{ key, record, level }` | 展开箭头 toggle 收起 |
| `update:cell-value` | `{ record, recordIndex, column, value }` | check 翻转与编辑提交（较 `MuTable` 多 `recordIndex`）|
| `cell-item-click` | `{ record, recordIndex, column, link/tag/button }` | 条目点击（较 `MuTable` 多 `recordIndex`；`button` 列载荷为按钮配置项）|

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
| `editorButton` | Object | `{ icon, onClick }`：hover 时单元格右侧显示图标按钮（`icon` 为 SVG 字符串或图片 URL），点击回调 `({ record, recordIndex, column })`，不触发选中 / 编辑 |
| `maxLines` | Number | 文本最大行数（1–10）：`> 1` 时自动折行，超出省略；替代 `multiline` + `lineClamp`（两者仍兼容）|
| `maxItems` | Number | `link` / `tag` / `button` 条目最大显示数（1–10，默认 10），超出以 `...` 省略 |
| `resizable` | Boolean | `false` 禁止拖拽该列宽；`minWidth`（缺省 40）/ `maxWidth` 限制拖拽范围；固定列不可拖拽 |
| `treeNode` | Boolean | 树模式下显示展开箭头与缩进的列，缺省为首个非 `check` / `rec_no` 列 |
| `progressOption` | Object\|Function | `progress` 列：`{ color, showText }`，`color` 为主题色名（缺省 `primary`），`showText: false` 隐藏百分比；可为 `record => option` |
| `buttons` | Array\|Function | `button` 列：`[{ caption, color, disabled }]` 或 `record => 数组`，`color` 为主题色名 |

#### 扩展列类型

| 类型 | 说明 | 默认对齐 |
|------|------|---------|
| `progress` | 进度条，值 0–100，配合 `progressOption` | left |
| `button` | 轻量按钮组，配合 `buttons`；点击发 `cell-item-click`（载荷 `button`）| left |

#### 单元格编辑

- 开启条件：表格 `editable` + 列 `editor`；`rec_no` / `check` / `link` / `tag` / `img` / `button` / `progress` 列不可编辑。单击单元格进入编辑。
- 编辑器类型（`editor.type` 显式指定优先，可选 `input` / `select` / `date` / `switch` / `textarea`）：

| 列类型 | 缺省编辑器 |
|------|------|
| `text`（含未指定 `type`）| `input`；配置了 `mappings` / `options` 时为 `select`；值为数组或 `maxLines > 1` 时为 `textarea` |
| `number` / `currency` | `input`（`type="number"`）；配置了 `mappings` / `options` 时为 `select` |
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
  { field: 'status', caption: '状态', width: 100,
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
