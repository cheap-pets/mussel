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
        fixed-area="left"
        :style="leftHeadStyle"
        :columns="columnGroups.left"
        @sizechange.native="onLeftTableResize" />
      <table-head-group
        v-if="columnGroups.center"
        :style="centerHeadStyle"
        :columns="columnGroups.center" />
      <table-head-group
        v-if="columnGroups.right"
        fixed-area="right"
        :style="rightHeadStyle"
        :columns="columnGroups.right"
        @sizechange.native="onRightTableResize" />
    </div>
    <div
      v-if="ready && cachedData"
      v-mussel-scrollbar="{ observeMutation: false }"
      class="mu-table_body"
      @scroll="onBodyScroll"
      @sizechange="onBodyResize"
      @mouseleave="onBodyMouseLeave">
      <table-body-group
        v-if="columnGroups.left"
        fixed-area="left"
        :style="leftBodyStyle"
        :columns="columnGroups.left" />
      <table-body-group
        :style="centerBodyStyle"
        :columns="columnGroups.center" />
      <table-body-group
        v-if="columnGroups.right"
        fixed-area="right"
        :style="rightBodyStyle"
        :columns="columnGroups.right" />
    </div>
  </div>
</template>

<script>
  import debounce from 'lodash.debounce'
  import throttle from 'lodash.throttle'

  import TableHeadGroup from './table-head-group.vue'
  import TableBodyGroup from './table-body-group.vue'

  import updateCache from './update-cache'

  import './table.pcss'

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
          return ['none', 'row', 'column', 'both'].indexOf(v) !== -1
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
      },
      selectedField: {
        type: String,
        default: '_selected'
      }
    },
    data () {
      return {
        ready: false,
        leftTableWidth: null,
        rightTableWidth: null,
        scrollLeft: 0,
        hoverRow: null,
        hoverCol: null,
        editingCell: null,
        cachedData: null,
        headerValues: {}
      }
    },
    computed: {
      bodyHeight () {
        return this.rowHeight * this.data.length + 'px'
      },
      centerHeadStyle () {
        const { left, right } = this.columnGroups

        return {
          paddingLeft: left.length ? this.leftTableWidth : undefined,
          paddingRight: right.length ? this.rightTableWidth : undefined
        }
      },
      leftHeadStyle () {
        return {
          width: this.leftTableWidth,
          left: this.scrollLeft + 'px'
        }
      },
      rightHeadStyle () {
        return {
          width: this.rightTableWidth,
          right: -this.scrollLeft + 'px'
        }
      },
      centerBodyStyle () {
        return {
          ...this.centerHeadStyle,
          height: this.bodyHeight
        }
      },
      leftBodyStyle () {
        return {
          ...this.leftHeadStyle,
          height: this.bodyHeight
        }
      },
      rightBodyStyle () {
        return {
          ...this.rightHeadStyle,
          height: this.bodyHeight
        }
      }
    },
    watch: {
      data (v) {
        this.cachedData = null
        if (this.$el) {
          const bodyEl = this.$el.querySelector('.mu-table_body')
          if (bodyEl) bodyEl.scrollTop = 0
          this.updateCache()
        }
      }
    },
    beforeCreate () {
      this.columns = []
      this.columnGroups = { left: [], center: [], right: [] }
      this.scrollTop = 0
      this.scrollDirection = 1
    },
    mounted () {
      document.addEventListener('mousedown', this.cancelEditing)
    },
    beforeDestroy () {
      document.removeEventListener('mousedown', this.cancelEditing)
    },
    methods: {
      updateCache,
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
        if (column.field === '_selected') {
          this.multiSelect = true
        }
        this.ready = false
        this.columns.push(column)
        this.setColumnGroups()
      },
      unregisterColumn (columnId) {
        const idx = this.columns.findIndex(col => col._uid === columnId)
        if (idx >= 0) {
          this.ready = false
          this.columns.splice(idx)
          this.setColumnGroups()
        }
      },
      onLeftTableResize (e) {
        this.leftTableWidth = e.target.clientWidth + 'px'
      },
      onRightTableResize (e) {
        this.rightTableWidth = e.target.clientWidth + 'px'
      },
      onBodyResize: throttle(
        function (e) {
          if (!e.target || !e.target.clientHeight) return
          this.visibleRowCount = this.rowHeight
            ? Math.ceil(e.target.clientHeight / this.rowHeight)
            : 0
          this.updateCache()
        },
        300,
        { leading: false, trailing: true }
      ),
      afterScroll: throttle(
        function (scrollTop) {
          this.scrollDirection = Math.sign(scrollTop - this.scrollTop)
          if (this.scrollDirection) {
            this.scrollTop = scrollTop
            this.updateCache()
          }
        },
        300,
        { leading: false, trailing: true }
      ),
      onBodyScroll (e) {
        const { scrollTop, scrollLeft } = e.target

        this.scrollLeft = scrollLeft

        const headEl = this.$el.querySelector('.mu-table_head')
        if (headEl) headEl.scrollLeft = scrollLeft

        this.afterScroll(scrollTop)
      },
      onBodyMouseLeave () {
        this.hoverRow = null
        this.hoverCol = null
      },
      selectAll () {
        if (this.data) {
          this.data.forEach(rec => {
            this.$set(rec, this.selectedField, true)
          })
        }
      },
      unselectAll () {
        if (this.data) {
          this.data.forEach(rec => {
            this.$set(rec, this.selectedField, false)
          })
        }
      },
      onCellChange (record, field, value) {
        this.$emit('cellchange', record, field, value)
      },
      setHeaderValue (field, value) {
        this.$set(this.headerValues, field, value)
      },
      cancelEditing (event) {
        this.editingCell = undefined
      }
    }
  }
</script>
