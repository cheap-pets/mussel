<template>
  <span
    class="mu-icon"
    :icon="icon"
    :class="iconClass"
    :trigger-type="triggerType"
    @click="onClick">
    <span v-if="html" v-html="html" />
    <svg v-else-if="paths" :viewBox="viewBox">
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
      svg: String,
      icon: String,
      iconClass: String,
      triggerType: String,
      viewBox: {
        type: String,
        default: '0 0 1024 1024'
      }
    },
    computed: {
      iconName () {
        return this.iconClass
          ? undefined
          : (
            this.triggerType
              ? triggerIcons[this.triggerType]
              : this.icon
          )
      },
      svgData () {
        const { iconClass, iconName, svg } = this
        return iconClass
          ? undefined
          : (iconName ? d[iconName] : svg)
      },
      html () {
        return String(this.svgData).indexOf('<svg') !== -1
          ? this.svgData
          : undefined
      },
      paths () {
        const data = (this.iconClass || this.html)
          ? undefined
          : this.svgData

        return data
          ? (Array.isArray(data) ? data : [data])
          : undefined
      }
    },
    methods: {
      onClick () {
        this.$emit('click')
      }
    }
  }
</script>
