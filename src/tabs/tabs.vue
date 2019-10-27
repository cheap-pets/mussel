<template>
  <mu-v-box class="mu-tabs">
    <mu-hbox>
      <div v-for="tab in tabs" :key="tab.name" class="mu-tab-item">
        {{ tab.label || tab.name }}
      </div>
    </mu-hbox>
  </mu-v-box>
</template>

<script>
  export default {
    data () {
      return {
        items: []
      }
    }
  }
</script>

<style lang="postcss">
  .mu-tabs {
    background: $tabsBackground;
  }
</style>
