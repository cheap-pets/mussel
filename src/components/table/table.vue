<template>
  <v-box
    class="mu-table"
    :width="width"
    :style="tableStyle"
    :gridline="gridline"
    :hover-mode="hoverMode">
    <div v-show="false">
      <slot />
    </div>
    <template v-if="ready">
      <h-box class="mu-table_head">
        <table-head-group
          v-if="columnGroups.left"
          class="mu-table_head-left"
          table-fixed="left"
          :columns="columnGroups.left"
          @sizechange.native="onLeftTableResize" />
        <table-head-group
          v-if="columnGroups.center"
          :columns="columnGroups.center"
          :size="centerSize"
          class="mu-table_head-center"
          style="overflow: hidden;" />
        <table-head-group
          v-if="columnGroups.right"
          class="mu-table_head-right"
          table-fixed="right"
          :columns="columnGroups.right"
          @sizechange.native="onRightTableResize" />
      </h-box>
      <h-box
        v-mussel-scrollbar="scrollbarYOptions"
        class="mu-table_body"
        size="auto"
        @scroll.native="onRowScroll"
        @mouseleave.native="onBodyMouseLeave"
        @sizechange.native="onBodyResize">
        <table-body-group
          v-if="columnGroups.left"
          class="mu-table_body-left"
          table-fixed="left"
          :columns="columnGroups.left"
          :style="bodyGroupStyle"
          :width="leftTableSize" />
        <table-body-group
          v-if="columnGroups.center"
          v-mussel-scrollbar="scrollbarXOptions"
          class="mu-table_body-center"
          :size="centerSize"
          :columns="columnGroups.center"
          :style="bodyGroupStyle"
          @scroll.native="onColScroll" />
        <table-body-group
          v-if="columnGroups.right"
          class="mu-table_body-right"
          table-fixed="right"
          :columns="columnGroups.right"
          :style="bodyGroupStyle"
          :width="rightTableSize" />
      </h-box>
    </template>
  </v-box>
</template>

<script>
  import throttle from 'lodash.throttle'

  import VBox from '../layout/flex-v-box'
  import HBox from '../layout/flex-h-box'
  import TableHeadGroup from './table-head-group.vue'
  import TableBodyGroup from './table-body-group.vue'

  import updateCache from './update-cache'

  import './table.pcss'

  export default {
    name: 'MusselTable',
    components: {
      VBox,
      HBox,
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
      rowHeight: {
        type: Number,
        default: 40,
        validator (v) {
          return !v || (v >= 30 && v <= 80)
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
        leftTableSize: 0,
        rightTableSize: 0,
        hoverRow: null,
        hoverCol: null,
        cachedData: [],
        headerValues: {}
      }
    },
    computed: {
      tableStyle () {
        return {
          height: (this.height && this.height !== 'auto')
            ? this.height
            : undefined,
          width: (this.width && this.width !== 'auto')
            ? this.width
            : undefined
        }
      },
      centerSize () {
        return this.width === 'auto' ? undefined : 1
      },
      bodyGroupStyle () {
        return this.rowHeight
          ? { height: this.rowOffsetHeight * this.data.length + 'px' }
          : undefined
      },
      scrollbarYOptions () {
        return {
          enable: this.height !== 'auto',
          wheelSpeed: 0.5,
          scrollbarX: false,
          observeMutation: false
        }
      },
      scrollbarXOptions () {
        return {
          enable: this.width !== 'auto',
          wheelSpeed: 0.5,
          scrollbarY: false,
          stickToParent: true,
          observeMutation: false
        }
      },
      rowOffsetHeight () {
        const borderWidth =
          ['row', 'both'].indexOf(this.gridline) === -1
            ? 0
            : 1
        return this.rowHeight
          ? this.rowHeight + borderWidth
          : undefined
      }
    },
    watch: {
      data (v) {
        this.updateCache()
      }
    },
    beforeCreate () {
      this.columns = []
      this.columnGroups = { left: [], center: [], right: [] }
      this.scrollTop = 0
      this.scrollDirection = 1
    },
    methods: {
      updateCache,
      setColumnGroups () {
        this.ready = false

        if (this._composeTimer) clearTimeout(this._composeTimer)
        this._composeTimer = setTimeout(() => {
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

          delete this._composeTimer
        }, 50)
      },
      registerColumn (column) {
        if (column.field === '_selected') {
          this.multiSelect = true
        }
        this.columns.push(column)
        this.setColumnGroups()
      },
      unregisterColumn (columnId) {
        const idx = this.columns.findIndex(col => col._uid === columnId)
        if (idx >= 0) {
          this.columns.splice(idx)
          this.setColumnGroups()
        }
      },
      onLeftTableResize (e) {
        this.leftTableSize = e.target.clientWidth
      },
      onRightTableResize (e) {
        this.rightTableSize = e.target.clientWidth
      },
      onBodyResize: throttle(
        function (e) {
          this.visibleRowCount = this.rowOffsetHeight
            ? Math.ceil(e.target.clientHeight / this.rowOffsetHeight)
            : 0
          this.updateCache()
        },
        500,
        { leading: true, trailing: true }
      ),
      onRowScroll: throttle(
        function (e) {
          if (!this.rowHeight) return
          this.scrollDirection = Math.sign(e.target.scrollTop - this.scrollTop)
          if (this.scrollDirection) {
            this.scrollTop = e.target.scrollTop
            this.updateCache()
          }
        },
        500,
        { leading: false, trailing: true }
      ),
      onColScroll (e) {
        const headEl = this.$el.querySelector('.mu-table_head-center')
        if (headEl) headEl.scrollLeft = e.target.scrollLeft
      },
      onBodyMouseLeave () {
        this.hoverRow = null
        this.hoverCol = null
      },
      selectAll () {
        // this.cachedData.forEach(item => {
        //   this.$set(item.rec, this.selectedField, true)
        // })
        this.data.forEach(rec => {
          this.$set(rec, this.selectedField, true)
        })
      },
      unselectAll () {
        // this.cachedData.forEach(item => {
        //   this.$set(item.rec, this.selectedField, false)
        // })
        this.data.forEach(rec => {
          this.$set(rec, this.selectedField, false)
        })
      },
      setRecordValue (record, field, value) {
        this.$set(record, field, value)
      },
      setHeaderValue (field, value) {
        this.$set(this.headerValues, field, value)
      }
    }
  }
</script>
