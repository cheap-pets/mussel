import { createApp } from 'vue'
import { install } from 'mussel'

import MessageDemo from './MessageDemo.vue'

const app = createApp(MessageDemo)
install(app)
app.mount('#app')
