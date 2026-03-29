import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import FormDemo from './FormDemo.vue'

const app = createApp(FormDemo)
install(app)
app.mount('#app')
