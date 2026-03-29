import { createApp } from 'vue'
import { install } from 'mussel'

import ColorDemo from './ColorDemo.vue'

const app = createApp(ColorDemo)
install(app)
app.mount('#app')
