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
        :style="leftHeadStyle"
        :shadow="leftShadowVisible"
        :columns="columnGroups.left"
        @sizechange.native="onLeftTableResize" />
      <table-head-group
        v-if="columnGroups.center"
        class="mu-table_head-center"
        :style="centerHeadStyle"
        :columns="columnGroups.center" />
      <table-head-group
        v-if="columnGroups.right"
        class="mu-table_head-right"
        :style="rightHeadStyle"
        :shadow="rightShadowVisible"
        :columns="columnGroups.right"
        @sizechange.native="onRightTableResize" />
    </div>
    <div
      v-if="ready && data.length"
      v-mussel-scrollbar="{ observeMutation: false }"
      class="mu-table_body"
      @scroll="onBodyScroll"
      @sizechange="onBodyResize">
      <table-body-group
        v-if="columnGroups.left"
        class="mu-table_body-left"
        :style="leftBodyStyle"
        :shadow="leftShadowVisible"
        :columns="columnGroups.left" />
      <table-body-group
        class="mu-table_body-center"
        :style="centerBodyStyle"
        :columns="columnGroups.center" />
      <table-body-group
        v-if="columnGroups.right"
        class="mu-table_body-right"
        :style="rightBodyStyle"
        :shadow="rightShadowVisible"
        :columns="columnGroups.right" />
    </div>
  </div>
</template>

<script>
  import debounce from 'lodash.debounce'
  import throttle from 'lodash.throttle'

  import requestAnimationFrame from '@/utils/request-animation-frame'

  import TableHeadGroup from './table-head-group.vue'
  import TableBodyGroup from './table-body-group.vue'

  import './table.pcss'

  const ElementClasses = {
    head: '.mu-table_head',
    body: '.mu-table_body',
    bodyCenter: '.mu-table_body-center'
  }

  export default {
    name: 'MusselTable',
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
      },
      data: {
        type: Array,
        default () {
          return []
        }
      }
    },
    data () {
      return {
        ready: false,
        scrollLeft: 0,
        keyField: null,
        editingCell: null,
        leftTableWidth: null,
        rightTableWidth: null,
        leftShadowVisible: false,
        rightShadowVisible: false,
        headValues: {},
        footValues: {}
      }
    },
    computed: {
      bodyHeight () {
        return this.rowHeight * this.data.length + 'px'
      },
      leftHeadStyle () {
        return {
          left: this.scrollLeft + 'px'
        }
      },
      rightHeadStyle () {
        return {
          right: -this.scrollLeft + 'px'
        }
      },
      centerHeadStyle () {
        const { left, right } = this.columnGroups

        return {
          paddingLeft: left.length ? this.leftTableWidth : undefined,
          paddingRight: right.length ? this.rightTableWidth : undefined
        }
      },
      leftBodyStyle () {
        return {
          left: this.scrollLeft + 'px',
          width: this.leftTableWidth,
          height: this.bodyHeight
        }
      },
      rightBodyStyle () {
        return {
          right: -this.scrollLeft + 'px',
          width: this.rightTableWidth,
          height: this.bodyHeight
        }
      },
      centerBodyStyle () {
        return {
          ...this.centerHeadStyle,
          height: this.bodyHeight
        }
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
      this.columnGroups = { left: [], center: [], right: [] }
      this.scrollTop = 0
      this.scrollDirection = 1
      this.cachedElements = {}
    },
    mounted () {
      document.addEventListener('mousedown', this.cancelEditing)
    },
    beforeDestroy () {
      document.removeEventListener('mousedown', this.cancelEditing)
    },
    methods: {
      onRecordsChange: throttle(
        function (value, oldValue) {
          if (this.$el && oldValue) {
            const body = this.getCachedElements('body')
            if (body) body.scrollTop = 0
          }
          if (value?.length) { // && !this.keyField
            value.forEach((el, idx) => {
              // if (!el._uid)
              el._uid = +new Date() + '_' + idx
            })
          }
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
        if (!this.cachedElements[key]) {
          this.cachedElements[key] = this.$el.querySelector(ElementClasses[key])
        }
        return this.cachedElements[key]
      },

      onLeftTableResize (e) {
        this.leftTableWidth = e.target.offsetWidth + 'px'
      },
      onRightTableResize (e) {
        this.rightTableWidth = e.target.offsetWidth + 'px'
      },

      setFixedShadow () {
        const bodyEl = this.getCachedElements('body')
        const bodyCenterEl = this.getCachedElements('bodyCenter')

        const { scrollLeft, clientWidth } = bodyEl

        this.leftShadowVisible = scrollLeft > 0
        this.rightShadowVisible =
          scrollLeft + clientWidth < bodyCenterEl.offsetWidth
      },
      onBodyResize: throttle(
        function (e) {
          const bodyCenterEl = this.getCachedElements('bodyCenter')

          if (bodyCenterEl) {
            const bodyEl = e.target
            const maxLeft = Math.max(
              bodyCenterEl.offsetWidth - bodyEl.clientWidth,
              0
            )

            if (bodyEl.scrollLeft > maxLeft) bodyEl.scrollLeft = maxLeft

            this.setFixedShadow()
          }
        },
        50,
        { leading: false, trailing: true }
      ),

      onBodyScroll (e) {
        const scrollLeft = e.target.scrollLeft

        if (this.scrollLeft !== scrollLeft) {
          requestAnimationFrame(() => {
            const headEl = this.getCachedElements('head')
            if (headEl) headEl.scrollLeft = scrollLeft

            this.setFixedShadow()
            this.scrollLeft = scrollLeft
          }, 'table.onBodyScroll')
        }
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
