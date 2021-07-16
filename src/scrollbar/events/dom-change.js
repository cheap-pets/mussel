import throttle from 'lodash.throttle'

function onDomChange () {
  this.updatePosition()
}

export default throttle(
  onDomChange,
  50,
  { leading: false, trailing: true }
)
