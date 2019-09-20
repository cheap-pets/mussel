<template>
  <div class="mu-list-item" @click="onClick">
    <mu-icon
      v-if="icon || iconClass || keepIconIndent"
      :icon="icon"
      :icon-class="iconClass"
      @click="onButtonClick" />
    <slot>{{ caption }}</slot>
  </div>
</template>

<script>
  import Icon from '../icon/index.vue'

  export default {
    components: {
      'mu-icon': Icon
    },
    inject: {
      keepIconIndent: {
        default: false
      }
    },
    props: {
      icon: String,
      iconClass: String,
      label: String,
      active: Boolean,
      disabled: Boolean
    },
    computed: {
      caption () {
        return this.label
      }
    },
    methods: {
      onClick () {
        if (!this.disabled) this.$emit('click')
      },
      onButtonClick () {
        if (!this.disabled) this.$emit('buttonclick')
      }
    }
  }
</script>

<style lang="postcss">
  .mu-list-item {
    position: relative;
    line-height: $(listItemLineHeightPx)px;
    padding: $(listItemYPaddingPx)px $(listItemXPaddingPx)px;
    overflow: hidden;

    &:hover {
      color: $primaryColor;
      fill: $primaryColor;
      background: $listItemHoverBackground;
    }

    &.active {
      color: #fff;
      fill: #fff;
      background: $primaryColor;
    }

    & > .mu-icon:first-child {
      display: inline-block;
      width: 20px;
    }

    &:not([multi-lines]) {
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: default;
    }
  }

  .mu-list-divider {
    display: block;
    margin-top: 4px;
    margin-bottom: 4px;
    height: 1px;
    border-bottom: 1px solid $(listDividerColor);

    &:first-child, &:last-child {
      display: none;
    }
  }

  .mu-dropdown > .mu-list-item {
    padding: $(dropdownItemYPaddingPx)px $(listItemXPaddingPx)px;
    cursor: pointer;
  }
  .mu-dropdown-menu > .mu-list-item {
    &:hover {
      color: #fff;
      fill: #fff;
      background: $primaryColor;
    }
  }
</style>
