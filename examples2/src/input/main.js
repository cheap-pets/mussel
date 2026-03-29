import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import InputDemo from './InputDemo.vue'

const app = createApp(InputDemo)
install(app)
app.mount('#app')
