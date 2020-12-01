<template>
  <div
    class="mu-sidebar"
    :floating="floating"
    :collapsed="isCollapsed"
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
          <mu-icon :icon="menuIcon" />
        </a>
        <slot v-if="!isCollapsed" name="header" />
      </div>
      <div class="mu-sidebar_body" size="1">
        <div
          v-show="!isCollapsed"
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
          @mouseover="onCollapseBtnMouseOver"
          @click="toggleCollapse">
          <mu-icon :icon="menuIcon" />
        </a>
        <slot v-if="!isCollapsed" name="footer" />
      </div>
    </div>
  </div>
</template>

<script>
  import './sidebar.pcss'

  export default {
    name: 'MusselSidebar',
    provide () {
      return {
        sidebar: this
      }
    },
    props: {
      floatable: Boolean,
      collapsed: Boolean,
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
        floating: this.collapsed,
        isCollapsed: this.collapsed
      }
    },
    computed: {
      menuIcon () {
        return this.isCollapsed
          ? 'menu'
          : (this.floating ? 'pin' : 'pinned')
      },
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
        return (this.floating || this.isCollapsed) ? undefined : this.width
      },
      contentWidth () {
        return this.isCollapsed ? undefined : this.width
      }
    },
    methods: {
      toggleCollapse () {
        if (this.floatable) {
          this.floating = !this.floating
        } else {
          this.isCollapsed = !this.isCollapsed
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
          this.isCollapsed = true
        }, 300)
      },
      onCollapseBtnMouseOver () {
        if (!this.floating) return
        this.clearHoverTimer()
        this.isCollapsed = false
      },
      onCollapseBtnMouseLeave () {
        if (!this.floating) return
        this.clearHoverTimer()
        this.delayCollapse()
      }
    }
  }
</script>
