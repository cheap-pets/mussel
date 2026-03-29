import { createApp } from 'vue'
import { install } from 'mussel'

import TreeDemo from './TreeDemo.vue'

const app = createApp(TreeDemo)
install(app)
app.mount('#app')
