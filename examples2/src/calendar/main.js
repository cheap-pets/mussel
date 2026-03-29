import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import CalendarDemo from './CalendarDemo.vue'

const app = createApp(CalendarDemo)
install(app)
app.mount('#app')
