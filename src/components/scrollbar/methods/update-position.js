import requestAnimationFrame from '@/utils/request-animation-frame'

function setRailHidden (rail, hidden) {
  if (hidden) rail.setAttribute('hidden', '')
  else rail.removeAttribute('hidden')
}

function updateThumbX () {
  const { el, railX, thumbX } = this

  // const elStyle = window.getComputedStyle(el)
  // const blw = parseInt(elStyle.borderLeftWidth)
  // const brw = parseInt(elStyle.borderRightWidth)

  Object.assign(railX.style, {
    // left: el.scrollLeft + 4 + 'px',
    // bottom: 4 - el.scrollTop + 'px',
    // width: el.offsetWidth - 8 - blw - brw + 'px',
    transform: `translate3d(${el.scrollLeft}px, ${el.scrollTop}px, 0)`
  })

  const thumbWidth = Math.max(
    parseInt(railX.clientWidth ** 2 / el.scrollWidth),
    40
  )

  this.ratioX = (railX.clientWidth - thumbWidth) /
    (el.scrollWidth - el.clientWidth)

  Object.assign(thumbX.style, {
    width: thumbWidth + 'px',
    left: el.scrollLeft * this.ratioX + 'px'
  })
}

function updateThumbY () {
  const { el, railY, thumbY } = this

  // const elStyle = window.getComputedStyle(el)
  // const btw = parseInt(elStyle.borderTopWidth)
  // const bbw = parseInt(elStyle.borderBottomWidth)

  Object.assign(railY.style, {
    // top: el.scrollTop + 4 + 'px',
    // right: 4 - el.scrollLeft + 'px',
    // height: el.offsetHeight - 8 - btw - bbw + 'px',
    transform: `translate3d(${el.scrollLeft}px, ${el.scrollTop}px, 0)`
  })

  const thumbHeight = Math.max(
    parseInt(railY.clientHeight ** 2 / el.scrollHeight),
    40
  )

  this.ratioY = (railY.clientHeight - thumbHeight) /
    (el.scrollHeight - el.clientHeight)

  Object.assign(thumbY.style, {
    height: thumbHeight + 'px',
    top: el.scrollTop * this.ratioY + 'px'
  })
}

function isStateChanged (old, current) {
  return !old ||
    Object.keys(current).reduce((result, key) => {
      return result || current[key] !== old[key]
    }, false)
}

function getPositionState ({ activated, el, options }) {
  const {
    scrollTop: st, scrollLeft: sl,
    scrollHeight: sh, scrollWidth: sw,
    clientHeight: ch, clientWidth: cw
  } = el

  return { st, sl, sh, sw, ch, cw }
}

function updatePosition () {
  if (!this.activated) return

  requestAnimationFrame(() => {
    const state = getPositionState(this)

    if (state && isStateChanged(this.state, state)) {
      const { sh, sw, ch, cw } = state

      this.state = state

      if (this.railY) {
        this.hiddenY = sh - ch < 1
        setRailHidden(this.railY, this.hiddenY)
        if (!this.hiddenY) updateThumbY.call(this)
      }

      if (this.railX) {
        this.hiddenX = sw - cw < 1
        setRailHidden(this.railX, this.hiddenX)
        if (!this.hiddenX) updateThumbX.call(this)
      }
    }
  }, 'scrollbar.updatePosition', { cancelPrevious: true })
}

export default updatePosition
