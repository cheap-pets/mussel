<template>
  <span
    class="mu-icon"
    :icon="icon"
    :class="[className, iconClass]"
    :trigger-type="triggerType"
    @click="onClick">
    <svg
      v-if="paths"
      :viewBox="viewBox"
      :width="size"
      :height="size">
      <path v-for="d in paths" :key="d" :d="d" />
    </svg>
  </span>
</template>

<script>
  import d from './d'

  const triggerIcons = {
    close: 'close',
    clear: 'clear',
    dropdown: 'key-down',
    expander: 'key-down'
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
      },
      viewBox: {
        type: String,
        default: '0 0 1024 1024'
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
      paths () {
        const data = this.svgData || (this.iconName ? d[this.iconName] : null)
        return data
          ? (Array.isArray(data) ? data : [data])
          : null
      }
    },
    methods: {
      onClick () {
        this.$emit('click')
      }
    }
  }
</script>
