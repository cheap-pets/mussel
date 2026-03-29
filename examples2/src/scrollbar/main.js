import { createApp } from 'vue'
import { install } from 'mussel'

import ScrollbarDemo from './ScrollbarDemo.vue'

const app = createApp(ScrollbarDemo)
install(app)
app.mount('#app')
