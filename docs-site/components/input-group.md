<script setup>
  import { ref } from 'vue'

  const value = ref('')
  const protocol = ref('https')
</script>

# 输入组 MuInputGroup

输入框成组容器（`div.mu-input-group`），无 props、仅默认插槽，用于把多个相邻输入控件包装为视觉整体——如「协议 + 域名 + 后缀」、「文本 + 输入框 + 按钮」等组合输入。

## 基础用法

内部可混合文本、链接、输入框、图标按钮、按钮、下拉等控件：

<div class="mu-demo mu-demo-col">
  <div class="mu-input-group">
    <span>http://</span>
    <mu-input v-model="value" input-style="solid" />
    <span>.com</span>
  </div>
  <div class="mu-input-group">
    <a class="mu-link">Link</a>
    <mu-input v-model="value" />
    <mu-icon-button icon="search" />
    <mu-button class="mu-input-addon" caption="Button" />
  </div>
</div>

```html
<div class="mu-input-group">
  <span>http://</span>
  <mu-input v-model="value" input-style="solid" />
  <span>.com</span>
</div>

<div class="mu-input-group">
  <a class="mu-link">Link</a>
  <mu-input v-model="value" />
  <mu-icon-button icon="search" />
  <mu-button class="mu-input-addon">Button</mu-button>
</div>
```

## 下拉 + 输入框组合

`mu-input-addon` class 使内部 select 收缩为附加件宽度：

<div class="mu-demo mu-demo-col">
  <div class="mu-input-group">
    <mu-select
      v-model="protocol"
      :options="[{ value: 'http' }, { value: 'https' }]"
      class="mu-input-addon"
      style="width: 115px;"
      placeholder="协议" />
    <mu-input v-model="value" input-style="solid" />
  </div>
</div>

```html
<div class="mu-input-group">
  <mu-select
    v-model="protocol"
    :options="protocols"
    class="mu-input-addon"
    style="width: 115px;" />
  <mu-input v-model="value" input-style="solid" />
</div>
```

## 状态透传

组内输入框的 invalid / readonly / disabled 状态各自独立：

```html
<div class="mu-input-group">
  <span>http://</span>
  <mu-input v-model="value" invalid placeholder="Invalid" input-style="underline" />
  <span>.com</span>
</div>
```

## API

无 props，仅默认插槽。容器 class：`.mu-input-group`；内部收缩控件使用 `.mu-input-addon` class。
