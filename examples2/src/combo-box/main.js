import { createApp } from 'vue'
import { install } from 'mussel'

import ComboBoxDemo from './ComboBoxDemo.vue'

const app = createApp(ComboBoxDemo)
install(app)
app.mount('#app')
