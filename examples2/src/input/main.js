import { createApp } from 'vue'
import { install } from 'mussel'

import InputDemo from './InputDemo.vue'

const app = createApp(InputDemo)
install(app)
app.mount('#app')
