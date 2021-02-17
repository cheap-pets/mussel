function removeRedundant (cache, start, end, oldStart, oldEnd, oldLen) {
  if (oldEnd > end) cache.splice(oldLen - oldEnd + end, oldEnd - end)
  if (oldStart < start) cache.splice(0, start - oldStart)
}

function appendFresh (cache, data) {
  const newStart = cache[0].idx
  const newEnd = cache[cache.length - 1].idx

  const front = []
  const back = []

  data.forEach(item => {
    if (item.idx < newStart) front.push(item)
    else if (item.idx > newEnd) back.push(item)
  })
  if (front.length) Array.prototype.unshift.apply(cache, front)
  if (back.length) Array.prototype.push.apply(cache, back)
}

export default function updateCache () {
  if (this.rowHeight && this.height !== 'auto') {
    const i = parseInt(this.scrollTop / this.rowOffsetHeight)
    const up = this.visibleRowCount * (this.scrollDirection > 0 ? 1 : 2)
    const start = Math.max(i - up - (i & 1), 0)
    const oldLen = this.cachedData.length

    const data = this
      .data
      .slice(start, start + this.visibleRowCount * 4)
      .map((record, idx) => ({ record, idx: idx + start }))

    if (oldLen) {
      const oldStart = oldLen ? this.cachedData[0].idx : 0
      const oldEnd = oldLen ? this.cachedData[oldLen - 1].idx : 0
      const end = data[data.length - 1].idx

      if (oldEnd > start && oldStart < end) {
        removeRedundant(this.cachedData, start, end, oldStart, oldEnd, oldLen)
        appendFresh(this.cachedData, data)
        return
      }
    }

    this.cachedData = data
  } else {
    this.cachedData = this.data.map(
      (record, idx) => ({ record, idx })
    )
  }
}
