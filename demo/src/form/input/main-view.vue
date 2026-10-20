<template>
  <demo-page path="form/input">
    <demo-section
      title="基础用法"
      note="v-model 绑定文本；clearable 显示清空按钮；esc/enter 触发对应事件"
      :code="basicCode">
      <mu-input
        v-model="value"
        placeholder="Input Text"
        style="width: 240px"
        @esc="onLog('esc')"
        @enter="onLog('enter')" />
      <mu-input
        v-model="value"
        placeholder="Clearable"
        clearable
        style="width: 240px" />
      <span class="demo-log">最近事件：{{ log || '无' }}</span>
    </demo-section>

    <demo-section
      title="前后缀（affix）"
      note="prefix/suffix 支持 :icon=、:text=（默认）、:tool=（可点击图标）、:link= 四种类型">
      <mu-input
        v-model="value"
        prefix=":icon=info"
        label="myLabel"
        style="width: 240px" />
      <mu-input
        v-model="value"
        suffix="Suffix"
        style="width: 240px" />
      <mu-input
        v-model="value"
        prefix=":tool=folderOpen"
        style="width: 240px"
        @prefix-click="onLog('prefix-click')" />
      <mu-input
        v-model="value"
        prefix=":tool=question"
        suffix=":link=Link"
        style="width: 240px"
        @suffix-click="onLog('suffix-click')" />
    </demo-section>

    <demo-section
      title="风格"
      note="input-style 为 underline / solid，round 为圆角">
      <mu-input
        v-model="value"
        prefix="Prefix"
        placeholder="Underline"
        input-style="underline"
        style="width: 220px" />
      <mu-input
        v-model="value"
        prefix="Prefix"
        placeholder="Solid"
        input-style="solid"
        style="width: 220px" />
      <mu-input
        v-model="value"
        prefix="Prefix"
        placeholder="Round"
        round
        style="width: 220px" />
      <mu-input
        v-model="value"
        prefix="Prefix"
        placeholder="Round & Solid"
        round
        input-style="solid"
        style="width: 220px" />
    </demo-section>

    <demo-section
      title="状态"
      note="invalid 校验错误态、readonly 只读、disabled 禁用">
      <mu-input
        v-model="value"
        placeholder="Invalid"
        invalid
        style="width: 220px" />
      <mu-input
        v-model="value"
        placeholder="Invalid & Solid"
        input-style="solid"
        invalid
        style="width: 220px" />
      <mu-input
        v-model="value"
        placeholder="Readonly"
        readonly
        style="width: 220px" />
      <mu-input
        v-model="value"
        placeholder="Disabled"
        disabled
        style="width: 220px" />
    </demo-section>

    <demo-section
      title="尺寸"
      note="size 为 small / large，pill 胶囊形">
      <mu-input
        v-model="value"
        size="small"
        placeholder="small"
        style="width: 200px" />
      <mu-input
        v-model="value"
        placeholder="normal"
        style="width: 200px" />
      <mu-input
        v-model="value"
        size="large"
        placeholder="large"
        style="width: 200px" />
      <mu-input
        v-model="value"
        pill
        placeholder="pill"
        input-style="solid"
        style="width: 200px" />
    </demo-section>

    <demo-section
      title="InputGroup 输入组"
      note="MuInputGroup 组合文本、按钮、选择器等前后附件（addon 类名）"
      vertical>
      <mu-input-group style="width: 360px">
        <span>http://</span>
        <mu-input
          v-model="value"
          input-style="solid" />
        <span>.com</span>
      </mu-input-group>
      <mu-input-group style="width: 360px">
        <a class="mu-link">Link</a>
        <mu-input v-model="value" />
        <mu-icon-button icon="search" />
        <mu-button class="mu-input-addon">
          Button
        </mu-button>
      </mu-input-group>
      <mu-input-group style="width: 360px">
        <mu-select
          v-model="selectValue"
          :options="options"
          class="mu-input-addon"
          style="width: 115px"
          placeholder="empty" />
        <mu-input
          v-model="value"
          input-style="solid" />
        <span><mu-check label="Check" /></span>
      </mu-input-group>
      <mu-input-group style="width: 360px">
        <span>http://</span>
        <mu-input
          v-model="value"
          invalid
          placeholder="Invalid"
          input-style="underline" />
        <span>.com</span>
      </mu-input-group>
    </demo-section>

    <demo-section
      title="SearchInput 搜索输入"
      note="MuSearchInput 默认带搜索图标与清空按钮，输入防抖 500ms（debounce-delay 可调）">
      <mu-search-input
        v-model="searchValue"
        placeholder="Search"
        style="width: 260px" />
      <span class="demo-log">防抖后的值：{{ searchValue || '空' }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="esc 清空时事件触发、v-model.trim 修饰符、超长文本"
      regression
      vertical>
      <div class="demo-row">
        <span>v-model.trim：</span>
        <mu-input
          v-model.trim="trimmed"
          placeholder="输入带空格文本"
          style="width: 240px" />
        <span>值：[{{ trimmed }}]</span>
      </div>
      <div class="demo-row">
        <span>超长文本不撑破容器：</span>
        <mu-input
          v-model="longText"
          style="width: 240px" />
      </div>
      <div class="demo-row">
        <span>clearable 清空后触发 update：</span>
        <mu-input
          v-model="cleared"
          clearable
          placeholder="输入后点击 X"
          style="width: 240px" />
        <span>值：[{{ cleared }}]</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-input v-model="value" placeholder="Input Text" />
<mu-input v-model="value" clearable />`

  const value = ref('')
  const trimmed = ref('')
  const longText = ref('a very long text value '.repeat(6))
  const cleared = ref('to be cleared')
  const searchValue = ref('')
  const log = ref('')
  const selectValue = ref()

  const options = [
    { value: 'http' },
    { value: 'https' }
  ]

  function onLog (name) {
    log.value = name
  }
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
