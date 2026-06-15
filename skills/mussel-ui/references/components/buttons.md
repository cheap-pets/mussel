# 按钮与操作组件 API

### MuButton

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `caption` | String | — | 按钮文字 |
| `icon` | String | — | 按钮图标 |
| `size` | String | `normal` | `small` \| `normal` \| `large` |
| `button-style` | String | `normal` | `normal` \| `outline` \| `text` \| `link` |
| `color` | String | `'normal'` | `'normal'` \| `'primary'` \| `'secondary'` \| `'danger'`，推荐使用 |
| `primary` | Boolean | — | 主色按钮（已废弃，用 `color="primary"`） |
| `danger` | Boolean | — | 危险色按钮（已废弃，用 `color="danger"`） |
| `secondary` | Boolean | — | 次要色按钮（已废弃，用 `color="secondary"`） |
| `pill` | Boolean | — | 左右圆弧形态 |
| `active` | Boolean | — | 选中状态 |
| `disabled` | Boolean | — | 禁用状态 |

```html
<mu-button color="primary" caption="保存" icon="save" @click="save" />
<mu-button color="danger" button-style="outline" caption="删除" @click="remove" />
<mu-button button-style="text" caption="取消" @click="cancel" />
```

---

### MuButtonGroup

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | String | 覆盖内部所有按钮的尺寸 |
| `button-style` | String | `normal` \| `outline` |
| `primary` / `danger` / `secondary` | Boolean | 设置整组按钮颜色 |
| `pill` | Boolean | 圆弧形态 |
| `disabled` | Boolean | 禁用整组 |

```html
<mu-button-group button-style="outline" size="small">
  <mu-button icon="copy" caption="复制" />
  <mu-button icon="cut" caption="剪切" />
  <mu-button icon="paste" caption="粘贴" />
</mu-button-group>
```

---

### MuToolButton

仅图标的工具栏快捷按钮，**不支持文字标题**。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标，必填 |
| `toggle` | Boolean | 开关模式：按下后切换选中状态 |
| `active` | Boolean | 双向绑定选中状态 |
| `size` | String | `small` \| `normal` \| `large` |
| `animation` | String | 动画效果 |

```html
<!-- 工具栏中使用 -->
<mu-tool-button icon="refresh" @click="reload" />
<mu-tool-button icon="filter" toggle v-model:active="filterVisible" />
```

---

### MuDropdownButton

带下拉菜单的按钮，支持分割形式。自身仅定义 `icon`/`caption`/`splitButton` 三个 prop，其他 MuButton 属性（如 `color`、`button-style`、`size`、`disabled`）通过 `$attrs` 透传。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标 |
| `caption` | String | 按钮文字 |
| `split-button` | Boolean | 是否分割按钮形式 |
| (透传) | — | MuButton 属性（`color`、`button-style`、`size` 等）+ MuDropdown 属性 |

```html
<mu-dropdown-button
  caption="新建"
  color="primary"
  split-button
  :dropdown-items="[
    { caption: '从模板创建', action: 'from-template' },
    { caption: '导入文件',   action: 'import' }
  ]"
  @click="onCreate"
  @action="onDropdownAction"
/>
```
