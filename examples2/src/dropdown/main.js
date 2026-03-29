import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import DropdownDemo from './DropdownDemo.vue'

const app = createApp(DropdownDemo)
install(app)
app.mount('#app')
