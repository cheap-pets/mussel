import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import ScrollbarDemo from './ScrollbarDemo.vue'

const app = createApp(ScrollbarDemo)
install(app)
app.mount('#app')
