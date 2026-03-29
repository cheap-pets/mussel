import { createApp } from 'vue'
import { install } from 'mussel'

import FlexLayoutDemo from './FlexLayoutDemo.vue'

const app = createApp(FlexLayoutDemo)
install(app)
app.mount('#app')
