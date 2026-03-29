import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import MessageDemo from './MessageDemo.vue'

const app = createApp(MessageDemo)
install(app)
app.mount('#app')
