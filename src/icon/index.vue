<template>
  <span
    class="mu-icon"
    :icon="icon"
    :class="[className, iconClass]"
    :trigger-type="triggerType"
    @click="onClick">
    <svg v-if="d" :icon="icon"
      viewBox="0 0 1024 1024"
      :width="size"
      :height="size">
      <path :d="d" />
    </svg>
  </span>
</template>

<script>
  import d from './d'
  import './trigger.pcss'

  const triggerIcons = {
    close: 'close',
    clear: 'clear',
    expander: 'key-down',
    dropdown: 'key-down'
  }

  export default {
    name: 'MusselIcon',
    props: {
      icon: String,
      svgData: String,
      iconClass: String,
      triggerType: String,
      size: {
        type: String,
        default: '1em'
      }
    },
    computed: {
      className () {
        return undefined
      },
      iconName () {
        const { icon, iconClass, triggerType } = this
        return icon ||
          (
            (iconClass || !triggerType)
              ? undefined
              : triggerIcons[triggerType]
          )
      },
      d () {
        return this.svgData || this.iconName ? d[this.iconName] : null
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
  .mu-icon {
    display: inline-block;

    & > svg {
      vertical-align: -0.15em;
    }
  }
</style>
