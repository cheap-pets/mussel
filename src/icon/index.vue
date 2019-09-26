<template>
  <span
    class="mu-icon"
    :class="className"
    :type="iconType"
    :icon="icon"
    @click="onClick">
    <svg v-if="icon" :icon="icon"
      viewBox="0 0 1024 1024"
      :width="size"
      :height="size">
      <path :d="d" />
    </svg>
  </span>
</template>

<script>
  import d from './d'

  export default {
    name: 'MusselIcon',
    props: {
      iconClass: String,
      icon: String,
      size: {
        type: String,
        default: '1em'
      }
    },
    computed: {
      d () {
        return d[this.icon]
      },
      className () {
        return this.iconClass
      },
      iconType () {
        return undefined
      }
    },
    methods: {
      onClick () {
        this.$emit('click')
      }
    }
  }
</script>

<style lang="postcss">
  .mu-icon > svg {
    vertical-align: -0.15em;
  }
</style>
