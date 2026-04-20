<template>
  <span class="mu-sort-icon">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="var(--mu-gray)"
      stroke="none"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round">
      <text>1</text>
      <path d="M18 10l-6 -6l-6 6h12" :fill="direction === 'up' ? 'currentColor' : null" />
      <path d="M18 14l-6 6l-6 -6h12" :fill="direction === 'down' ? 'currentColor' : null" />
    </svg>
  </span>
</template>

<script setup>
  defineProps({
    direction: {
      type: String,
      validate: v => ['up', 'down'].includes(v)
    }
  })
</script>
