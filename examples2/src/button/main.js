import { createApp } from 'vue'
import { install } from 'mussel'

import ButtonDemo from './ButtonDemo.vue'

const app = createApp(ButtonDemo)
install(app)
app.mount('#app')
