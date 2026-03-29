import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import ButtonDemo from './ButtonDemo.vue'

const app = createApp(ButtonDemo)
install(app)
app.mount('#app')
