<template>
  <mu-switch
    v-model="darkMode"
    active-icon="sun"
    inactive-icon="moon"
    @update:model-value="toggle" />
</template>

<script setup>
  import { ref, onMounted } from 'vue'

  const STORAGE_KEY = 'mu-dark-mode'

  const darkMode = ref(false)

  onMounted(() => {
    darkMode.value = localStorage.getItem(STORAGE_KEY) === 'true'
    applyTheme()
  })

  function toggle () {
    localStorage.setItem(STORAGE_KEY, darkMode.value)
    applyTheme()
  }

  function applyTheme () {
    const root = document.querySelector('.mu-root') || document.body
    root.classList.toggle('mu-dark', darkMode.value)
  }
</script>
