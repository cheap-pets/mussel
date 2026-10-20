<template>
  <div class="home">
    <header class="home-hero">
      <div>
        <h1 class="home-hero__title">Mussel</h1>
        <p class="home-hero__version">Vue 3 组件库 · v{{ appVersion }}</p>
      </div>
      <theme-switch class="home-hero__switch" />
    </header>

    <main class="home-main">
      <section
        v-for="cat in catalog"
        :key="cat.category"
        class="home-category">
        <h2 class="home-category__title">{{ cat.title }}</h2>
        <p class="home-category__desc">{{ cat.desc }}</p>
        <div class="home-category__pages">
          <a
            v-for="page in cat.pages"
            :key="page.path"
            class="home-page-card"
            :href="`/${page.path}/`">
            <span class="home-page-card__title">{{ page.title }}</span>
            <span class="home-page-card__desc">{{ page.desc }}</span>
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
  import ThemeSwitch from '../common/theme-switch.vue'
  import { catalog } from '../catalog.js'

  const appVersion = __version__
</script>
