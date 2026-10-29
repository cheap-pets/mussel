# 徽章 MuBadge

徽章组件，用于状态标签或角标，实底胶囊造型（灰底白字）。常与按钮、列表项、表格单元格组合使用，提示数量或状态。

## 颜色

`color` 属性设置语义色，取值：`primary` / `secondary` / `success` / `warning` / `danger`：

<div class="mu-demo">
  <mu-badge>Default</mu-badge>
  <mu-badge color="primary">Primary</mu-badge>
  <mu-badge color="secondary">Secondary</mu-badge>
  <mu-badge color="success">已完成</mu-badge>
  <mu-badge color="warning">Warning</mu-badge>
  <mu-badge color="danger">Danger</mu-badge>
</div>

```html
<mu-badge>Default</mu-badge>
<mu-badge color="primary">主要</mu-badge>
<mu-badge color="success">已完成</mu-badge>
<mu-badge color="warning">警告</mu-badge>
<mu-badge color="danger">异常</mu-badge>
```

> `primary` / `success` 等布尔属性写法仍兼容，已弃用并输出控制台警告，后续版本将移除。

## 数值角标

`value` 属性设置徽标内容，未使用默认插槽时显示；值为单个数字时收缩为等宽圆形：

<div class="mu-demo">
  <mu-button>
    消息<mu-badge value="6" color="danger" />
  </mu-button>
  <mu-button>
    消息<mu-badge value="99+" color="danger" />
  </mu-button>
</div>

```html
<mu-badge value="6" color="danger" />
<mu-badge value="99+" color="danger" />
```

## 圆点

内容为空时收缩为 `8px` 圆点，背景固定为 danger 色，用作消息提醒：

<div class="mu-demo">
  <mu-button>
    通知<mu-badge />
  </mu-button>
</div>

```html
<mu-badge />
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `color` | String | — | 语义色名：`primary` / `secondary` / `success` / `warning` / `danger` |
| `value` | String \| Number | — | 徽标内容，未使用默认插槽时显示；为单个数字时呈圆形 |
| `primary` `secondary` `success` `warning` `danger` | Boolean | `false` | 弃用。等同 `color="…"`，输出弃用警告 |

> 空内容（无插槽且无 `value`）渲染为 `8px` 圆点，背景 `--mu-danger-color`。
