import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import FlexLayoutDemo from './FlexLayoutDemo.vue'

const app = createApp(FlexLayoutDemo)
install(app)
app.mount('#app')
