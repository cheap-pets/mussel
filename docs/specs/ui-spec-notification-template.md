# UI Spec — 通知模板管理

> 本文档由用户填写 1–4 节，Agent 派生 5–7 节及示意图。

---

## 基本信息

| 项 | 值 |
|----|----|
| 页面名称（中文） | 通知模板管理 |
| page-name（kebab-case） | notification-template |
| 所属模块 | 消息中心 |
| 路由 | /message/notification-template |
| 参考页面（如有） | - |

---

## 1. 布局  `［用户填写 / 可贴图］`

**布局类型**：`split`

**区域嵌套关系**：

```yaml
layout-tree:
  page:
    - toolbar
    - content:
        direction: row
        children:
          - sidebar
          - main
```

**区域属性**：

| 区域名 | 位置 | 尺寸 | 固定 | 可调整 | 可滚动 | 说明 |
|--------|------|------|:----:|:------:|:------:|------|
| toolbar | top | 48px | ✓ | ✗ | ✗ | 工具栏：新建按钮 + 查询条件（关键词、状态） |
| sidebar | left | 220px | ✗ | ✓ | ✓ | 通知分类树，选中联动过滤主表 |
| main | center | auto | ✗ | ✗ | ✓ | 主表格 + 分页 |

**布局说明**：sidebar 可折叠收拢；toolbar 查询条件区与操作按钮在同一行。

**布局示意图**（Agent 派生）：

```
┌───────────────────────────────────────────────────────────────┐
│                            MuToolbar                          │
│                  ( search + [create] button )                 │
├───────────────────────┬───────────────────────────────────────┤
│                       │               MuTable                 │
│        MuTree         │            ( data-grid )              │
│      ( tree-view )    │                                       │
│                       ├───────────────────────────────────────┤
│                       │             MuPagination              │
└───────────────────────┴───────────────────────────────────────┘
        sidebar 220px                  main (auto)
```

---

## 2. 视图  `［用户填写 / 可贴图］`

### 2.1 视图清单

| 所属区域 | 视图类型 | 核心操作 | 分页 | 视图联动 | 说明 |
|---------|---------|---------|:----:|---------|------|
| sidebar | tree-view | — | — | select → 按 categoryId 过滤 main | 通知分类树 |
| main | data-grid | create, edit, delete, test-send | ✓ | — | 模板列表 |
| dialog | form-panel | — | — | create/edit 时弹出 | 新建/编辑模板表单 |

### 2.2 表格列（每个 data-grid 视图一组）

| 所属视图 | 字段名 | 列标题 | 列类型 | 列宽 | 对齐 | 可排序 | 可筛选 | 说明 |
|---------|--------|--------|--------|------|------|:------:|:------:|------|
| main | name | 模板名称 | text | 200 | left | ✓ | ✓ | |
| main | code | 模板编码 | text | 160 | left | ✓ | | 唯一 |
| main | categoryName | 分类 | tag | 120 | left | | ✓ | 来自树节点 |
| main | channel | 渠道 | enum | 100 | center | | ✓ | sms/email/push |
| main | status | 状态 | enum | 90 | center | ✓ | ✓ | enabled/disabled |
| main | updatedAt | 更新时间 | date | 160 | center | ✓ | | |
| main | action | 操作 | action | 140 | center | | | 编辑/测试发送/删除 |

### 2.3 树节点（每个 tree-view 视图一张）

**所属视图**：sidebar

| 节点字段 | 类型 | 说明 | 备注 |
|---------|------|------|------|
| id | string | 节点 ID | 主键 |
| name | string | 分类名称 | |
| parentId | string | 父节点 ID | |
| children | array | 子节点 | 一次性加载 |

**懒加载**：否
**字段映射**：key=`id`, label=`name`, children=`children`

**树交互**（勾选）：
- [✓] 选中联动（选中 → 按 categoryId 过滤主表）
- [ ] 勾选（多选）
- [ ] 拖拽排序
- [ ] 节点右键菜单
- [ ] 节点操作按钮（新增子节点/编辑/删除）

### 2.4 工具栏按钮（每个 toolbar 一组）

| 按钮名称 | action | 类型 | 图标 | 权限 | 说明 |
|---------|--------|------|------|------|------|
| 新建 | create | primary | plus | tpl:add | 打开新建弹窗 |
| 刷新 | refresh | icon | refresh | | 刷新列表 |
| 批量删除 | batch-delete | default | trash | tpl:delete | 需先选中行 |

### 2.5 表单字段（每个 form-panel / detail-panel 视图一张）

**所属视图**：dialog（新建/编辑）

| 字段名 | 标签 | 控件类型 | 必填 | 默认值 | 选项/字典 | 校验规则 | 说明 |
|--------|------|---------|:----:|--------|----------|---------|------|
| name | 模板名称 | input | ✓ | | | required, max:50 | |
| code | 模板编码 | input | ✓ | | | required, pattern:^[A-Z_]+$, max:30 | 大写+下划线 |
| categoryId | 分类 | select | ✓ | | /api/notification/categories | required | 联动树数据 |
| channel | 渠道 | radio | ✓ | sms | sms/email/push | required | |
| title | 标题 | input | ✓ | | | required, max:100 | 含变量占位符 |
| content | 正文 | textarea | ✓ | | | required, max:1000 | 含变量占位符 |
| status | 状态 | switch | ✓ | enabled | enabled/disabled | | |

### 2.6 筛选条件（每个搜索区一组）

**所属区域**：toolbar

| 字段名 | 标签 | 控件类型 | 默认值 | 联动 | 说明 |
|--------|------|---------|--------|------|------|
| keyword | 关键词 | input | | | 模糊搜索名称/编码 |
| status | 状态 | select | all | | enabled/disabled/all |

### 2.7 视图结构示意图（Agent 派生）

**data-grid（main）**：

```
┌──────┬────────────┬──────────┬─────────┬────────┬──────────┬──────────────────┐
│ id   │ name       │ code     │ category│ channel │ status   │ action           │
├──────┼────────────┼──────────┼─────────┼────────┼──────────┼──────────────────┤
│ 1    │ 验证码     │ VERIFY   │ 安全    │ sms    │ enabled  │ edit/test/delete │
│ 2    │ 欢迎通知   │ WELCOME  │ 账户    │ email  │ enabled  │ edit/test/delete │
│ ..   │ ..         │ ..       │ ..      │ ..     │ ..       │ ..               │
└──────┴────────────┴──────────┴─────────┴────────┴──────────┴──────────────────┘
```

**tree-view（sidebar）**：

```
- root
  + 安全通知
  - 账户通知
    + 注册欢迎
    + 密码重置
  + 营销通知
```

**form-panel（dialog）**：

```
┌─────────────────────────────────────────┐
│ name      [____________________________] │
│ code      [____________________________] │
│ category  ( select )                     │
│ channel   ( sms ) ( email ) ( push )     │
│ title     [____________________________] │
│ content   [____________________________] │
│           [____________________________] │
│ status    [ switch: on ]                 │
│                          [cancel] [save] │
└─────────────────────────────────────────┘
```

---

## 3. 数据实体与 API  `［用户填写］`

### 3.1 实体结构

**实体：NotificationTemplate**（主实体）

| 字段名 | 类型 | 说明 | 列表显示 | 表单编辑 |
|--------|------|------|:--------:|:--------:|
| id | string | 唯一标识 | ✗ | ✗ |
| name | string | 模板名称 | ✓ | ✓ |
| code | string | 模板编码（唯一） | ✓ | ✓ |
| categoryId | string | 分类 ID | ✗ | ✓ |
| categoryName | string | 分类名称（冗余） | ✓ | ✗ |
| channel | enum | sms/email/push | ✓ | ✓ |
| title | string | 标题（含变量） | ✗ | ✓ |
| content | string | 正文（含变量） | ✗ | ✓ |
| status | enum | enabled/disabled | ✓ | ✓ |
| createdAt | datetime | 创建时间 | ✗ | ✗ |
| updatedAt | datetime | 更新时间 | ✓ | ✗ |

**实体：NotificationCategory**（关联实体，树）

| 字段名 | 类型 | 说明 | 列表显示 | 表单编辑 |
|--------|------|------|:--------:|:--------:|
| id | string | 节点 ID | ✗ | ✗ |
| name | string | 分类名称 | ✓ | ✓ |
| parentId | string | 父节点 ID | ✗ | ✓ |

### 3.2 API

| 端点 | 方法 | 实体 | 说明 |
|------|------|------|------|
| /api/notification/templates | GET | NotificationTemplate | 列表查询（分页，支持 categoryId/keyword/status） |
| /api/notification/templates/:id | GET | NotificationTemplate | 详情 |
| /api/notification/templates | POST | NotificationTemplate | 新建 |
| /api/notification/templates/:id | PUT | NotificationTemplate | 编辑 |
| /api/notification/templates/:id | DELETE | NotificationTemplate | 删除 |
| /api/notification/templates/batch | POST | NotificationTemplate | 批量删除（body 传 ids） |
| /api/notification/templates/:id/test | POST | NotificationTemplate | 测试发送（body 传测试接收号） |
| /api/notification/categories | GET | NotificationCategory | 分类树（一次性） |

---

## 4. 其他  `［用户填写］`

| 类别 | 内容 |
|------|------|
| 特殊交互 | 表格行操作含"测试发送"（弹小窗输入测试号码后调 test API）；渠道枚举需带颜色 tag（sms=蓝/email=绿/push=橙） |
| 复用依赖 | - |
| 性能/其他 | 模板总数预计 <500，无需虚拟滚动 |

> 自定义组件统一登记在第 5 节。

---

## 5. 组件清单  `［Agent 派生，Phase 4］`

> 已对照 `mussel-ui` skill 的 references/components/*.md 核对，均为 MUSSEL 4 真实组件。

```yaml
components:                     # 声明式组件（在模板中书写）
  layout:
    - MuSplitHBox             # 左右分隔（sidebar | main），toolbar 通栏顶部
    - MuVBox                  # 主区纵向（toolbar 在上，表格+分页在下）
    - MuToolbar               # 工具栏容器
  toolbar:
    - MuButton                # 新建（primary）
    - MuIconButton            # 刷新（icon）
    - MuButton                # 批量删除（default）
    - MuInput                 # 关键词搜索
    - MuSelect                # 状态筛选
  sidebar:
    - MuTree + MuTreeNode     # 分类树（一次性加载、选中联动）
  main:
    - MuTable                 # 主表格（列类型见 2.2）
    - MuPagination            # 分页（与 MuTable 平级）
  dialog:                     # 新建/编辑弹窗
    - MuDialog                # 弹窗容器
    - MuForm + MuFormField    # 表单容器与字段
    - MuInput                 # 名称/编码/标题输入
    - MuSelect                # 分类选择
    - MuRadioGroup + MuRadio  # 渠道单选
    - MuInput                 # 正文（type=textarea/memo，MUSSEL 4 无独立 Textarea）
    - MuSwitch                # 状态开关
  row-action:
    - MuDropdown              # 编辑/测试发送/删除下拉
  test-send:                  # 测试发送小窗（复用 MuDialog）
    - MuDialog
    - MuInput                 # 测试接收号
  feedback:                   # 占位组件（在模板中书写）
    - MuStatusBox             # 列表空数据 / 加载失败占位
```

**命令式 API**（通过 `inject('$mussel')` 调用，不在模板书写）：

| API | 用途 | 调用场景 |
|-----|------|---------|
| `messageBox.confirm` | 确认对话框 | 删除/批量删除前确认 |
| `messageBox.notify` | 浮动通知 | 新建/编辑/删除/测试发送结果提示 |

**自定义组件**（MUSSEL 4 未提供）：

| 组件名 | 说明 | 原因 + 降级方案 |
|--------|------|----------------|
| VariableHighlightInput | 变量占位符 `${var}` 高亮编辑器 | MUSSEL 4 无富文本/语法高亮输入组件；可降级为普通 `MuInput` + 说明文字，首版可不实现 |

---

## 6. 文件树  `［Agent 派生，Phase 5］`

```
src/pages/notification-template/
├── index.js                    # 页面入口，组合 MuSplitHBox(toolbar + sidebar + main)
├── views/
│   ├── main-view.vue           # 主视图：MuTable + MuPagination
│   ├── category-tree.vue       # 侧边分类树
│   └── template-form.vue       # 新建/编辑表单（dialog 内容）
└── stores/
    ├── store.js                # 主 store：列表/分页/查询/弹窗状态 + 模板 CRUD API
    └── category-store.js       # 分类树 store：树数据 + 分类 API
```

> 拆分理由：模板 CRUD 与分类树是两个独立业务域，分类树数据被 sidebar 和 form 的 categoryId select 共享，单独 store 更清晰。

---

## 7. Store 职责  `［Agent 派生，Phase 5］`

```js
// src/pages/notification-template/stores/store.js
import { defineStore } from 'pinia'
import { request } from '@/utils/request'

export const useTemplateStore = defineStore('notification-template', {
  state: () => ({
    tableData: [],
    total: 0,
    loading: false,
    queryParams: {
      page: 1,
      pageSize: 20,
      keyword: '',
      status: 'all',
      categoryId: null,     // 由 sidebar 树选中联动写入
    },
    dialogVisible: false,
    editingRecord: null,    // null = 新建，有值 = 编辑
    testDialogVisible: false,
    editingId: null,
  }),
  actions: {
    async fetchList() {
      this.loading = true
      try {
        const { data, total } = await request.get(
          '/api/notification/templates',
          { params: this.queryParams }
        )
        this.tableData = data
        this.total = total
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      await request.post('/api/notification/templates', payload)
    },
    async update(id, payload) {
      await request.put(`/api/notification/templates/${id}`, payload)
    },
    async remove(id) {
      await request.delete(`/api/notification/templates/${id}`)
    },
    async batchRemove(ids) {
      await request.post('/api/notification/templates/batch', { ids })
    },
    async testSend(id, receiver) {
      await request.post(`/api/notification/templates/${id}/test`, { receiver })
    },
  },
})
```

```js
// src/pages/notification-template/stores/category-store.js
import { defineStore } from 'pinia'
import { request } from '@/utils/request'

export const useCategoryStore = defineStore('notification-category', {
  state: () => ({
    treeData: [],
    selectedNodeId: null,
  }),
  actions: {
    async fetchTree() {
      this.treeData = await request.get('/api/notification/categories')
    },
  },
})
```
