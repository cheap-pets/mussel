# 徽章 MuBadge

徽章组件，用于状态标签或角标。无 props，颜色变体通过 HTML attribute（非 prop）控制，直接写在标签上即可；常与按钮、列表项、表格单元格组合使用，提示数量或状态。

空内容时渲染为 `8px` 小圆点（背景自动使用 `--mu-danger-color`），适合作为消息角标叠放在按钮或图标上。

## 颜色变体

支持 6 种颜色 attribute：不设置（默认灰）、`primary`、`secondary`、`success`、`warning`、`danger`。

<div class="mu-demo">
  <mu-badge>Default</mu-badge>
  <mu-badge primary>Primary</mu-badge>
  <mu-badge secondary>Secondary</mu-badge>
  <mu-badge success>已完成</mu-badge>
  <mu-badge warning>Warning</mu-badge>
  <mu-badge danger>Danger</mu-badge>
</div>

```html
<mu-badge>Default</mu-badge>
<mu-badge primary>主要</mu-badge>
<mu-badge success>已完成</mu-badge>
<mu-badge warning>警告</mu-badge>
<mu-badge danger>异常</mu-badge>
```

## 小圆点角标

内容为空时渲染为小红点。放入按钮 default 插槽内即可作为角标使用：

<div class="mu-demo">
  <mu-button caption="消息">
    <span class="mu-badge">5</span>
  </mu-button>
  <mu-button caption="通知">
    <span class="mu-badge" />
  </mu-button>
</div>

```html
<mu-button caption="消息">
  <span class="mu-badge">5</span>
</mu-button>

<!-- 空内容 → 小圆点 -->
<mu-button caption="通知">
  <span class="mu-badge" />
</mu-button>
```

## API

无 `defineProps`。颜色变体通过 HTML attribute 控制：

| Attribute | 颜色 |
|-----------|------|
| （无） | 默认灰色（`--mu-gray`） |
| `primary` | 主色 |
| `secondary` | 次要色 |
| `success` | 成功色 |
| `warning` | 警告色 |
| `danger` | 危险色 |

> 空内容时渲染为小圆点（`8px`），背景自动使用 `--mu-danger-color`。
