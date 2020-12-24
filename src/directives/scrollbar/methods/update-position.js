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
  const thumbWidth = Math.max(
    parseInt(this.railX.offsetWidth ** 2 / this.el.scrollWidth),
    10
  )
  this.thumbX.style.width = thumbWidth + 'px'
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
