<template>
  <div class="demo-page" :class="{ 'demo-page--fluid': fluid }">
    <header class="demo-page__bar">
      <a class="demo-page__home" href="/">Mussel</a>
      <span class="demo-page__crumb">
        <template v-if="category">
          <span class="demo-page__category">{{ category.title }}</span>
          <span class="demo-page__crumb-divider">/</span>
        </template>
        <span class="demo-page__title">{{ title }}</span>
      </span>
      <theme-switch class="demo-page__theme" />
    </header>

    <main class="demo-page__body">
      <slot />
    </main>

    <footer
      v-if="prevPage || nextPage"
      class="demo-page__footer">
      <a
        v-if="prevPage"
        class="demo-page__nav"
        :href="pageUrl(prevPage.path)">
        ← {{ prevPage.title }}
      </a>
      <span v-else />
      <a
        v-if="nextPage"
        class="demo-page__nav demo-page__nav--next"
        :href="pageUrl(nextPage.path)">
        {{ nextPage.title }} →
      </a>
    </footer>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  import ThemeSwitch from './theme-switch.vue'
  import { findCatalogPage, flattenCatalog } from '../catalog.js'

  const props = defineProps({
    // 对应 catalog 中的页面路径，用于查询标题、面包屑与上一页/下一页
    path: { type: String, required: true },
    // 案例页专用：内容区全宽，不做 max-width 与卡片包裹
    fluid: { type: Boolean, default: false }
  })

  const located = computed(() => findCatalogPage(props.path))

  const title = computed(() => located.value?.page.title || props.path)
  const category = computed(() => located.value?.category || null)

  const prevPage = computed(() => {
    const { index } = located.value || {}
    return Number.isInteger(index) && index > 0
      ? flattenCatalog()[index - 1].page
      : null
  })

  const nextPage = computed(() => {
    const { index } = located.value || {}
    const pages = flattenCatalog()
    return Number.isInteger(index) && index < pages.length - 1
      ? pages[index + 1].page
      : null
  })

  function pageUrl (path) {
    return `/${path}/`
  }

  if (!located.value) {
    console.warn(`[demo-page] 未知的页面路径 "${props.path}"，请检查 catalog.js`)
  }
</script>
