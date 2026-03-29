import { createApp } from 'vue'
import { install } from '../../../dist/mussel.js'

import ModalDemo from './ModalDemo.vue'

const app = createApp(ModalDemo)
install(app)
app.mount('#app')
