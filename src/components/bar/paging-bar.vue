<template>
  <h-box class="mu-bar mu-paging-bar" align-items="center">
    <mu-button
      icon="key-left"
      :disabled="disabled || !pageIndex"
      @click="goPrev" />
    <label>{{ currentPageCaption }}</label>
    <mu-button
      icon="key-right"
      :disabled="disabled || eof"
      @click="goNext" />
    <mu-space />
    <mu-button
      v-if="reload"
      icon="refresh"
      :disabled="disabled"
      @click="doReload" />
  </h-box>
</template>

<script>
  import './paging-bar.pcss'

  import lang from '../../lang'

  import HBox from '../layout/flex-h-box'
  import Space from '../layout/space.vue'
  import Button from '../button/button.jsx'

  export default {
    components: {
      HBox,
      'mu-space': Space,
      'mu-button': Button
    },
    props: {
      pageIndex: {
        type: Number,
        default: 0
      },
      eof: Boolean,
      reload: Boolean,
      disabled: Boolean
    },
    computed: {
      currentPageCaption () {
        return lang.Bar.CURRENT_PAGE.replace('%s', this.pageIndex + 1)
      }
    },
    methods: {
      goPrev () {
        this.$emit('prev')
      },
      goNext () {
        this.$emit('next')
      },
      doReload () {
        this.$emit('reload')
      }
    }
  }
</script>
