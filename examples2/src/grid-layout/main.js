import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import GridLayoutDemo from './GridLayoutDemo.vue'

const app = createApp(GridLayoutDemo)
install(app)
app.mount('#app')
