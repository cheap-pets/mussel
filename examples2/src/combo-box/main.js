import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import ComboBoxDemo from './ComboBoxDemo.vue'

const app = createApp(ComboBoxDemo)
install(app)
app.mount('#app')
