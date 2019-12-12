<template>
  <div
    class="mu-sidebar"
    collapsed="collapsed">
    <div
      class="mu-sidebar_container mu-absolute-fit mu-flex-box"
      direction="column">
      <div v-if="headerVisible" class="mu-sidebar_header">
        <a
          v-if="collapseBtnPosition === 'top'"
          class="mu-sidebar_collapse-button" />
        <slot v-show="!collapsed" name="header" />
      </div>
      <div class="mu-sidebar_body" size="1">
        <slot v-show="!collapsed" />
      </div>
      <div v-if="footerVisible" class="mu-sidebar_footer">
        <a
          v-if="collapseBtnPosition === 'bottom'"
          class="mu-sidebar_collapse-button">
          <mu-icon icon="collapse" />
        </a>
        <slot v-show="!collapsed" name="footer" />
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'MusselSidebar',
    provide () {
      return {
        sidebar: this
      }
    },
    props: {
      collapsible: Boolean,
      collapseButtonPosition: {
        type: String,
        validator (v) {
          return ['top', 'bottom'].indexOf(v) !== -1
        }
      }
    },
    data () {
      return {
        collapsed: false
      }
    },
    computed: {
      collapseBtnPosition () {
        const { header, footer } = this.$slots
        return this.collapsible
          ? (
            this.collapseButtonPosition ||
            (footer || !header ? 'bottom' : 'top')
          )
          : ''
      },
      headerVisible () {
        return this.$slots.header ||
          (this.collapsible && this.collapseBtnPosition === 'top')
      },
      footerVisible () {
        return this.$slots.footer ||
          (this.collapsible && this.collapseBtnPosition === 'bottom')
      }
    }
  }
</script>
