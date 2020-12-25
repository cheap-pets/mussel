// import delay from '@utils/delay'

function setRailHidden (rail, hidden) {
  if (hidden) rail.setAttribute('hidden', '')
  else rail.removeAttribute('hidden')
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

  const height = Math.max(
    parseInt(railY.clientHeight ** 2 / el.scrollHeight),
    10
  )
  const top = el.scrollTop *
    (railY.clientHeight - height) / (el.scrollHeight - el.clientHeight)

  Object.assign(thumbY.style, {
    height: height + 'px',
    top: top + 'px'
  })
}

function updateThumbX () {
  const { el, railX, thumbX } = this

  const elStyle = window.getComputedStyle(el)
  const blw = parseInt(elStyle.borderLeftWidth)
  const brw = parseInt(elStyle.borderRightWidth)

  Object.assign(railX.style, {
    left: el.scrollLeft + 4 + 'px',
    bottom: 4 - el.scrollTop + 'px',
    width: el.offsetHeight - 8 - blw - brw + 'px'
  })

  const width = Math.max(
    parseInt(railX.clientWidth ** 2 / el.scrollWidth),
    10
  )
  const left = el.scrollLeft *
    (railX.clientWidth - width) / (el.scrollWidth - el.clientWidth)

  Object.assign(thumbX.style, {
    width: width + 'px',
    left: left + 'px'
  })
}

async function updatePosition () {
  const { scrollbarY, scrollbarX } = this.options
  const { scrollHeight, scrollWidth, clientHeight, clientWidth } = this.el

  this.hiddenY = scrollbarY === false || scrollHeight - clientHeight < 1
  this.hiddenX = scrollbarX === false || scrollWidth - clientWidth < 1

  setRailHidden(this.railY, this.hiddenY)
  setRailHidden(this.railX, this.hiddenX)

  if (!this.hiddenY) updateThumbY.call(this)
  if (!this.hiddenX) updateThumbX.call(this)
}

export default updatePosition
