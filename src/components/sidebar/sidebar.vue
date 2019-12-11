<template>
  <div class="mu-sidebar mu-flex-box" direction="column" collapsed="collapsed">
    <div v-if="headerVisible" class="mu-sidebar_header">
      <slot v-if="!collapsed" name="header" />
    </div>
    <div class="mu-sidebar_body" size="1">
      <slot v-if="!collapsed" />
    </div>
    <div v-if="footerVisible" class="mu-sidebar_footer">
      <slot v-if="!collapsed" name="footer" />
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      collapsible: Boolean,
      collapseButtonPosition: {
        type: String,
        validator (v) {
          return ['top', 'bottom'].indexOf(v) !== -1
        }
      },
      header: {
        type: Boolean,
        default: true
      },
      footer: {
        type: Boolean,
        default: true
      }
    },
    computed: {
      collapseBtnPosition () {
        const { header, footer } = this.$options.slots
        return this.collapseButtonPosition ||
          (footer || !header ? 'bottom' : 'top')
      },
      headerVisible () {
        return this.$options.slots.header ||
          this.collapseBtnPosition === 'top'
      },
      footerVisible () {
        return this.$options.slots.footer ||
          this.collapseBtnPosition === 'bottom'
      }
    }
  }
</script>
