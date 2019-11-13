<template>
  <mu-popup-editor-wrapper class="mu-color-editor">
    <div class="mu-color-palette">
      <div v-for="(row, rowIdx) in colors" :key="rowIdx">
        <span
          v-for="color in row"
          :key="color"
          class="mu-color-palette-cell"
          :style="{ background: color }"
          @click="setColor(color)"
          @mouseover="onMouseOver($event, color)"
        />
      </div>
    </div>
    <div class="mu-footer-button mu-text-color-success" @click="hidePopup">
      <mu-icon icon="ok" />
    </div>
    <template #expert>
      <div class="mu-color-indicator" @click="togglePopup" />
    </template>
  </mu-popup-editor-wrapper>
</template>

<script>
  import BasePopupEditor from './base-popup-editor'
  import Colors from '../../utils/colors'

  export default {
    name: 'MusselColorEditor',
    extends: BasePopupEditor,
    props: {
      popupWidth: {
        type: String,
        default: 'auto'
      }
    },
    data () {
      const grid = []
      let row = []
      Colors.safe.forEach(color => {
        row.push(color)
        if (row.length === 18) {
          grid.push(row)
          row = []
        }
      })
      if (row.length) grid.push(row)
      return {
        colors: grid
      }
    },
    mounted () {
      this.setIndicator(this.value)
    },
    methods: {
      setInputValue (value) {
        if (this.$el) this.setIndicator(this.value)
      },
      setIndicator (color) {
        const indicator = this.$el.querySelector('.mu-color-indicator')
        if (!indicator) return
        if (color) {
          let isDark = false
          if (color.indexOf('#') === 0) {
            const rgb = [
              parseInt('0x' + color.slice(1, 3)),
              parseInt('0x' + color.slice(3, 5)),
              parseInt('0x' + color.slice(5, 7))
            ]
            isDark = rgb[0] * 0.299 + rgb[1] * 0.578 + rgb[2] * 0.114 < 192
          }
          indicator.style.backgroundColor = color
          indicator.style.color = isDark ? '#eee' : '#222'
          indicator.innerText = color
          this.params.value = color
          return color
        } else {
          indicator.style.backgroundColor = 'transparent'
          indicator.innerText = ''
          this.params.value = ''
        }
      },
      setColor (color) {
        const hex = this.setIndicator(color)
        this.$emit('change', hex)
      },
      clear () {
        this.setIndicator()
        this.focus()
        this.$emit('clear')
      },
      onMouseOver (event, color) {
        if (event.buttons === 1) this.setColor(color)
      }
    }
  }
</script>
