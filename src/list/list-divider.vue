<template>
  <div class="mu-list-divider" />
</template>

<script>
  export default {
    name: 'MusselListDivider'
  }
</script>

<style lang="postcss">
  .mu-list-divider {
    display: block;
    margin-top: 4px;
    margin-bottom: 4px;
    height: 1px;
    border-bottom: 1px solid $(listDividerColor);

    &:first-child, &:last-child {
      display: none;
    }
  }
</style>
