// import delay from '@/utils/delay'

function setRailHidden (rail, hidden) {
  if (hidden) rail.setAttribute('hidden', '')
  else rail.removeAttribute('hidden')
}

function updateThumbX (offset) {
  const { el, railX, thumbX } = this

  const elStyle = window.getComputedStyle(el)
  const blw = parseInt(elStyle.borderLeftWidth)
  const brw = parseInt(elStyle.borderRightWidth)

  Object.assign(railX.style, {
    left: el.scrollLeft + 4 + 'px',
    bottom: 4 - el.scrollTop - offset + 'px',
    width: el.offsetWidth - 8 - blw - brw + 'px'
  })

  const thumbWidth = Math.max(
    parseInt(railX.clientWidth ** 2 / el.scrollWidth),
    20
  )

  this.ratioX = (railX.clientWidth - thumbWidth) /
    (el.scrollWidth - el.clientWidth)

  const left = el.scrollLeft * this.ratioX

  Object.assign(thumbX.style, {
    width: thumbWidth + 'px',
    left: left + 'px'
  })
}

function updateThumbY (offset) {
  const { el, railY, thumbY } = this

  const elStyle = window.getComputedStyle(el)
  const btw = parseInt(elStyle.borderTopWidth)
  const bbw = parseInt(elStyle.borderBottomWidth)

  Object.assign(railY.style, {
    top: el.scrollTop + 4 + 'px',
    right: 4 - el.scrollLeft - offset + 'px',
    height: el.offsetHeight - 8 - btw - bbw + 'px'
  })

  const thumbHeight = Math.max(
    parseInt(railY.clientHeight ** 2 / el.scrollHeight),
    20
  )

  this.ratioY = (railY.clientHeight - thumbHeight) /
    (el.scrollHeight - el.clientHeight)

  const top = el.scrollTop * this.ratioY

  Object.assign(thumbY.style, {
    height: thumbHeight + 'px',
    top: top + 'px'
  })
}

function isStateChanged (old, current) {
  return !old ||
    Object.keys(current).reduce((result, key) => {
      return result || current[key] !== old[key]
    }, false)
}

function getPositionState ({ activated, el, options }) {
  if (options.stickToParent && !el.parentNode) return

  const {
    scrollTop: st, scrollLeft: sl,
    scrollHeight: sh, scrollWidth: sw,
    clientHeight: ch, clientWidth: cw
  } = el

  const {
    scrollTop: pst, scrollLeft: psl,
    clientHeight: pch, clientWidth: pcw
  } = options.stickToParent ? el.parentNode : {}

  return { st, sl, sh, sw, ch, cw, pst, psl, pch, pcw }
}

function activateScrollbar () {
  if (this.state && !this.activated) this.show(true)
}

function updatePosition () {
  if (this.options.scrollbarVisible === false) return

  const current = getPositionState(this)

  if (current && isStateChanged(this.state, current)) {
    activateScrollbar.call(this)

    const { sh, sw, ch, cw, pst, psl, pch, pcw } = current

    this.state = current

    if (this.railX) {
      this.hiddenX = sw - cw < 1
      setRailHidden(this.railX, this.hiddenX)
      if (!this.hiddenX) updateThumbX.call(this, pch ? pch - (ch - pst) : 0)
    }

    if (this.railY) {
      this.hiddenY = sh - ch < 1
      setRailHidden(this.railY, this.hiddenY)
      if (!this.hiddenY) updateThumbY.call(this, pcw ? pcw - (cw - psl) : 0)
    }
  }
}

export default updatePosition
