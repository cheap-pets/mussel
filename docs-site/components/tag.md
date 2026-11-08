# 标签 MuTag

单个标签组件，静态展示、不可删除。默认形态为灰底 + 同色系内描边（高 20px、字号 12px）；`color` 设置后文字与底色同色系。需要删除、超出合并省略等批量能力时使用[标签组 MuTags](./tags)。

## 基础用法

<div class="mu-demo">
  <mu-tag>Default</mu-tag>
  <mu-tag color="primary">Primary</mu-tag>
  <mu-tag color="success">Success</mu-tag>
  <mu-tag color="pink">Pink</mu-tag>
</div>

```html
<mu-tag>Default</mu-tag>
<mu-tag color="primary">Primary</mu-tag>
<mu-tag color="success">Success</mu-tag>
<mu-tag color="pink">Pink</mu-tag>
```

## 形态 `pill` / `flat`

`pill` 为全圆角胶囊形态，`flat` 去除内描边：

<div class="mu-demo">
  <mu-tag color="pink" pill>Pink pill</mu-tag>
  <mu-tag color="success" flat>Success flat</mu-tag>
  <mu-tag flat>Flat</mu-tag>
</div>

```html
<mu-tag color="pink" pill>Pink pill</mu-tag>
<mu-tag color="success" flat>Success flat</mu-tag>
<mu-tag flat>Flat</mu-tag>
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `color` | String | — | 12 基本色（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange）+ 5 功能色（primary/secondary/success/warning/danger，**不含 gray**）；设置后文字与底色同色系（`text-{color}` + `bg-{color}-translucent`） |
| `flat` | Boolean | — | 去除内描边 |
| `pill` | Boolean | — | 全圆角形态 |

| 插槽 | 说明 |
|------|------|
| `default` | 标签内容 |
