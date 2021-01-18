export default function show () {
  this.activated = true
  this.el.setAttribute('activated', '')
  this.updatePosition()
}
