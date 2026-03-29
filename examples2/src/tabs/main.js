import { createApp } from 'vue'
import { install } from 'mussel'

import TabsDemo from './TabsDemo.vue'

const app = createApp(TabsDemo)
install(app)
app.mount('#app')
