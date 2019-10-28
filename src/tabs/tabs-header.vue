<template>
  <div
    class="mu-tabs-header mu-flex-box"
    :tab-position="tabPosition"
    :direction="direction">
    <div
      v-for="item in items"
      :key="item.name"
      :class="'mu-tab-item'"
      :disabled="item.disabled"
      :active="activeName === item.name"
      @click="onTabClick(item)">
      {{ item.label || item.name }}
    </div>
    <div class="mu-tabs-indicator" />
    <slot />
  </div>
</template>

<script>
  import isString from 'lodash.isstring'

  export default {
    inject: {
      tabs: {
        default: null
      }
    },
    model: {
      prop: 'activeTab',
      event: 'change'
    },
    props: {
      tabItems: Array,
      tabPosition: {
        type: String,
        default: 'top',
        validator (v) {
          return ['top', 'bottom', 'left', 'right'].indexOf(v) !== -1
        }
      },
      activeTab: String
    },
    data () {
      return {
        activeName: ''
      }
    },
    computed: {
      direction () {
        return this.tabPosition === 'top' || this.tabPosition === 'bottom'
          ? 'row'
          : 'column'
      },
      items () {
        return this.tabItems
          ? this.tabItems.map(item => isString(item) ? { name: item } : item)
          : []
      }
    },
    watch: {
      activeTab: {
        handler (value) {
          this.activeName = value
        },
        immediate: true
      }
    },
    methods: {
      onTabClick (item) {
        if (this.tabs) {
          this.tabs.select(item.name)
        } else {
          this.activeName = item.name
          this.$emit('change', item.name)
        }
      }
    }
  }
</script>

<style lang="postcss">
  .mu-tabs-header {
    &[tab-position=top] {
      height: 40px;
      align-items: center;
      border-bottom: 2px solid rgba(0, 0, 0, .2);
    }
    &[tab-position=bottom] {
      height: 40px;
      align-items: center;
      border-top: 2px solid rgba(0, 0, 0, .2);
    }
    &[tab-position=left] {
      border-right: 2px solid rgba(0, 0, 0, .2);
      & > .mu-tab-item {
        padding: 8px;
      }
    }
    &[tab-position=right] {
      border-left: 2px solid rgba(0, 0, 0, .2);
      & > .mu-tab-item {
        padding: 8px;
      }
    }
  }
  .mu-tab-item {
    line-height: 20px;
    cursor: pointer;
  }
</style>
