import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import TabsDemo from './TabsDemo.vue'

const app = createApp(TabsDemo)
install(app)
app.mount('#app')
