<template>
  <div
    class="mu-tabs-header mu-flex-box"
    :tab-position="tabPosition"
    :direction="direction">
    <slot name="header-prefix" />
    <div
      v-for="item in items"
      :key="item.name"
      class="mu-tab-item"
      :disabled="item.disabled"
      :active="activeName === item.name"
      @click="onTabClick(item)">
      <span class="mu-tab-label mu-text-ellipsis">
        {{ item.label || item.name }}
      </span>
    </div>
    <slot name="header-suffix" />
  </div>
</template>

<script>
  import isString from 'lodash.isstring'

  export default {
    name: 'MusselTabsHeader',
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
      modelControl: {
        type: String,
        default: 'both',
        validator (v) {
          return ['both', 'external'].indexOf(v) !== -1
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
          if (this.modelControl !== 'external') {
            this.activeName = item.name
          }
          this.$emit('change', item.name)
        }
      }
    }
  }
</script>
