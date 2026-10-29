<script setup>
  import { ref } from 'vue'

  const selectedKey = ref(null)
  const orderBy = ref('')

  const STATUS = { active: '进行中', pending: '待处理', archived: '已归档' }

  function createRecords (count = 500) {
    return Array.from({ length: count }, (el, i) => ({
      id: i + 1,
      name: `项目 ${String(i + 1).padStart(3, '0')}`,
      owner: `成员 ${i % 20 + 1}`,
      status: ['active', 'pending', 'archived'][i % 3],
      progress: (i * 37) % 101,
      updatedAt: `2026-${String(i % 12 + 1).padStart(2, '0')}-15`
    }))
  }

  const records = ref(createRecords())

  const basicColumns = [
    { type: 'rec_no', width: 56 },
    { field: 'name', caption: '名称', sortable: true, minWidth: 140 },
    { field: 'owner', caption: '负责人', width: 100 },
    { field: 'status', caption: '状态', width: 90, mappings: STATUS },
    { field: 'progress', caption: '进度', type: 'progress', width: 150 },
    { field: 'updatedAt', caption: '更新日期', type: 'date', width: 110 }
  ]

  // —— 编辑演示 ——
  const editRecords = ref([
    { id: 1, name: '登录页改版', status: 'active', count: 12, date: '2026-03-18', active: true, memo: '含扫码登录与国际化' },
    { id: 2, name: '报表导出', status: 'pending', count: 3, date: '2026-04-02', active: false, memo: '' },
    { id: 3, name: '权限重构', status: 'archived', count: 25, date: '2026-05-11', active: true, memo: '角色模型拆分\n支持数据行级权限' }
  ])

  const editColumns = [
    { field: 'name', caption: '名称', sortable: true, minWidth: 120, editor: true },
    { field: 'status', caption: '状态', width: 110, mappings: STATUS, editor: true },
    {
      field: 'count',
      caption: '数量',
      type: 'number',
      width: 100,
      editor: { validate: v => (v >= 0 ? true : '不能为负数') }
    },
    { field: 'date', caption: '日期', type: 'date', width: 130, editor: true },
    { field: 'active', caption: '启用', type: 'bool', width: 80, editor: true },
    { field: 'memo', caption: '备注', width: 220, maxLines: 2, editor: true },
    {
      caption: '操作',
      type: 'button',
      width: 150,
      buttons: record => [
        { caption: '查看', color: 'primary' },
        { caption: '删除', color: 'danger', disabled: record.active }
      ]
    }
  ]

  function onCellValue ({ record, column, value }) {
    record[column.field] = value
  }

  // —— 树演示 ——
  const treeRecords = ref([
    { id: 1, parentId: null, name: '华东大区', owner: '成员 1', progress: 80 },
    { id: 2, parentId: 1, name: '上海', owner: '成员 2', progress: 60 },
    { id: 7, parentId: 2, name: '浦东新区', owner: '成员 3', progress: 30 },
    { id: 3, parentId: 1, name: '杭州', owner: '成员 4', progress: 45 },
    { id: 4, parentId: null, name: '华南大区', owner: '成员 5', progress: 65 },
    { id: 5, parentId: 4, name: '深圳', owner: '成员 6', progress: 50 },
    { id: 6, parentId: 4, name: '广州', owner: '成员 7', progress: 40 }
  ])

  // 受控初始展开集（传入引用即接管展开状态，default-expand-level 不再生效）
  const treeExpandedKeys = ref([1, 4])

  const treeColumns = [
    { field: 'name', caption: '名称', minWidth: 160 },
    { field: 'owner', caption: '负责人', width: 100 },
    { field: 'progress', caption: '进度', type: 'progress', width: 150 }
  ]
</script>

# 表格 MuTableEx

canvas 渲染的高性能表格：只绘制可视区域，适合大数据量。属性 / 事件 / 列配置与 [MuTable](./table) 完全同源，并扩展单元格编辑、列宽拖拽、树形展示及 `progress` / `button` 列类型。

> [!IMPORTANT]
>
> 仅 `mussel.ex` 版本包含此组件（`dist/mussel.ex.js` + `dist/mussel.ex.css`，基础版 `mussel.js` 不含）。`install` 用法与基础版相同，引入 ex 版后即可使用：
>
> ```javascript
> import { install } from 'mussel/dist/mussel.ex.js'
> import 'mussel/dist/mussel.ex.css'
> ```

## 基础用法

组件自身 `width: 100%; height: 100%`，高度须由容器确定（下方演示容器固定 320px）。500 行数据下滚动、hover、排序均只重绘可视区域：

<ClientOnly>
  <!-- canvas 尺寸依赖容器测量，SSR 无法布局，需 ClientOnly -->
  <div class="mu-demo-panel">
    <mu-table-ex
      :records="records"
      :columns="basicColumns"
      key-field="id"
      striped
      hover-mode="cross"
      :fixed-left-columns="2"
      resizable
      v-model:order-by="orderBy"
      v-model:selected-record-key="selectedKey" />
  </div>
</ClientOnly>

```html
<div style="height: 320px;">
  <mu-table-ex
    :records="records"
    :columns="columns"
    key-field="id"
    striped
    :fixed-left-columns="2"
    resizable
    v-model:order-by="orderBy"
    v-model:selected-record-key="selectedKey" />
</div>
```

```javascript
const columns = [
  { type: 'rec_no', width: 56 },
  { field: 'name', caption: '名称', sortable: true, minWidth: 140 },
  { field: 'owner', caption: '负责人', width: 100 },
  { field: 'status', caption: '状态', width: 90,
    mappings: { active: '进行中', pending: '待处理', archived: '已归档' } },
  { field: 'progress', caption: '进度', type: 'progress', width: 150 },
  { field: 'updatedAt', caption: '更新日期', type: 'date', width: 110 }
]
```

- 点击可排序表头自动发 `update:order-by`（`field:asc → field:desc → 清空` 循环），可 `v-model:order-by` 接管排序状态。
- `progress` 列为 canvas 扩展类型，配合 `progressOption`（`{ color, showText }`，`color` 为主题色名）。

## 单元格编辑

表格 `editable` + 列 `editor` 开启编辑，单击单元格进入。编辑器按列类型自动选择（`text` → `input`、配 `mappings` / `options` → `select`、`date` → `date`、`bool` → `switch`、`maxLines > 1` → `textarea`），也可经 `editor.type` / `editor.props` 定制。

组件不修改数据：提交经 `update:cell-value` 通知，外部写回 `record` 后自动重绘该行。

<ClientOnly>
  <div class="mu-demo-panel">
    <mu-table-ex
      :records="editRecords"
      :columns="editColumns"
      key-field="id"
      editable
      @update:cell-value="onCellValue" />
  </div>
</ClientOnly>

```javascript
const columns = [
  { field: 'name', caption: '名称', editor: true },
  { field: 'status', caption: '状态', width: 110,
    mappings: { active: '进行中', pending: '待处理' }, editor: true },   // select 编辑器
  { field: 'count', caption: '数量', type: 'number', width: 100,
    editor: { validate: v => (v >= 0 ? true : '不能为负数') } },          // 校验失败标红不关闭
  { field: 'date', caption: '日期', type: 'date', width: 130, editor: true },
  { field: 'active', caption: '启用', type: 'bool', width: 80, editor: true },
  { field: 'memo', caption: '备注', width: 220, maxLines: 2, editor: true },  // textarea
  { caption: '操作', type: 'button', width: 150,
    buttons: record => [
      { caption: '查看', color: 'primary' },
      { caption: '删除', color: 'danger', disabled: record.active }
    ] }
]

// 组件不改数据：提交后由外部写回
function onCellValue ({ record, column, value }) {
  record[column.field] = value
}
```

## 树模式

`tree` 开启后按 `tree-props`（`{ key, parentKey }`，缺省 `{ key: keyField ?? 'id', parentKey: 'parentId' }`）从平铺 `records` 构建层级；展开箭头缺省落在首个数据列（`treeNode: true` 显式指定）。展开状态两种控制方式：

- `default-expand-level`：初始展开层级（0 基，`level <= 值` 的节点展开，`-1` 全收起），之后由组件内部维护。
- `tree-expanded-keys` 双向绑定：传入数组即接管展开状态（此时 `default-expand-level` 不生效）。

<ClientOnly>
  <div class="mu-demo-panel">
    <mu-table-ex
      :records="treeRecords"
      :columns="treeColumns"
      key-field="id"
      tree
      :tree-props="{ key: 'id', parentKey: 'parentId' }"
      v-model:tree-expanded-keys="treeExpandedKeys" />
  </div>
  <p class="text-subtle">展开节点 key：{{ treeExpandedKeys.join(', ') || '（无）' }}</p>
</ClientOnly>

```html
<!-- 按层级初始展开 -->
<mu-table-ex :records="records" :columns="columns" key-field="id" tree :default-expand-level="1" />

<!-- 受控展开集 -->
<mu-table-ex
  :records="records"
  :columns="columns"
  key-field="id"
  tree
  :tree-props="{ key: 'id', parentKey: 'parentId' }"
  v-model:tree-expanded-keys="treeExpandedKeys" />
```

全部展开 / 收起经 ref 调用 `expandAll()` / `collapseAll()`。

## 与 MuTable 的差异

- 组件自身 `width: 100%; height: 100%`，高度须由容器确定，内容区虚拟滚动。
- 列配置 `class` / `style` / `headerClass` / `headerStyle` / `title` 为 DOM 通道字段，不生效；`link` / `tag` 条目的 `class` / `style` 亦不生效，颜色经色名（`linkOption` / `tagOption` 及条目的 `color` / `danger`）生效。
- 点击可排序表头自动发 `update:order-by`，排序状态可双向绑定。
- 组件不修改数据：勾选翻转与编辑提交均经 `update:cell-value` 通知，需由外部写回 `record`（写回后自动重绘该行）。
- 就地修改 `records` 内容（引用未变）后，递增 `records-version` 触发整幅重绘。

## API

以下为在 [MuTable](./table) 基础上的扩展项，MuTable 的全部属性 / 事件 / 列配置同样适用。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `empty-text` | String | `''` | 无数据占位文本（也可用 `empty` 插槽）|
| `records-version` | Number | `0` | 就地修改 `records` 内容后递增，触发整幅重绘 |
| `editable` | Boolean | `false` | 表格级编辑开关；列须同时配置 `editor` |
| `resizable` | Boolean | `false` | 表头拖拽调整列宽；列级 `resizable: false` 可单独禁止 |
| `tree` | Boolean | `false` | 树模式：按 `tree-props` 从平铺 `records` 构建层级 |
| `tree-props` | Object | — | `{ key, parentKey }`，缺省 `{ key: keyField ?? 'id', parentKey: 'parentId' }` |
| `tree-expanded-keys` | Array | — | 展开节点 key（双向绑定；传入即接管展开状态，`default-expand-level` 不生效）|
| `default-expand-level` | Number | `0` | 初始展开层级（0 基：`level <= 值` 的节点展开；`-1` 全收起）|

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:order-by` | `orderBy` | 点击可排序表头，`field:asc → field:desc → ''` 循环 |
| `column-resize` | `{ column, width }` | 拖拽列宽结束 |
| `update:tree-expanded-keys` | `keys` | 树节点展开 / 收起 |
| `update:cell-value` | `{ record, recordIndex, column, value }` | check 翻转与编辑提交（较 MuTable 多 `recordIndex`）|
| `cell-item-click` | `{ record, recordIndex, column, link/tag/button }` | 条目点击（较 MuTable 多 `recordIndex`；`button` 列载荷为按钮配置项）|

| 插槽 | 说明 |
|------|------|
| `empty` | 无数据占位内容（缺省显示 `empty-text`）|

### 方法（通过 ref 调用）

| 方法 | 说明 |
|------|------|
| `scrollToRecord(keyOrIndex)` | 滚动到指定行（优先按 key 匹配，其次行号），返回是否成功 |
| `expandAll()` / `collapseAll()` | 树模式全部展开 / 收起 |
| `getTreeExpandedKeys()` | 当前展开 key 数组 |
| `refreshTheme()` | 重读 `--mu-*` 变量并重绘（运行时覆盖主题 / 尺寸变量后调用）|
| `getCellRect(row, col)` | 单元格矩形（视口坐标），自动化测试用 |
| `getLayoutInfo()` / `getThemeSnapshot()` | 布局 / 主题快照，调试用 |

### Column 扩展配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `editable` | Boolean | 列级编辑开关，`false` 关闭 |
| `editor` | Boolean\|Object | 编辑器配置：`true` 按列类型自动选择；对象 `{ type, props, validate, border }`，见下 |
| `editorButton` | Object | `{ icon, onClick }`：hover 时单元格右侧显示图标按钮（`icon` 为 SVG 字符串或图片 URL），点击回调 `({ record, recordIndex, column })`，不触发选中 / 编辑 |
| `maxLines` | Number | 文本最大行数（1–10）：`> 1` 时自动折行，超出省略；替代 `multiline` + `lineClamp`（两者仍兼容）|
| `maxItems` | Number | `link` / `tag` / `button` 条目最大显示数（1–10，默认 10），超出以 `...` 省略 |
| `resizable` | Boolean | `false` 禁止拖拽该列宽；`minWidth`（缺省 40）/ `maxWidth` 限制拖拽范围；固定列不可拖拽 |
| `treeNode` | Boolean | 树模式下显示展开箭头与缩进的列，缺省为首个非 `check` / `rec_no` 列 |
| `progressOption` | Object\|Function | `progress` 列：`{ color, showText }`，`color` 为主题色名（缺省 `primary`），`showText: false` 隐藏百分比；可为 `record => option` |
| `buttons` | Array\|Function | `button` 列：`[{ caption, color, disabled }]` 或 `record => 数组`，`color` 为主题色名 |

### 扩展列类型

| 类型 | 说明 | 默认对齐 |
|------|------|---------|
| `progress` | 进度条，值 0–100，配合 `progressOption` | left |
| `button` | 轻量按钮组，配合 `buttons`；点击发 `cell-item-click`（载荷 `button`）| left |

## 单元格编辑器

开启条件：表格 `editable` + 列 `editor`；`rec_no` / `check` / `link` / `tag` / `img` / `button` / `progress` 列不可编辑，单击单元格进入编辑。

编辑器类型（`editor.type` 显式指定优先，可选 `input` / `select` / `date` / `switch` / `textarea`）：

| 列类型 | 缺省编辑器 |
|------|------|
| `text`（含未指定 type）| `input`；配置了 `mappings` / `options` 时为 `select`；值为数组或 `maxLines > 1` 时为 `textarea` |
| `number` / `currency` | `input`（`type="number"`）；配置了 `mappings` / `options` 时为 `select` |
| `date` / `datetime` | `date` |
| `bool` | `switch` |

- `editor.props`：透传给编辑器组件（`mu-input` / `mu-select` / `mu-date-input` / `mu-switch` / 原生 `textarea`）。`select` 的选项来源优先级：`editor.props.options` > 列 `options` > 由 `mappings` 派生（排除 `default`）。
- `editor.validate(value, { record, column })`：返回 `true` 通过；返回字符串作为错误提示，编辑器标红且不关闭。
- `editor.border: false`：无边框编辑器。
- 提交：`input` 按 Enter；`textarea` 按 Ctrl/Cmd+Enter（Enter 换行）；`select` / `date` / `switch` 值变化即提交；失焦、滚动、点击其他单元格自动提交；Esc 取消。
- 提交值规整：`number` / `currency` 收敛为 number（空值 → `null`）；`textarea` 原值为数组时按换行拆分回数组。
