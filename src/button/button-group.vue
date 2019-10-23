<template>
  <div class="mu-button-group">
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselButtonGroup'
  }
</script>

<style lang="postcss">
  .mu-button-group {
    position: relative;
    display: inline-block;
    vertical-align: top;
    border-radius: $(buttonBorderRadiusPx)px;

    @if $buttonShadow == 1 {
      box-shadow: $boxShadowLevel1;
    }

    & > .mu-button {
      float: left;
      box-shadow: none;
      z-index : 0;

      &:hover:not([disabled]) {
        z-index : 1;
      }

      & + .mu-button {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        &[button-type]:not([button-type="normal"]):not(:hover):not([active]) {
          &:not([button-style]),
          &[button-style="normal"] {
            border-left-color: rgba(255, 255, 255, .5);
          }
        }
      }
      &:not(:last-child) {
        margin-right: -1px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }

  [button-shape="round"],
  [button-shape="round"] > .mu-button {
    border-radius: calc($buttonHeightPx / 2)px;
  }
</style>
