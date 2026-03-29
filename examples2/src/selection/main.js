import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import SelectionDemo from './SelectionDemo.vue'

const app = createApp(SelectionDemo)
install(app)
app.mount('#app')
