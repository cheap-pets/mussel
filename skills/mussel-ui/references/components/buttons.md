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
| `toggle` | Boolean | — | 开关模式：开启后点击切换 `active`，需配合 `v-model:active` |
| `active` | Boolean | — | 选中状态（`toggle` 开启时双向绑定）|
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

### MuIconButton

仅图标的按钮，常用于工具栏或列表项中的快捷操作，**不支持文字标题**。继承 MuButton 的全部属性（`size` / `color` / `button-style` / `disabled` / `toggle` 等）。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标，必填 |
| `animation` | String | 动画效果 |
| (其他) | — | 继承 MuButton 属性（`toggle` / `active` / `size` / `color` / `button-style` / `disabled` 等） |

```html
<!-- 工具栏中使用 -->
<mu-icon-button icon="refresh" @click="reload" />
<mu-icon-button icon="filter" toggle v-model:active="filterVisible" />
<mu-icon-button icon="chevron-up" button-style="text" @click="scrollTop" />
```
