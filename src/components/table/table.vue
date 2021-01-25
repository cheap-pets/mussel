<template>
  <v-box class="mu-table">
    <div v-show="false">
      <slot />
    </div>
    <template v-if="ready">
      <h-box class="mu-table_top">
        <table-head
          v-if="columnGroups.left"
          :columns="columnGroups.left"
          table-fixed="left"
          @sizechange.native="onLeftTableResize" />
        <table-head
          v-if="columnGroups.center"
          :columns="columnGroups.center"
          size="auto" />
        <table-head
          v-if="columnGroups.right"
          :columns="columnGroups.right"
          table-fixed="right"
          @sizechange.native="onRightTableResize" />
      </h-box>
      <h-box
        v-mussel-scrollbar
        class="mu-table_center"
        size="auto"
        @scroll.native="onScroll">
        <div
          v-if="rowHeight && data.length"
          :style="scrollHolderStyle" />
        <table-body
          v-if="columnGroups.left"
          table-fixed="left"
          :columns="columnGroups.left"
          :width="leftTableSize"
          :data="cachedData" />
        <table-body
          v-if="columnGroups.center"
          size="auto"
          :columns="columnGroups.center"
          :data="cachedData" />
        <table-body
          v-if="columnGroups.right"
          table-fixed="left"
          :columns="columnGroups.right"
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
  import TableHead from './table-head.vue'
  import TableBody from './table-body.vue'

  import './table.pcss'

  export default {
    components: {
      VBox,
      HBox,
      TableHead,
      TableBody
    },
    provide () {
      return {
        table: this
      }
    },
    props: {
      rowHeight: {
        type: Number,
        default: 40
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
        cachedData: []
      }
    },
    computed: {
      scrollHolderStyle () {
        return {
          width: '1px',
          height: '1px',
          right: 0,
          top: this.rowHeight * (this.data.length) + 'px'
        }
      },
      cacheAll () {
        return !this.rowHeight || this.data.length <= 500
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
      composeColumns () {
        this.ready = false

        if (this._composeTimer) clearTimeout(this._composeTimer)
        this._composeTimer = setTimeout(() => {
          const groups = { left: [], center: [], right: [] }

          this.columns.forEach(col => {
            const group = col.fixed !== undefined
              ? (col.fixed === 'right' ? groups.right : groups.left)
              : groups.center
            group.push(col)
          })

          Object.keys(groups).forEach(key => {
            if (!groups[key].length) delete groups[key]
          })

          this.columnGroups = groups
          this.ready = true

          delete this._composeTimer
        }, 100)
      },
      registerColumn (column) {
        this.columns.push(column)
        this.composeColumns()
      },
      unregisterColumn (columnId) {
        const idx = this.columns.findIndex(col => col._uid === columnId)
        if (idx >= 0) {
          this.columns.splice(idx)
          this.composeColumns()
        }
      },
      onLeftTableResize (e) {
        this.leftTableSize = e.target.clientWidth
      },
      onRightTableResize (e) {
        this.rightTableSize = e.target.clientWidth
      },
      onScroll: throttle(
        function (e) {
          if (this.cacheAll) return
          this.scrollDirection = Math.sign(e.target.scrollTop - this.scrollTop)
          this.scrollTop = e.target.scrollTop
          this.cacheData()
        },
        500,
        { leading: false, trailing: true }
      ),
      cacheData () {
        if (!this.cacheAll) {
          if (!this.scrollDirection) return

          const down = this.scrollDirection > 0 ? 75 : 25
          const i = parseInt(this.scrollTop / this.rowHeight)
          const start = Math.max(i - 100 + down, 0)
          const end = Math.min(i + down, this.data.length - 1) + 1

          this.cachedData = this
            .data
            .slice(start, end)
            .map((rec, idx) => ({ idx: idx + start, data: rec }))
        } else {
          this.cachedData = this
            .data
            .map((rec, idx) => ({ idx, data: rec }))
        }
      }
    }
  }
</script>
