<template>
  <mu-popup-editor-wrapper>
    <div class="mu-time-selector" cell-padding>
      <div style="text-align: center;">
        <mu-radio-group
          v-model="hourRange"
          button-style
          margin="bottom"
          @change="onHourRangeChange">
          <mu-radio option="AM" />
          <mu-radio option="PM" />
        </mu-radio-group>
      </div>
      <h-box>
        <h-box class="mu-flex-box" flex-wrap size="1">
          <div class="mu-time-selector_header" margin="bottom">
            时
          </div>
          <a
            v-for="h in hours"
            :key="h"
            :active="h === hour"
            class="mu-time-selector_hour-cell"
            @click="setHour(h)">
            {{ h }}
          </a>
        </h-box>
        <div class="mu-bodered" size="1px" border="left dashed" margin="hori" />
        <h-box class="mu-flex-box" flex-wrap size="1">
          <div class="mu-time-selector_header" margin="bottom">
            分
          </div>
          <a
            v-for="m in minutes"
            :key="m"
            :active="m === minute"
            class="mu-time-selector_minute-cell"
            @click="setMinute(m)">
            {{ m }}
          </a>
        </h-box>
      </h-box>
    </div>
  </mu-popup-editor-wrapper>
</template>

<script>
  import BasePopupEditor from './base-popup-editor'
  import HBox from '../layout/flex-h-box'

  import './time-editor.pcss'

  export default {
    name: 'MusselTimeEditor',
    components: {
      HBox
    },
    extends: BasePopupEditor,
    props: {
      value: String,
      editable: {
        type: Boolean,
        default: true
      }
    },
    data () {
      return {
        hour: null,
        minute: null,
        hourRange: 'AM'
      }
    },
    computed: {
      hours () {
        const arr = []
        for (let i = 0; i < 12; i++) {
          const v = i + (this.hourRange === 'PM' ? 12 : 0)
          arr.push(v < 10 ? '0' + v : String(v))
        }
        return arr
      },
      minutes () {
        const arr = []
        let m = 0
        while (m < 60) {
          arr.push(m < 10 ? '0' + m : String(m))
          m += 5
        }
        return arr
      }
    },
    watch: {
      value: {
        handler (v) {
          this.setValue(v)
        },
        immediate: true
      }
    },
    methods: {
      setValue (v) {
        if (v) {
          const arr = v.split(':')
          const hour = parseInt(arr[0])
          const minute = parseInt(arr[1])

          if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            this.hourRange = hour < 12 ? 'AM' : 'PM'
            this.hour = hour < 10 ? '0' + hour : String(hour)
            this.minute = minute < 10 ? '0' + minute : String(minute)
            this.params.value = this.hour + ':' + this.minute
            return
          }
        }
        this.hour = null
        this.minute = null
      },
      clear () {
        this.hour = null
        this.minute = null
        this.params.value = null
        this.focus()
        this.$emit('clear')
        this.$emit('change', null)
      },
      setHour (h) {
        this.hour = h
        this.setTime()
      },
      setMinute (m) {
        this.minute = m
        this.setTime()
        if (this.hour) this.hidePopup()
      },
      setTime () {
        if (this.hour && this.minute) {
          const time = this.hour + ':' + this.minute
          this.params.value = time
          if (this.value !== time) this.$emit('change', time)
        }
      },
      onHourRangeChange () {
        let hour = parseInt(this.hour)
        if (this.hourRange === 'AM' && hour > 11) {
          hour -= 12
        } else if (this.hourRange === 'PM' && hour < 12) {
          hour += 12
        }
        if (!isNaN(hour)) {
          this.hour = hour < 10 ? '0' + hour : String(hour)
          this.setTime()
        }
      }
    }
  }
</script>
