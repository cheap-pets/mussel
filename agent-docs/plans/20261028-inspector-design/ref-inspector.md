# 组件库需求规格说明书：Inspector（属性检查器）

---

## 1. 概述与定位

### 1.1 业务背景与定位
本组件为 UI 组件库中的**容器型/复合型业务组件**，用于在可视化搭建、后台配置等场景中，提供标准化的右侧属性配置面板。

### 1.2 设计前提
* **依赖基础组件库**：Inspector 不重复实现表单控件，内部各字段直接复用并驱动组件库已有的基础输入组件（如 `Input`、`InputNumber`、`Select`、`Switch`、`ColorPicker`、`Radio` 等）。
* **聚焦核心场景**：仅覆盖单节点属性查看与编辑的主流场景，去除逃生舱、多节点批量编辑、历史记录栈等复杂非核心功能。
* **防抖策略下放**：去除非必要的通用防抖 Prop，依赖底层基础表单组件自身的输入响应与防抖处理。

---

## 2. 核心功能需求

### 2.1 扁平数据映射与渲染
* **扁平字段列表（`fields`）**：接收平铺的配置项数组，通过字段定义直接映射出对应的表单项。
* **基础控件渲染**：根据 `type` 匹配组件库内置的基础表单控件：
  * `text` -> `Input`
  * `number` -> `InputNumber`
  * `select` -> `Select`
  * `switch` -> `Switch`
  * `color` -> `ColorPicker`
  * `radio` -> `RadioGroup`
* **分组归类（可选）**：支持字段通过 `group` 字段进行逻辑分组，自动渲染分组标题与分割。

### 2.2 状态同步与变更
* **数据回显**：接收选中的数据对象 `value`，各字段通过 `name` 读取对应数值并绑定到控件。
* **变更派发**：任意字段触发变更时，向外抛出变更事件，提供被修改字段名、最新字段值以及合并后的完整数据。
* **空状态（Empty State）**：当 `value` 为空或未选中对象时，展示轻量级占位界面。
* **全局与字段级禁用**：支持面板整体 `disabled` / `readonly`，同时也支持单个字段的禁用配置。

---

## 3. 组件 API 规格

### 3.1 Props
| 属性名 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `Record<string, any> \| null` | 是 | `null` | 当前选中的数据对象（键值对） |
| `fields` | `InspectorField[]` | 是 | `[]` | 扁平字段配置数组 |
| `disabled` | `boolean` | 否 | `false` | 是否全局禁用所有输入项 |
| `emptyText` | `string` | 否 | `'暂无选中对象'` | 空状态提示文案 |

### 3.2 Events / Callbacks
| 事件名 | 参数签名 | 说明 |
| :--- | :--- | :--- |
| `change` | `(fieldName: string, fieldValue: any, nextValue: Record<string, any>) => void` | 单个字段值更新时触发，并回传合并后的完整数据 |

### 3.3 Slots
* `empty`：自定义空状态插槽。
* `header`：面板顶部操作栏插槽。

---

## 4. 类型定义（TypeScript）

```typescript
export type InspectorFieldType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'switch' 
  | 'color' 
  | 'radio';

export interface InspectorFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface InspectorField {
  /** 对应的属性字段名（扁平键名） */
  name: string;
  /** 配置项展示标签 */
  label: string;
  /** 映射的基础组件类型 */
  type: InspectorFieldType;
  /** 默认值 */
  defaultValue?: any;
  /** 提示文案 */
  placeholder?: string;
  /** 分组标识（相同 group 的字段排布在同一组） */
  group?: string;
  /** 单字段是否禁用 */
  disabled?: boolean;
  /** 下拉或单选类型的选项列表 */
  options?: InspectorFieldOption[];
  /** 直接透传给底层基础组件的额外参数 */
  componentProps?: Record<string, any>;
}
```

---

## 5. 组件行为与交互规范

1. **值获取与回显**：
   * 优先取 `value[field.name]`；若为 `undefined`，降级取 `field.defaultValue`。
2. **事件更新机制**：
   * 监听各底层基础组件的 `onChange` 事件。
   * 收到值变更后，生成 `nextValue = { ...value, [field.name]: newValue }`，触发组件自身的 `change` 事件输出。
3. **样式与布局**：
   * 采用标准侧边栏纵向流式排版（Vertical Form Layout）。
   * Label 与输入控件采用整齐的左右分栏或上下排布，保证与组件库其他表单面板样式体系一致。