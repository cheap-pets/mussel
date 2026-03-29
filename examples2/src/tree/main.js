import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import TreeDemo from './TreeDemo.vue'

const app = createApp(TreeDemo)
install(app)
app.mount('#app')
