import { createApp } from 'vue'
import { install } from 'mussel'

import GridLayoutDemo from './GridLayoutDemo.vue'

const app = createApp(GridLayoutDemo)
install(app)
app.mount('#app')
