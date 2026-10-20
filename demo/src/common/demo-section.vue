<template>
  <section
    class="demo-section"
    :class="{
      'demo-section--wide': wide,
      'demo-section--vertical': vertical,
      'demo-section--regression': regression
    }">
    <header class="demo-section__header">
      <h3 class="demo-section__title">
        {{ title }}
        <span
          v-if="regression"
          class="demo-section__tag">回归</span>
      </h3>
      <p
        v-if="note"
        class="demo-section__note">{{ note }}</p>
    </header>

    <div class="demo-section__body">
      <slot />
    </div>

    <details
      v-if="code"
      class="demo-section__code">
      <summary>查看代码</summary>
      <pre><code>{{ code }}</code></pre>
    </details>
  </section>
</template>

<script setup>
  defineProps({
    title: { type: String, required: true },
    // 一句话说明；交互示例须写清触发方式与预期结果
    note: { type: String, default: '' },
    // 示例纵排（默认横排 wrap）
    vertical: { type: Boolean, default: false },
    // 宽示例占满内容区（table/calendar/长工具栏）
    wide: { type: Boolean, default: false },
    // 边界与回归场景，固定置于页末
    regression: { type: Boolean, default: false },
    // 基础用法代码片段（折叠展示）
    code: { type: String, default: '' }
  })
</script>
