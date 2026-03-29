import { createApp } from 'vue'
import { install } from 'mussel'

import FormDemo from './FormDemo.vue'

const app = createApp(FormDemo)
install(app)
app.mount('#app')
