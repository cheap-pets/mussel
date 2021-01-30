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
        @mouseleave.native="onBodyMouseLeave">
        <table-body-group
          v-if="columnGroups.left"
          class="mu-table_body-left"
          table-fixed="left"
          :columns="columnGroups.left"
          :style="bodyGroupStyle"
          :width="leftTableSize"
          :data="cachedData" />
        <table-body-group
          v-if="columnGroups.center"
          v-mussel-scrollbar="scrollbarXOptions"
          class="mu-table_body-center"
          :size="centerSize"
          :columns="columnGroups.center"
          :style="bodyGroupStyle"
          :data="cachedData"
          @scroll.native="onColScroll" />
        <table-body-group
          v-if="columnGroups.right"
          class="mu-table_body-right"
          table-fixed="right"
          :columns="columnGroups.right"
          :style="bodyGroupStyle"
          :width="rightTableSize"
          :data="cachedData" />
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
        default: 40
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
      }
    },
    data () {
      return {
        ready: false,
        scrollTop: 0,
        scrollDirection: 1,
        leftTableSize: 0,
        rightTableSize: 0,
        hoverRow: null,
        hoverCol: null,
        cachedData: []
      }
    },
    computed: {
      cacheAll () {
        return !this.rowHeight || this.data.length <= 100
      },
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
          scrollbarX: false
        }
      },
      scrollbarXOptions () {
        return {
          enable: this.width !== 'auto',
          scrollbarY: false,
          stickToParent: true
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
      data: {
        handler (v) {
          this.cacheData()
        },
        immediate: true
      }
    },
    beforeCreate () {
      this.columns = []
      this.columnGroups = { left: [], center: [], right: [] }
    },
    methods: {
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
      onRowScroll: throttle(
        function (e) {
          if (this.cacheAll) return
          this.scrollDirection = Math.sign(e.target.scrollTop - this.scrollTop)
          this.scrollTop = e.target.scrollTop
          this.cacheData()
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
      cacheData () {
        const { cacheAll, scrollDirection: direction } = this // cachedData

        if (cacheAll) {
          this.cachedData = this.data.map(
            (rec, idx) => ({ rec, idx })
          )
        } else if (direction) {
          const i = parseInt(this.scrollTop / this.rowOffsetHeight)

          const up = direction > 0 ? 20 : 50
          const down = 70 - up
          const start = Math.max(i - up - (i & 1), 0)
          const end = Math.min(i + down, this.data.length - 1) + 1

          // if (cachedData.length) {
          //   const first = cachedData[0].idx
          //   const last = first + cachedData.length - 1
          // }

          this.cachedData = this
            .data
            .slice(start, end)
            .map((rec, idx) => ({ rec, idx: idx + start }))
        }
      }
    }
  }
</script>
