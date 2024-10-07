function getDuration (str = '') {
  const match = str.trim().match(/^(?<num>\d+(?:\.\d+)?)(?<unit>s|ms)$/)

  return match
    ? match.groups.unit === 's'
      ? parseFloat(match.groups.num) * 1000
      : parseFloat(match.groups.num)
    : 0
}

export function getTransitionDuration (element) {
  const duration = window.getComputedStyle(element).transitionDuration

  return duration
    ? Math.max(...duration.split(',').map(el => getDuration(el)))
    : 0
}
