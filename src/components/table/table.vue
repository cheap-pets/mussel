<template>
  <div
    class="mu-table"
    :style="{ width, height }"
    :hover-mode="hoverMode"
    :gridline="gridline">
    <div v-show="false">
      <slot />
    </div>
    <div v-if="ready" class="mu-table_head">
      <table-head-group
        v-if="columnGroups.left"
        class="mu-table_head-left"
        :shadow="leftShadow"
        :columns="columnGroups.left"
        @sizechange.native="onLeftTableResize" />
      <table-head-group
        v-if="columnGroups.center"
        class="mu-table_head-center"
        :style="{ paddingLeft: leftWidth, paddingRight: rightWidth }"
        :columns="columnGroups.center" />
      <table-head-group
        v-if="columnGroups.right"
        class="mu-table_head-right"
        :shadow="rightShadow"
        :columns="columnGroups.right"
        @sizechange.native="onRightTableResize" />
    </div>
    <div
      v-if="ready && data.length"
      v-mussel-scrollbar="$options.scrollbarOptions"
      class="mu-table_body"
      @scroll="onBodyScroll"
      @sizechange="onBodyResize">
      <table-body-group
        v-if="columnGroups.left"
        class="mu-table_body-left"
        :style="{ width: leftWidth, height: bodyHeight }"
        :shadow="leftShadow"
        :columns="columnGroups.left" />
      <table-body-group
        class="mu-table_body-center"
        :style="{
          paddingLeft: leftWidth,
          paddingRight: rightWidth,
          height: bodyHeight
        }"
        :columns="columnGroups.center" />
      <table-body-group
        v-if="columnGroups.right"
        class="mu-table_body-right"
        :style="{ width: rightWidth, height: bodyHeight }"
        :shadow="rightShadow"
        :columns="columnGroups.right" />
    </div>
  </div>
</template>

<script>
  import debounce from 'lodash.debounce'
  import throttle from 'lodash.throttle'

  import requestAnimationFrame from '@/utils/request-animation-frame'
  import { isIE } from '@/utils/browser'

  import TableHeadGroup from './table-head-group.vue'
  import TableBodyGroup from './table-body-group.vue'

  import './table.pcss'

  const ElementClasses = {
    head: '.mu-table_head',
    headLeft: '.mu-table_head-left',
    headRight: '.mu-table_head-right',
    headCenter: '.mu-table_head-center',
    body: '.mu-table_body',
    bodyLeft: '.mu-table_body-left',
    bodyRight: '.mu-table_body-right',
    bodyCenter: '.mu-table_body-center'
  }

  export default {
    name: 'MusselTable',
    scrollbarOptions: { observeMutation: false, wheelSpeed: isIE ? 0.5 : 1 },
    components: {
      TableHeadGroup,
      TableBodyGroup
    },
    provide () {
      return {
        table: this
      }
    },
    props: {
      data: Array,
      width: String,
      height: String,
      virtualRender: Boolean,
      rowHeight: {
        type: Number,
        default: 40,
        validator (v) {
          return v >= 30 && v <= 100
        }
      },
      gridline: {
        type: String,
        default: 'row',
        validator (v) {
          return ['none', 'row', 'column', 'all', 'both'].indexOf(v) !== -1
        }
      },
      hoverMode: {
        type: String,
        default: 'row',
        validator (v) {
          return ['none', 'row', 'column', 'cross', 'cell'].indexOf(v) !== -1
        }
      }
    },
    data () {
      return {
        ready: false,
        scrollLeft: 0,
        keyField: null,
        editingCell: null,
        leftWidth: null,
        rightWidth: null,
        // headShadow: false,
        leftShadow: false,
        rightShadow: false,
        headValues: {},
        footValues: {}
      }
    },
    computed: {
      bodyHeight () {
        return this.rowHeight * this.data.length + 'px'
      }
    },
    watch: {
      data: {
        handler: 'onRecordsChange',
        immediate: true
      }
    },
    beforeCreate () {
      this.columns = []
      this.columnGroups = { center: [] }
      this.cachedElements = {}
    },
    mounted () {
      document.addEventListener('mousedown', this.cancelEditing)
    },
    beforeDestroy () {
      document.removeEventListener('mousedown', this.cancelEditing)

      delete this.cachedElements
      delete this.columnGroups
      delete this.columns
    },
    methods: {
      onRecordsChange: throttle(
        function (value, oldValue) {
          if (oldValue !== value) {
            const body = this.getCachedElements('body')
            if (body) body.scrollTop = 0
          }
          value?.forEach((el, idx) => {
            if (!el._uid) el._uid = +new Date() + '_' + idx
          })
        },
        50,
        { leading: false, trailing: true }
      ),
      removeCachedElements () {
        this.cachedElements = {}
      },
      setColumnGroups: debounce(function () {
        const groups = { left: [], center: [], right: [] }

        this.columns.forEach(col => {
          const group = (col.fixed === undefined || this.width === 'auto')
            ? groups.center
            : (
              col.fixed === 'right'
                ? groups.right
                : groups.left
            )
          group.push(col)
        })

        Object.keys(groups).forEach(key => {
          if (!groups[key].length) delete groups[key]
        })

        this.columnGroups = groups
        this.ready = true
      }, 50, { leading: false, trailing: true }),

      registerColumn (column) {
        this.ready = false
        this.columns.push(column)
        this.setColumnGroups()
        this.removeCachedElements()
      },
      unregisterColumn (columnId) {
        const idx = this.columns.findIndex(col => col._uid === columnId)
        if (idx >= 0) {
          this.ready = false
          this.columns.splice(idx)
          this.setColumnGroups()
          this.removeCachedElements()
        }
      },

      getCachedElements (key) {
        if (!this.cachedElements[key] && this.$el) {
          this.cachedElements[key] = this.$el.querySelector(ElementClasses[key])
        }
        return this.cachedElements[key]
      },

      onLeftTableResize (e) {
        this.leftWidth = e.target.offsetWidth + 'px'
      },
      onRightTableResize (e) {
        this.rightWidth = e.target.offsetWidth + 'px'
      },

      setEdgeShadow () {
        const bodyCenter = this.getCachedElements('bodyCenter')

        if (bodyCenter) {
          const { scrollLeft, clientWidth } = this.getCachedElements('body')

          this.leftShadow = scrollLeft > 0
          this.rightShadow = scrollLeft + clientWidth < bodyCenter.offsetWidth
        }
      },
      onBodyResize (e) {
        const body = e.target

        requestAnimationFrame(() => {
          // this.headShadow = body.scrollTop > 0

          const bodyCenter = this.getCachedElements('bodyCenter')

          if (bodyCenter) {
            const max = Math.max(bodyCenter.offsetWidth - body.clientWidth, 0)

            if (body.scrollLeft > max) body.scrollLeft = max
            else this.setEdgeShadow()
          }
        }, 'table.onBodyResize', { cancelPrevious: true })
      },
      onBodyScroll (e) {
        requestAnimationFrame(() => {
          const { scrollLeft } = e.target

          // this.headShadow = scrollTop > 0

          if (this.scrollLeft !== scrollLeft) {
            this.scrollLeft = scrollLeft

            const head = this.getCachedElements('head')
            if (head) head.scrollLeft = scrollLeft

            if (this.columnGroups.left) {
              const headLeft = this.getCachedElements('headLeft')
              const bodyLeft = this.getCachedElements('bodyLeft')

              if (headLeft) headLeft.style.left = scrollLeft + 'px'
              if (bodyLeft) bodyLeft.style.left = scrollLeft + 'px'
            }

            if (this.columnGroups.right) {
              const headRight = this.getCachedElements('headRight')
              const bodyRight = this.getCachedElements('bodyRight')

              if (headRight) headRight.style.right = -scrollLeft + 'px'
              if (bodyRight) bodyRight.style.right = -scrollLeft + 'px'
            }

            this.setEdgeShadow()
          }
        }, 'table.onBodyScroll', { cancelPrevious: true })
      },
      selectAll (field = '_selected') {
        if (this.data) {
          this.data.forEach(rec => {
            this.$set(rec, field, true)
          })
        }
      },
      unselectAll (field = '_selected') {
        if (this.data) {
          this.data.forEach(rec => {
            this.$set(rec, field, false)
          })
        }
      },
      onCellChange (record, field, value) {
        this.$emit('cellchange', record, field, value)
      },
      setHeadValue (field, value) {
        this.$set(this.headValues, field, value)
      },
      cancelEditing (event) {
        this.editingCell = undefined
      }
    }
  }
</script>
