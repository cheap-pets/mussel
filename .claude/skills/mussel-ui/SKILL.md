---
name: mussel-ui
description: >
  编写或修改使用 MUSSEL 4 组件库的 Vue 界面代码时使用，
  包括新建页面、调整已有 UI、Review 代码合规性。
  用户明确要求将 Mussel 3 代码升级到 Mussel 4 时也必须使用，
  例如："升级到 Mussel 4"、"迁移到新版 Mussel"。
---

# MUSSEL 4 开发 Skill

## 硬性禁止

生成代码前必须确认以下五条，任意一条违反均会导致 Review 不通过：

| # | 禁止内容 | 应替换为 |
|---|---------|---------|
| 1 | 硬编码颜色（`#xxx` / `rgb()` / `red` 等） | `--mu-color-*` CSS 变量 |
| 2 | 手写 z-index 数字 | `--mu-z-index-*` 变量 |
| 3 | 非 8px 体系间距（`12px` / `6px` 等） | 8px 基准倍数值 |
| 4 | 能用原子类解决的布局却写 `style` 属性 | 对应原子类 |
| 5 | 自造 `--mu-*` 变量 | 规范中已定义的变量 |

> 完整规范细则与 Good/Bad 示例：`references/principles.md`

---

## 工作流程

### 步骤 1：识别任务类型

- **Mussel 3 → 4 升级**：用户明确要求升级或迁移到 Mussel 4
  → **先读 `references/mussel3-to-mussel4.md`，再按该文件流程执行，不走后续步骤**
- **新建 / 修改 UI** → 继续步骤 2

### 步骤 2：识别组件，查阅 API

对照下方「组件速查表」确认用哪些组件，然后**按需读取对应参考文件**（不要凭记忆猜测属性名）：

| 组件类型 | 参考文件 |
|---------|---------|
| 布局 / 图标 / 按钮 / 导航 / 列表 / 树 / 标签 / 反馈 | `references/components.md` |
| 模态框 / 抽屉 | `references/dialog.md` |
| 表单 / 输入 | `references/form.md` |
| 表格 | `references/table.md` |

### 步骤 3：确认样式

涉及颜色、间距、原子类、布局模式时，读取 `references/styles.md`。

### 步骤 4：生成并自检

对照顶部「硬性禁止」逐条过一遍；完整 Checklist 见 `references/principles.md`。

---

## 组件速查表

> 只列选型决策。完整 Props / Events / Slots API 见上方参考文件，**不要用本节替代查阅 API**。

### 布局容器

| 需求 | 组件 |
|------|------|
| 水平排列 | `<mu-h-box>` |
| 垂直排列 | `<mu-v-box>` |
| 网格布局 | `<mu-grid-box>` + `<mu-grid-cell>` |
| 可拖拽分隔 | `<mu-flex-splitter>`（只能在 flex 容器内） |
| 弹性分隔线 | `<mu-flex-divider>` |
| 弹性占位 | `<mu-flex-space>` |
| 弹性换行 | `<mu-flex-break>` |
| 自定义滚动条 | `<mu-scroll-box>` 或 `v-mu-scrollbar` 指令 |
| 条纹背景 | `<mu-svg-stripe>`（`direction`: horizontal / vertical） |

### 导航栏 / 工具栏

| 需求 | 组件 |
|------|------|
| 通用条形容器 | `<mu-bar>` |
| 工具栏 | `<mu-toolbar>` |
| 页签切换 | `<mu-tabs>` + `<mu-tab-panel>`；独立页签栏用 `<mu-tab-bar>` |
| 分页器 | `<mu-pagination>`（支持 `quick-jumper`、`page-size-options`） |

### 按钮

| 需求 | 组件 |
|------|------|
| 常规按钮 | `<mu-button>` |
| 按钮组 | `<mu-button-group>` |
| 纯图标按钮（工具栏专用，不支持文字） | `<mu-tool-button>` |
| 带下拉的按钮 | `<mu-dropdown-button>`（分割形式加 `split-button`） |

### 输入组件

| 场景 | 组件 |
|------|------|
| 文本 / 数字 / 密码 | `<mu-input>` |
| 单选下拉（不可输入） | `<mu-select>` |
| 单选下拉（可手动输入） | `<mu-combo-box>`（加 `editable`） |
| 多选下拉 | `<mu-multi-select>` |
| 日期 / 月份 | `<mu-date-input>` |
| 复选框 / 复选框组 | `<mu-check>` / `<mu-check-group>` |
| 单选框 / 单选框组 | `<mu-radio>` / `<mu-radio-group>` |
| 分段控件 | `<mu-segmented>` |
| 开关 | `<mu-switch>` |

### 表单布局

| 形式 | 用法 |
|------|------|
| 声明式 | `<mu-form>` → `<mu-form-row>` → `<mu-form-field label="...">` |
| 数据驱动 | `<mu-form :model="form" :items="[...]" />`，item 支持字符串标题 / `'hr'` / `'->'` / 数组子行 / `{ prop, label, input }` |

### 模态 / 抽屉

| 需求 | 组件 | 易错点 |
|------|------|-------|
| 对话框 | `<mu-dialog>` | 底部按钮用 `:buttons` 数组，不要自己放 slot |
| 抽屉 | `<mu-drawer>` | `position` 默认 `bottom`，侧滑需显式写 `right` / `left` |

> `dismissible`：`true` = 遮罩+ESC 均可关闭；`'esc'` / `'mask'` = 仅其一；不设置 = 不自动关闭。

### 下拉 / 菜单

| 需求 | 组件 |
|------|------|
| 为任意元素附加下拉菜单 | `<mu-dropdown>` 包裹触发器 |
| 独立下拉面板 | `<mu-dropdown-panel>` |
| 右键菜单 | `<mu-context-menu ref="ctx">` + `@contextmenu.prevent="ctx.show($event)"` |

> 菜单项：`[{ caption, icon, action }, { type: 'divider' }]`，点击通过 `@action` 统一处理。

### 数据展示

| 需求 | 组件 | 易错点 |
|------|------|-------|
| 常规表格 | `<mu-table>` | 列类型多（text/enum/link/tag/check/date 等），先查 `references/table.md` |
| 列表项 | `<mu-list-item>`，分隔线用 `<mu-list-divider>` | 无 `<mu-list>` 全局组件 |
| 树 | `<mu-tree>` + `<mu-tree-node>` | 懒加载在 `@node-expand` 里处理 |
| 标签组 | `<mu-tags>` | 可删除加 `removable`，截断用 `max` |
| 月历（内嵌） | `<mu-calendar>` | — |

### 图标 / 排序 / 徽章

```html
<mu-icon icon="edit" />
<mu-icon icon=".icon icon-bolt" />  <!-- icon-font 以 . 开头 -->

<mu-sort-icon />  <!-- 排序方向图标 -->

<mu-badge primary>主要</mu-badge>
<mu-badge success>已完成</mu-badge>
<mu-badge danger>异常</mu-badge>
<mu-badge />                       <!-- 小红点 -->
```

### 反馈提示

```javascript
// 必须通过 inject 获取，不要直接 import
const { messageBox } = inject('$mussel')

// 对话框类 — 返回 Promise<string>，值为按钮key
messageBox.confirm('确认删除？').then(btn => { if (btn === 'ok') doDelete() })
messageBox.alert('操作完成')
messageBox.error('保存失败')
messageBox.warn('数据异常')
messageBox.showMessage({ type: 'confirm', message: '...', title: '自定义标题' })

// 通知类 — 自动消失（默认3s）
messageBox.notify({ message: '保存成功', type: 'success' })
// type: alert | success | warn | error
// 也可直接传字符串：messageBox.notify('操作成功')
```

```html
<mu-status-box icon="empty" title="暂无数据" message="请调整筛选条件">
  <mu-button button-style="outline" caption="重置" @click="reset" />
</mu-status-box>
```