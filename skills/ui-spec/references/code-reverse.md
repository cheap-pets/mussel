# 代码逆向 — 从现有代码生成 ui-spec

本文件承载「渠道 ④ 现有代码」的完整反向规则。SKILL.md 主流程只做高层引用，详细映射规则查这里。

适用场景：用户提供了已实现页面的源码（`src/pages/<page>/` 目录、某个 `.vue` 入口、或单文件页面），希望把它反向成一份 `ui-spec-<page-name>.md`，作为文档化、重构前的现状梳理、或迁移到 spec 驱动流程的起点。

---

## 核心原则：忠实转写

- **只记录代码现状**：代码里有什么，spec 就填什么；不评判、不标注代码与约定的偏差、不给改进建议。
- **缺失即留空**：代码中不存在的部分（如无 store、无 API 调用、无校验规则），对应 spec 节留空并标 `-`，**不臆造**。下游看到 `-` 就知道这是代码里没有的。
- **不补全业务语义**：字段中文名、实体说明等代码里若没体现，标 `[推测]` 或留空由用户后续补——同图片渠道一样，区分"代码看得出"与"代码看不出"。

> 与正向规划模式的区别：正向会逐 Phase 提问补全缺失；逆向只忠实转写，缺失的留空，最后一次性汇总让用户确认或补全。

---

## 第一步：定位与读取

### 标准约定结构（`src/pages/<page-name>/`）

按 SKILL.md 既定约定定位各文件：

| 文件 | 用途 | 反向时关注 |
|------|------|-----------|
| `index.js` | 页面入口，布局组合 | 模板里的布局标签嵌套 |
| `views/*.vue` | 各视图 | 模板的根级 `mu-*`、`<script setup>` 的 `columns`/数据 |
| `stores/*.js` | Pinia Store | `defineStore` 的 state/actions、内联的 API 调用 |

### 非标准结构

代码结构不符合 `src/pages/<page>/` 约定时（如单文件页面、扁平目录）：

- **按实际结构转写**，不强行套模板。
- 文件树（spec 第 6 节）如实记录代码现状，不按理想结构美化。
- 入口位置、视图文件名按代码实际命名登记，并在汇总确认时向用户说明"未遵循标准约定"。

---

## 第二步：反向映射规则总表

| 代码来源 | 反向方法 | 填入 spec 节 |
|---------|---------|-------------|
| 入口模板的布局标签（`mu-h-box`/`mu-split-h-box`/`mu-v-box`/`mu-toolbar`/`mu-scroll-box`…） | 读 `mu-*` 标签的嵌套关系 → 区域嵌套关系；按标签位置/尺寸属性 → 区域属性 | 1. 布局 |
| 视图 `.vue` 模板根级 `mu-*`（`mu-table`/`mu-tree`/`mu-form`/`mu-tabs`/`mu-card`…） | 按下方「视图类型映射」识别视图类型 | 2.1 视图清单 |
| `<mu-table :columns>` + `<script setup>` 的 `columns` 数组 | 逐列读 `field`/`caption`/`type`/`width`/`align`/`sortable`/`mappings`，对照下方「表格列映射」 | 2.2 表格列 |
| `<mu-tree>` 的节点字段（`node-key`/`node-label`/`node-children` 或 `default-options`） | 读节点字段定义 | 2.3 树节点 |
| 工具栏区 `<mu-button>`/`<mu-icon-button>` | 读 `caption`（按钮文字）/`color`/`primary`（布尔=primary）/`icon`/绑定的事件（`@click` 函数名 → action 名） | 2.4 工具栏按钮 |
| `<mu-form-field>` 的 `label` + 内嵌控件（或 `items` 数组中的字段定义） | 对照下方「表单字段映射」 | 2.5 表单字段 |
| `<mu-select>`/`<mu-input>` 等带筛选语义的、置于工具栏/搜索区的控件 | 读字段名与控件类型 | 2.6 筛选条件 |
| 模板全部 `mu-*` 标签 | strip `mu-` → PascalCase（`mu-table` → `MuTable`），登记声明式组件 | 5. 组件清单 |
| `<script setup>` 中 `inject('$mussel')` 后的 `messageBox.confirm`/`messageBox.notify` 调用 | 扫脚本识别命令式 API 调用 | 5. 命令式 API 表 |
| `stores/*.js` 的 `request`/`fetch`/`axios`/`$http` 调用 | 读 URL + method + payload 字段 | 3.2 API |
| 表格 `records`/表单 `model`/store state 中的数据形状 | 推断实体字段（仅作为辅助，类型可能需推测） | 3.1 实体结构 |
| 实际目录树 | 直接转写 | 6. 文件树 |
| `stores/*.js` 的 `defineStore` | 转 state/actions 结构骨架（保留方法名与调用关系，不实现细节） | 7. Store 职责 |

---

## 第三步：关键映射细节

### `mu-*` 标签 ↔ `Mu*` 组件名

机械可推导，无需记忆：

```
mu-table        → MuTable
mu-form-field   → MuFormField
mu-split-h-box  → MuSplitHBox
mu-icon-button  → MuIconButton
```

规则：`mu-` 前缀 + kebab-case → 去前缀后 PascalCase（`split-h-box` → `SplitHBox`）。注册名前缀 `Mu`，源码内部名前缀 `Mussel`（spec 用 `Mu*` 注册名）。

### 视图类型映射（组件 → spec 视图类型）

| 模板根组件 | spec 视图类型 |
|-----------|--------------|
| `mu-table` | `data-grid` |
| `mu-tree` | `tree-view` |
| `mu-form`（在弹窗/抽屉内） | `form-panel` |
| `mu-form`（只读详情，字段 `disabled`/`readonly`） | `detail-panel` |
| `mu-tabs` + `mu-tab-panel` | `tabs-view` |
| `mu-list` / `mu-list-item` | `list-view` |
| 卡片网格（自绘 `mu-card` 或 grid 布局） | `card-grid` |
| `mu-status-box` | `empty-state` / `loading-state` / `error-state`（按 `status` prop） |
| 其他（图表/日历/甘特等非 MUSSEL 原生） | 按实际登记，标 `[推测]` |

### 表格列映射（`columns` 数组 → spec 2.2 节）

MUSSEL 4 的 `MuTable` 用 `:columns` **JS 数组**配置（**不是** `<mu-table-column>` 子标签）。逐列读：

| columns 数组项属性 | → spec 表格列字段 |
|------------------|-----------------|
| `field` | 字段名 |
| `caption` | 列标题（无则用 `field` 标 `[推测]`） |
| `type` | 列类型（直接采用，见下表对照） |
| `width` / `minWidth` / `maxWidth` | 列宽（取 `width`，无则取范围） |
| `align` | 对齐 |
| `sortable` | 可排序（`true` → ✓） |
| `mappings` | 写到"说明"列（如"枚举映射：active=启用"） |
| `format` / `formatOption` | 写到"说明"列（如"日期格式 yyyy-MM-dd"） |
| `tags` / `links` 函数 | 列类型已是 `tag`/`link`，函数体不抄，仅登记类型 |

**MUSSEL 4 列类型 → spec 列类型对照**：

| MUSSEL 4 `type` | spec 列类型 | 备注 |
|----------------|------------|------|
| `text` | `text` | |
| `rec_no` | （登记为行号列） | 自动行号，非数据字段 |
| `check` | （登记为勾选列） | 选择列，非数据字段 |
| `bool` | `enum` | 配合 `mappings` |
| `enum` | `enum` | 配合 `mappings` |
| `date` / `datetime` | `date` | |
| `number` / `currency` | `number` | |
| `link` | `link` | |
| `tag` | `tag` | |
| `img` / `image` | （登记为图片列） | spec 列类型无 `image`，写到说明 |

> 对照权威：`mussel-ui/references/components/data-display.md` 的「Column 配置」与「列类型」表。源码与文档冲突时以源码为准。

### 表单字段映射（`mu-form-field` / `items` 数组 → spec 2.5 节）

两种写法都要支持：

**声明式**（模板里 `<mu-form-field>` 包裹控件）：

```html
<mu-form-field label="名称">
  <mu-input v-model="form.name" />
</mu-form-field>
```

→ 字段名 = `v-model` 的末段（`form.name` → `name`，标 `[推测]` 若 `v-model` 无法直读）；控件类型按内嵌控件标签映射（见下）。

**数据驱动**（`items` 数组）：

```js
{ prop: 'name', label: '名称', input: 'text', required: true }
```

→ 字段名 = `prop`；控件类型 = `input` 的值；必填 = `required`。

**控件类型反向映射**（内嵌组件 / `input` 值 → spec 控件类型）：

| 代码中的控件 | spec 控件类型 |
|------------|--------------|
| `<mu-input>` / `input: 'text'` | `input` |
| `input: 'memo'` / `<textarea class="mu-input">` | `textarea` |
| `<mu-input type="number">` / `input: 'number'` | `number` |
| `<mu-select>` / `input: 'select'` | `select` |
| `<mu-multi-select>` / `input: 'multi-select'` | `multi-select` |
| `<mu-combo-box>` / `input: 'combo'` | `combo` |
| `<mu-date-input>` / `input: 'date'`/`'month'`/`'year'` | `date` |
| `<mu-time-input>` / `input: 'time'` | `time` |
| `<mu-switch>` / `input: 'switch'` | `switch` |
| `<mu-radio-group>` + `<mu-radio>` / `input: 'radio-group'` | `radio` |
| `<mu-check-group>` + `<mu-check>` / `input: 'check-group'` | `check` |
| `<mu-segmented>` / `input: 'segmented'` | （登记，spec 控件类型表无对应） |

**校验规则**（`rules` 对象）：

| 代码 rules | spec 校验规则列 |
|-----------|---------------|
| `required: true` | 必填 = ✓；规则写 `required` |
| `validator: fn` | 规则写 `custom`（函数体不抄） |
| `message` / `requiredMessage` | 不进 spec（提示文案不属结构） |

### API 映射（store 中的请求 → spec 3.2 节）

扫 `stores/*.js`（或视图 `<script setup>` 中的请求）里的网络调用：

| 代码形态 | 提取 |
|---------|------|
| `request('/api/departments', { method: 'GET' })` | URL + method |
| `request.get('/api/departments')` | URL，method = GET |
| `axios.post('/api/departments', payload)` | URL，method = POST |
| `fetch('/api/departments', { method: 'DELETE' })` | URL + method |

→ 每个调用一行，填入 spec 3.2 API 表。**实体列**按 URL 推断（如 `/api/departments` → `Department`，标 `[推测]`）。代码无 API 调用则整表留空标 `-`。

### Store 映射（`defineStore` → spec 第 7 节）

转 state/actions 骨架：

- **state**：列出字段名与初值类型（`tableData: []`、`loading: false`）。
- **actions**：列出方法名与调用的 API（如 `fetchList` → `GET /api/...`），**不抄实现细节**。
- 代码无 store（如纯前端 demo、状态在 `<script setup>` 的 `ref` 里）则第 7 节留空标 `-`，并在汇总时说明。

---

## 第四步：转写后处理

1. **汇总填充情况**：整理一份「1–7 节填充情况」给用户——哪些节已从代码填出、哪些节代码里没有（标 `-`）、哪些是 `[推测]` 需用户确认。**一次性确认，不逐 Phase 停顿。**
2. **用户补全**（可选）：用户可在此补全代码缺失的业务语义（字段中文名、实体说明、API 实体归属等）。
3. **写入文档**：确认后按 SKILL.md 既定的「输出文件格式」与「产出前自检清单」写入 `ui-spec-<page-name>.md`。基本信息表的「来源」填 `代码逆向`。

---

## 错误处理

| 场景 | 处理 |
|------|------|
| 代码中识别不到任何 `mu-*` 组件 | 向用户说明可能非 MUSSEL 页面，请确认后再处理；不强行转写 |
| 目录结构完全不符约定（如 SPA 单文件） | 按实际结构转写，文件树如实记录，不套模板；汇总时说明 |
| 代码用 `<mu-table-column>` 子标签（疑似 M3 写法或非 M4 惯例） | 按实际转写，并在汇总时向用户说明"M4 惯例是用 `:columns` 数组"——但**不改写代码**，仅在 spec 中如实登记 |
| 视图状态散落在 `<script setup>` 而非 store | 第 7 节留空标 `-`；在汇总说明"无独立 store，状态在视图内" |
| `columns`/`items` 数组动态生成（函数返回、条件拼装） | 抄不出静态结构，标 `[动态生成，需运行时确认]`，请用户补充 |
