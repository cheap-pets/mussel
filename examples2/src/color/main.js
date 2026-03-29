import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import ColorDemo from './ColorDemo.vue'

const app = createApp(ColorDemo)
install(app)
app.mount('#app')
