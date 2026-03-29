import { createApp } from 'vue'
import { install } from 'mussel'

import SelectionDemo from './SelectionDemo.vue'

const app = createApp(SelectionDemo)
install(app)
app.mount('#app')
