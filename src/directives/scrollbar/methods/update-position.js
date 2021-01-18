// import delay from '@utils/delay'

function setRailHidden (rail, hidden) {
  if (hidden) rail.setAttribute('hidden', '')
  else rail.removeAttribute('hidden')
}

function updateThumbX () {
  const { el, railX, thumbX } = this

  const elStyle = window.getComputedStyle(el)
  const blw = parseInt(elStyle.borderLeftWidth)
  const brw = parseInt(elStyle.borderRightWidth)

  Object.assign(railX.style, {
    left: el.scrollLeft + 4 + 'px',
    bottom: 4 - el.scrollTop + 'px',
    width: el.offsetWidth - 8 - blw - brw + 'px'
  })

  const thumbWidth = Math.max(
    parseInt(railX.clientWidth ** 2 / el.scrollWidth),
    10
  )

  this.ratioX = (railX.clientWidth - thumbWidth) /
    (el.scrollWidth - el.clientWidth)

  const left = el.scrollLeft * this.ratioX

  Object.assign(thumbX.style, {
    width: thumbWidth + 'px',
    left: left + 'px'
  })
}

function updateThumbY () {
  const { el, railY, thumbY } = this

  const elStyle = window.getComputedStyle(el)
  const btw = parseInt(elStyle.borderTopWidth)
  const bbw = parseInt(elStyle.borderBottomWidth)

  Object.assign(railY.style, {
    top: el.scrollTop + 4 + 'px',
    right: 4 - el.scrollLeft + 'px',
    height: el.offsetHeight - 8 - btw - bbw + 'px'
  })

  const thumbHeight = Math.max(
    parseInt(railY.clientHeight ** 2 / el.scrollHeight),
    10
  )

  this.ratioY = (railY.clientHeight - thumbHeight) /
    (el.scrollHeight - el.clientHeight)

  const top = el.scrollTop * this.ratioY

  Object.assign(thumbY.style, {
    height: thumbHeight + 'px',
    top: top + 'px'
  })
}

function compareState (last, current) {
  return Object.keys(current).reduce((result, key) => {
    return result && current[key] === last[key]
  }, true)
}

async function updatePosition (skipWhenSameSize) {
  if (!this.activated) return

  const {
    scrollTop: st, scrollLeft: sl,
    scrollHeight: sh, scrollWidth: sw,
    clientHeight: ch, clientWidth: cw
  } = this.el

  const current = { st, sl, sh, sw, ch, cw }

  if (!this.state || !compareState(this.state, current)) {
    const { scrollbarX, scrollbarY } = this.options

    this.state = current
    this.hiddenX = scrollbarX === false || sw - cw < 1
    this.hiddenY = scrollbarY === false || sh - ch < 1

    setRailHidden(this.railX, this.hiddenX)
    setRailHidden(this.railY, this.hiddenY)

    if (!this.hiddenX) updateThumbX.call(this)
    if (!this.hiddenY) updateThumbY.call(this)
  }
}

export default updatePosition
