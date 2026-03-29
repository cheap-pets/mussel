import { createApp } from 'vue'
import { install } from 'mussel'

import DropdownDemo from './DropdownDemo.vue'

const app = createApp(DropdownDemo)
install(app)
app.mount('#app')
