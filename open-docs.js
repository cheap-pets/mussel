const delay = require('delay')
const open = require('open')

;(async () => {
  await delay(3000)
  await open('http://localhost:5000')
})()
