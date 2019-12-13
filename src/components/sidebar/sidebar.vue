<template>
  <div
    class="mu-sidebar"
    :floating="floating"
    :collapsed="collapsed"
    :style="{ width: sidebarWidth }">
    <div
      class="mu-sidebar_container mu-absolute-fit mu-flex-box"
      direction="column"
      :style="{ width: contentWidth }"
      @mouseleave="onCollapseBtnMouseLeave">
      <div
        v-if="headerVisible"
        class="mu-sidebar_header mu-flex-box">
        <a
          v-if="collapseBtnPosition === 'top'"
          class="mu-sidebar_collapse-button mu-button-like"
          @mouseover="onCollapseBtnMouseOver"
          @click="toggleCollapse">
          <mu-icon icon="collapse" />
        </a>
        <slot v-if="!collapsed" name="header" />
      </div>
      <div
        class="mu-sidebar_body"
        size="1">
        <div
          v-show="!collapsed"
          class="mu-sidebar_body-container mu-absolute-fit">
          <slot />
        </div>
      </div>
      <div
        v-if="footerVisible"
        class="mu-sidebar_footer mu-flex-box">
        <a
          v-if="collapseBtnPosition === 'bottom'"
          class="mu-sidebar_collapse-button mu-button-like"
          :class="{ 'mu-text-color-success': !floating }"
          @click="toggleCollapse">
          <mu-icon icon="collapse" />
        </a>
        <slot v-if="!collapsed" name="footer" />
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
      floatable: Boolean,
      collapsible: Boolean,
      collapseButtonPosition: {
        type: String,
        validator (v) {
          return ['top', 'bottom'].indexOf(v) !== -1
        }
      },
      width: {
        type: String,
        default: '240px'
      }
    },
    data () {
      return {
        floating: false,
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
      },
      sidebarWidth () {
        return (this.floating || this.collapsed) ? undefined : this.width
      },
      contentWidth () {
        return this.collapsed ? undefined : this.width
      }
    },
    methods: {
      toggleCollapse () {
        if (this.floatable) {
          this.floating = !this.floating
        } else {
          this.collapsed = !this.collapsed
        }
      },
      clearHoverTimer () {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer)
          delete this.hoverTimer
        }
      },
      delayCollapse () {
        this.hoverTimer = setTimeout(() => {
          this.collapsed = true
        }, 500)
      },
      onCollapseBtnMouseOver () {
        if (!this.floating) return
        this.clearHoverTimer()
        this.collapsed = false
      },
      onCollapseBtnMouseLeave () {
        if (!this.floating) return
        this.clearHoverTimer()
        this.delayCollapse()
      }
    }
  }
</script>
