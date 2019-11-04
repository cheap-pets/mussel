const delay = require('delay')
const open = require('open')

;(async () => {
  await delay(1500)
  await open('http://localhost:5000')
})()
