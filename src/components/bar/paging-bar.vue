<template>
  <div class="mu-flex-box mu-bar mu-paging-bar" align-items="center">
    <mu-icon-button
      icon="key-left"
      :disabled="disabled || !pageIndex"
      @click="goPrev" />
    <label>
      {{ resources.currentPagePrefix }}
      <span contenteditable>{{ pageIndex + 1 }}</span>
      {{ resources.currentPageSuffix }}
    </label>
    <mu-icon-button
      icon="key-right"
      :disabled="disabled || eof"
      @click="goNext" />
    <template v-if="reload">
      <mu-space />
      <mu-icon-button icon="refresh" :disabled="disabled" @click="doReload" />
    </template>
  </div>
</template>

<script>
  import './paging-bar.pcss'

  import lang from '@/lang'

  import Space from '../layout/space.vue'
  import IconButton from '../button/icon-button.jsx'

  const { CURRENT_PAGE, TOTAL_PAGES } = lang.Bar

  export default {
    components: {
      'mu-space': Space,
      'mu-icon-button': IconButton
    },
    props: {
      recordCount: Number,
      pageIndex: {
        type: Number,
        default: 0
      },
      pageSize: Number,
      eof: Boolean,
      reload: Boolean,
      disabled: Boolean
    },
    computed: {
      resources () {
        const currentPageRes = CURRENT_PAGE.split('%s')
        const totalPagesRes = TOTAL_PAGES.split('%s')

        return {
          currentPagePrefix: currentPageRes[0].trim(),
          currentPageSuffix: currentPageRes[1].trim(),
          totalPagesPrefix: totalPagesRes[0].trim(),
          totalPagesSuffix: totalPagesRes[1].trim()
        }

        // return lang.Bar.CURRENT_PAGE.replace('%s', this.pageIndex + 1)
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
