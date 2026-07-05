# UI Spec — [页面名称]

> **使用说明**
> - 本文档既是**输入**（用户填写 1–4 节）也是**输出**（Agent 在 5–7 节派生补全）。
> - 用户填写部分**尽量用表格**（比 YAML 更易读易填）；Agent 派生部分含 ASCII 示意图与代码块。
> - 占位符 `[...]` 填实际内容；不需要的项留 `-` 或空。
> - **布局和视图也可用图片代替**：若有设计草图/截图，直接贴图或填路径，跳过对应表格填写；Agent 会解析图片转结构化后请你确认。字段名、API 等业务语义图片看不出，仍需文字补充。
> - **也可从现有代码反向生成**：提供已实现页面的源码路径，Agent 按反向规则转写代码现状填入 1–7 节（忠实转写，代码缺失的部分留空标 `-`）。详见 SKILL.md「渠道 ④ 现有代码」与 `code-reverse.md`。

---

## 基本信息

| 项 | 值 |
|----|----|
| 页面名称（中文） | [如：部门管理] |
| page-name（kebab-case） | [如：department]  ← 同时作为文件名与代码目录名 |
| 所属模块 | [如：系统管理] |
| 路由 | /[module]/[page] |
| 参考页面（如有） | [如：组织架构页] |
| 来源 | `规划` / `设计图` / `代码逆向`  ← 标注本 spec 由何种方式生成 |

---

## 1. 布局  `［用户填写 / 可贴图］`

**布局类型**：`split` | `full` | `master-detail` | `modal` | `custom` → [填]

**区域嵌套关系**（缩进表示父子包含，体现区域如何组合）：

```yaml
layout-tree:
  page:                  # 页面根
    - toolbar            # 顶部工具栏（横向通栏）
    - content:           # toolbar 下方的内容区
        direction: row   # row=横向排列 | column=纵向排列
        children:
          - sidebar      # 左侧树
          - main         # 主内容（含表格+分页）
```

> 说明：缩进表达"谁包含谁"；`direction` 表达同级子区域的排列方向。复杂布局可多层嵌套（如 main 内再套 tabs + 表格）。

**区域属性**（每个区域的细节，与上方树节点一一对应）：

| 区域名 | 位置 | 尺寸 | 固定 | 可调整 | 可滚动 | 说明 |
|--------|------|------|:----:|:------:|:------:|------|
| toolbar | top | 48px | ✓ | ✗ | ✗ | 工具栏，含操作按钮和搜索 |
| sidebar | left | 240px | ✗ | ✓ | ✓ | 左侧树形导航 |
| main | center | auto | ✗ | ✗ | ✓ | 主内容区，含表格和分页 |

> 位置：`top` / `bottom` / `left` / `center` / `right`；三栏布局可用 left+center+right。固定/可调整/可滚动用 ✓/✗。

**布局说明**（可选）：[如：sidebar 可折叠；main 内含 tabs]

**布局示意图**（Agent 派生）：

```
┌───────────────────────────────────────────────────────────────┐
│                            MuToolbar                          │
├───────────────────────┬───────────────────────────────────────┤
│                       │               MuTable                 │
│        MuTree         │            ( data-grid )              │
│      ( tree-view )    ├───────────────────────────────────────┤
│                       │             MuPagination              │
└───────────────────────┴───────────────────────────────────────┘
        sidebar 240px                  main (auto)
```

---

## 2. 视图  `［用户填写 / 可贴图］`

### 2.1 视图清单

| 所属区域 | 视图类型 | 核心操作 | 分页 | 视图联动 | 说明 |
|---------|---------|---------|:----:|---------|------|
| sidebar | tree-view | — | — | select → 过滤 main | 分类树 |
| main | data-grid | create,edit,delete,export | ✓ | — | 主表格 |
| modal | form-panel | — | — | create/edit 时弹出 | 新建/编辑表单 |

> 视图类型：`data-grid` `tree-view` `card-grid` `list-view` `form-panel` `detail-panel` `master-detail` `tabs-view` `steps-view` `accordion` `dashboard` `chart-view` `calendar-view` `gantt-view` `empty-state` `loading-state` `error-state`

### 2.2 表格列（每个 data-grid 一组）

| 所属视图 | 字段名 | 列标题 | 列类型 | 列宽 | 对齐 | 可排序 | 可筛选 | 说明 |
|---------|--------|--------|--------|------|------|:------:|:------:|------|
| main | name | 名称 | text | 160 | left | ✓ | ✓ | |
| main | status | 状态 | enum | 100 | center | ✓ | ✓ | active/inactive |
| main | createdAt | 创建时间 | date | 160 | center | ✓ | | |
| main | action | 操作 | action | 120 | center | | | 行操作：编辑/删除 |

> 列类型：`text` `enum` `date` `number` `tag` `link` `action`

### 2.3 树节点（每个 tree-view 一组）

**所属视图**：[如：sidebar]

| 节点字段 | 类型 | 说明 | 备注 |
|---------|------|------|------|
| id | string | 节点 ID | 主键 |
| name | string | 显示名称 | |
| parentId | string | 父节点 ID | |
| children | array | 子节点 | 懒加载可不返回 |

**懒加载**：[否 / 是，loadApi: GET /api/...]
**字段映射**：key=`id`, label=`name`, children=`children`

**树交互**（勾选）：
- [ ] 选中联动（选中 → 过滤主表）
- [ ] 勾选（多选）
- [ ] 拖拽排序
- [ ] 节点右键菜单
- [ ] 节点操作按钮（新增子节点/编辑/删除）

### 2.4 工具栏按钮（每个 toolbar 一组）

| 按钮名称 | action | 类型 | 图标 | 权限 | 说明 |
|---------|--------|------|------|------|------|
| 新建 | create | primary | plus | dept:add | 打开新建弹窗 |
| 导出 | export | default | download | dept:export | 导出当前筛选结果 |
| 刷新 | refresh | icon | refresh | | 刷新列表 |
| 批量删除 | batch-delete | default | trash | dept:delete | 需先选中行 |

> 类型：`primary` / `default` / `text` / `icon`

### 2.5 表单字段（每个 form-panel / detail-panel 一组）

**所属视图**：[如：modal（新建/编辑）]

| 字段名 | 标签 | 控件类型 | 必填 | 默认值 | 选项/字典 | 校验规则 | 说明 |
|--------|------|---------|:----:|--------|----------|---------|------|
| name | 名称 | input | ✓ | | | required, max:50 | |
| code | 编码 | input | ✓ | | | required, pattern:^[A-Z]+$ | |
| parentId | 上级 | select | | root | /api/departments/tree | | 联动树数据 |
| status | 状态 | radio | ✓ | active | active/inactive | | |
| description | 说明 | textarea | | | | max:200 | |

> 控件类型：`input` `textarea` `number` `select` `multi-select` `combo` `date` `time` `switch` `radio` `check`
> （级联 `cascader` MUSSEL 4 未提供，需登记为自定义组件）

### 2.6 筛选条件（每个搜索区一组）

**所属区域**：[如：toolbar]

| 字段名 | 标签 | 控件类型 | 默认值 | 联动 | 说明 |
|--------|------|---------|--------|------|------|
| keyword | 关键词 | input | | | 模糊搜索名称/编码 |
| status | 状态 | select | all | | active/inactive/all |
| dateRange | 创建时间 | date | | | 区间筛选 |

### 2.7 视图结构示意图（Agent 派生）

> 对 data-grid / tree-view / form-panel / detail-panel / tabs-view / steps-view / accordion 类型视图，Agent 在此补 ASCII 示意图；渲染型/状态型不画。

```
（由 Agent 按视图类型补全，规则见 SKILL.md Phase 2）
```

---

## 3. 数据实体与 API  `［用户填写］`

### 3.1 实体结构（每个实体一张表）

**实体：Department**（主实体）

| 字段名 | 类型 | 说明 | 列表显示 | 表单编辑 |
|--------|------|:------|:--------:|:--------:|
| id | string | 唯一标识 | ✗ | ✗ |
| name | string | 名称 | ✓ | ✓ |
| code | string | 编码 | ✓ | ✓ |
| parentId | string | 上级 ID | ✗ | ✓ |
| status | enum | active/inactive | ✓ | ✓ |
| createdAt | datetime | 创建时间 | ✓ | ✗ |

> 多实体复制上方表格；"列表显示/表单编辑"用 ✓/✗，用于推导表格列与表单字段。

### 3.2 API

| 端点 | 方法 | 实体 | 说明 |
|------|------|------|------|
| /api/departments | GET | Department | 列表查询（分页） |
| /api/departments/:id | GET | Department | 详情 |
| /api/departments | POST | Department | 新建 |
| /api/departments/:id | PUT | Department | 编辑 |
| /api/departments/:id | DELETE | Department | 删除 |
| /api/departments/batch | POST | Department | 批量删除（body 传 ids） |
| /api/departments/export | GET | Department | 导出 |

> 每个 API 一行；非常规接口（批量/导入/导出）也列在此。

---

## 4. 其他  `［用户填写］`

| 类别 | 内容 |
|------|------|
| 特殊交互 | [如：表格行拖拽排序；树节点右键菜单] |
| 复用依赖 | [如：复用 user 页面的 user-store.js] |
| 性能/其他 | [如：列表数据量大，需虚拟滚动] |

> 自定义组件统一登记在第 5 节"自定义组件"表，不在此处重复。

---

## 5. 组件清单  `［Agent 派生，Phase 4］`

> 组件名必须为 MUSSEL 4 真实存在的组件，对照 `mussel-ui` skill 的 `references/components/*.md`。
> 用 YAML 表达"区域 → 组件"的层级分组，用途跟在组件名后注释。

```yaml
components:                     # 声明式组件（在模板中书写、需注册）
  layout:                       # 整体骨架（按布局嵌套关系选配）
    - MuSplitHBox               # 左右分隔（resizable/collapsible）
    - MuVBox                    # 纵向布局
    - MuToolbar                 # 工具栏容器
  toolbar:
    - MuButton                  # 操作按钮
    - MuIconButton              # 图标按钮（刷新等）
    - MuInput                   # 查询条件
    - MuSelect                  # 状态筛选
  sidebar:
    - MuTree + MuTreeNode       # 分类树
  main:
    - MuTable                   # 主数据表格
    - MuPagination              # 分页（与 MuTable 平级）
  modal:                        # 弹窗（或 drawer，二选一）
    - MuDialog                  # 新建/编辑弹窗容器
    - MuForm + MuFormField      # 表单容器与字段
  row-action:
    - MuDropdown                # 行内操作下拉菜单
  feedback:                     # 占位组件（在模板中书写）
    - MuStatusBox               # 空/加载失败/无权限占位视图
```

**命令式 API**（通过 `inject('$mussel')` 在代码中调用，不在模板书写）：

| API | 用途 | 调用场景 |
|-----|------|---------|
| `messageBox.confirm` | 确认对话框（返回 Promise） | 删除/批量删除前确认 |
| `messageBox.notify` | 浮动通知（自动消失） | 新建/编辑/删除等操作结果提示 |

**自定义组件**（MUSSEL 4 未提供，用表格补充说明原因与降级方案）：

| 组件名 | 说明 | 原因 + 降级方案 |
|--------|------|----------------|
| — | — | — |

---

## 6. 文件树  `［Agent 派生，Phase 5］`

```
src/pages/[page-name]/
├── index.js                    # 页面入口，组合布局、编排子视图
├── views/
│   ├── main-view.vue           # 主视图（文件名固定）
│   ├── [view-name].vue         # 其他视图，kebab-case（按需）
│   └── ...
└── stores/
    └── store.js                # Pinia Store（不拆分时固定；API 内联其中）
```

> 跨页面公共组件（≥2 页面复用时）：`src/common/components/[component-name]/`

---

## 7. Store 职责  `［Agent 派生，Phase 5］`

```js
// src/pages/[page-name]/stores/store.js
import { defineStore } from 'pinia'
import { request } from '@/utils/request'

export const usePageStore = defineStore('page', {
  state: () => ({
    tableData: [],
    total: 0,
    loading: false,
    queryParams: { page: 1, pageSize: 20, keyword: '' },
    modalVisible: false,
    editingRecord: null,
  }),
  actions: {
    async fetchList() { /* ... */ },
    async create(payload) { /* ... */ },
    async update(id, payload) { /* ... */ },
    async remove(id) { /* ... */ },
  },
})
```
