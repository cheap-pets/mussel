<script setup>
  import { ref } from 'vue'

  const value = ref('')
</script>

# 输入框 MuInput

基础文本输入组件，支持前后缀（文本/图标/按钮/链接）、三种视觉风格、三档尺寸、清除按钮与丰富的键盘事件。置于 [MuFormField](/components/form-field) 内时自动联动表单校验。

## 基础用法

<div class="mu-demo">
  <mu-input v-model="value" placeholder="Input Text" />
  <mu-input value="只读" readonly />
  <mu-input value="禁用" disabled />
</div>

```html
<mu-input v-model="value" placeholder="Input Text" />
<mu-input value="只读" readonly />
<mu-input value="禁用" disabled />
```

## 清除按钮 `clearable`

值非空时右侧显示清除按钮，点击置空：

<div class="mu-demo">
  <mu-input v-model="value" placeholder="可清除" clearable />
</div>

```html
<mu-input v-model="value" placeholder="可清除" clearable />
```

## 前后缀 `prefix` / `suffix`

支持四种形式：文本、图标（`:icon=名称`）、工具按钮（`:tool=名称`，可点击，触发 `prefix-click` / `suffix-click` 事件）、链接（`:link=文字`）。

<div class="mu-demo">
  <mu-input v-model="value" prefix=":icon=info" label="myLabel" />
  <mu-input v-model="value" suffix="Suffix" />
  <mu-input v-model="value" prefix=":tool=folderOpen" @prefix-click="() => {}" />
  <mu-input v-model="value" prefix=":tool=bug" suffix=":link=Link" />
</div>

```html
<mu-input v-model="value" prefix=":icon=info" label="myLabel" />
<mu-input v-model="value" suffix="Suffix" />
<mu-input v-model="value" prefix=":tool=folderOpen" @prefix-click="onPrefixClick" />
<mu-input v-model="value" prefix=":tool=bug" suffix=":link=Link" />
```

## 输入风格 `input-style`

attribute（非 prop）：`solid` 填充式 / `underline` 下划线式，不设置为默认描边式；可与其他状态组合。

<div class="mu-demo">
  <mu-input v-model="value" placeholder="Normal（默认）" />
  <mu-input v-model="value" placeholder="Solid" input-style="solid" />
  <mu-input v-model="value" placeholder="Underline" input-style="underline" />
</div>

```html
<mu-input placeholder="Normal" />
<mu-input placeholder="Solid" input-style="solid" />
<mu-input placeholder="Underline" input-style="underline" />
```

## 尺寸 `size`

`small` / `normal`（默认）/ `large`；置于 [MuToolbar](/components/toolbar)（`tool-size="small"`）内时自动继承小尺寸。

<div class="mu-demo">
  <mu-input size="small" placeholder="small" />
  <mu-input placeholder="normal" />
  <mu-input size="large" placeholder="large" />
</div>

```html
<mu-input size="small" placeholder="small" />
<mu-input size="large" placeholder="large" />
```

## 胶囊形态 `pill`

<div class="mu-demo">
  <mu-input v-model="value" placeholder="pill" pill />
  <mu-input v-model="value" placeholder="pill & solid" pill input-style="solid" />
</div>

```html
<mu-input placeholder="pill" pill />
```

## 校验失败样式 `invalid`

<div class="mu-demo">
  <mu-input v-model="value" placeholder="Invalid" invalid />
  <mu-input v-model="value" placeholder="Invalid & Solid" input-style="solid" invalid />
</div>

```html
<mu-input placeholder="Invalid" invalid />
```

> 手动设置 `invalid` 仅控制样式；表单校验联动见 [MuForm](/components/form)。

## 键盘事件 `enter` / `esc`

`enter`（回车）与 `esc` 事件参数为原始键盘事件对象：

```html
<mu-input
  v-model="value"
  placeholder="回车提交，ESC 清空"
  @enter="onSubmit"
  @esc="value = ''" />
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值 |
| `type` | String | `text` | 原生 input type |
| `placeholder` | String | — | 占位文本 |
| `clearable` | Boolean | `false` | 是否显示清除按钮 |
| `size` | String | — | `small` \| `normal` \| `large`；未设置时等效 `normal`，置于 `MuToolbar` 内时自动继承小尺寸 |
| `pill` | Boolean | — | 左右圆弧形态（胶囊形） |
| `input-style` | String | — | attribute（非 prop）：`solid` 填充式 \| `underline` 下划线式，透传到根元素经属性选择器生效 |
| `invalid` | Boolean | — | 校验失败样式 |
| `readonly` / `disabled` | Boolean | — | 只读 / 禁用 |
| `prefix` | String\|Object | — | 前置文本或按钮 |
| `suffix` | String\|Object | — | 后置文本或按钮 |
| `tabindex` | String | `-1` | Tab 聚焦顺序 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | value | 值变更 |
| `input` | Event | 原生 input 事件 |
| `focus` / `blur` | Event | 获焦 / 失焦 |
| `click` / `keydown` | Event | 点击 / 键盘按下 |
| `enter` | Event | 回车键（keyCode 13），参数为原始键盘事件对象 |
| `esc` | Event | ESC 键（keyCode 27），参数为原始键盘事件对象 |
| `prefix-click` | — | 前置按钮点击 |
| `suffix-click` | — | 后置按钮点击 |
