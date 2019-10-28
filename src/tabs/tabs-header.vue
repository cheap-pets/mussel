<template>
  <div
    class="mu-tabs-header mu-flex-box"
    :tab-position="tabPosition"
    :direction="direction">
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
    <slot />
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
    font-size: 1rem;

    &[tab-position=top] {
      border-bottom: 2px solid rgba(0, 0, 0, .2);
      & > .mu-tab-item {
        padding-bottom: 8px;
      }
      & > [active]:after {
        bottom: -2px;
      }
    }
    &[tab-position=bottom] {
      border-top: 2px solid rgba(0, 0, 0, .2);
      & > .mu-tab-item {
        padding-top: 8px;
      }
      & > [active]:after {
        top: -2px;
      }
    }
    &[tab-position=left] {
      border-right: 2px solid rgba(0, 0, 0, .2);
      & > .mu-tab-item {
        padding-right: 16px;
        text-align: right;
      }
      & > [active]:after {
        right: -2px;
      }
    }
    &[tab-position=right] {
      border-left: 2px solid rgba(0, 0, 0, .2);
      & > .mu-tab-item {
        padding-left: 16px;
      }
      & > [active]:after {
        left: -2px;
      }
    }
  }
  .mu-tab-item {
    position: relative;
    cursor: pointer;
    max-width: 150px;

    & > .mu-tab-label {
      display: inline-block;
      width: 100%;
      float: left;
    }

    &:hover {
      color: $primaryColor;
    }
    &[active] {
      color: $primaryColor;
      &:after {
        position: absolute;
        content: '';
        background-color: $primaryColor;
      }
    }
  }
  [tab-position=top],
  [tab-position=bottom] {

    & > .mu-tab-item {
      &[active]:after {
        left: 0;
        right: 0;
        height: 2px;
      }
      & + .mu-tab-item  {
        margin-left: 20px;
      }
    }
  }
  [tab-position=left],
  [tab-position=right] {
    align-items: stretch;

    & > .mu-tab-item {
      padding: 10px 0;
      &[active]:after {
        top: 0;
        bottom: 0;
        width: 2px;
      }
    }
  }
</style>
