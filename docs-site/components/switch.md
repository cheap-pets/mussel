<script setup>
  import { ref } from 'vue'

  const enabled = ref(true)
  const mode = ref('on')
</script>

# 开关 MuSwitch

开关组件，用于两种状态的即时切换（开/关）。与 checkbox 的区别：开关表达的是**设置项的即时生效**，checkbox 表达的是表单中的多选项。

## 基础用法

<div class="mu-demo">
  <mu-switch v-model="enabled" />
  <mu-switch v-model="enabled" label="带标签" />
  <mu-switch v-model="enabled" disabled />
</div>

```html
<mu-switch v-model="enabled" />
<mu-switch v-model="enabled" label="接收通知" />
```

## 状态文字 `active-label` / `inactive-label`

开启/关闭状态分别显示的文字（未设置时回退 `label`）：

<div class="mu-demo">
  <mu-switch v-model="enabled" active-label="ON" inactive-label="OFF" />
  <mu-switch v-model="enabled" active-label="开启" inactive-label="关闭" />
</div>

```html
<mu-switch v-model="enabled" active-label="ON" inactive-label="OFF" />
```

## 图标 `icon` / `active-icon` / `inactive-icon`

`icon` 两侧均显示；`active-icon` / `inactive-icon` 分别设置激活/非激活态图标：

<div class="mu-demo">
  <mu-switch v-model="enabled" active-icon="sun" inactive-icon="moon" />
  <mu-switch v-model="enabled" icon="check" />
</div>

```html
<mu-switch v-model="enabled" active-icon="sun" inactive-icon="moon" />
```

## 颜色 attribute

通过 HTML attribute（非 prop）控制激活态颜色：`success` / `danger`。

<div class="mu-demo">
  <mu-switch v-model="enabled" success active-label="正常" />
  <mu-switch v-model="enabled" danger active-label="危险操作" />
</div>

```html
<mu-switch v-model="enabled" success />
<mu-switch v-model="enabled" danger />
```

## 自定义状态值 `active-value` / `inactive-value`

默认开启值为 `true`、关闭值为 `false`，可自定义任意值：

<div class="mu-demo">
  <mu-switch v-model="mode" active-value="on" inactive-value="off" active-label="自定义值" />
  <span class="text-subtle">mode = {{ mode }}</span>
</div>

```html
<mu-switch v-model="status" active-value="enabled" inactive-value="disabled" />
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值 |
| `label` | String | — | 标签文字 |
| `icon` | String | — | 图标（两侧均显示） |
| `active-icon` / `inactive-icon` | String | — | 激活态 / 非激活态图标 |
| `active-label` / `inactive-label` | String | — | 打开 / 关闭状态文字 |
| `active-value` | — | `true` | 打开状态值 |
| `inactive-value` | — | `false` | 关闭状态值 |

| Attribute（非 prop） | 说明 |
|---------------------|------|
| `success` | 激活态使用成功色 |
| `danger` | 激活态使用危险色 |
