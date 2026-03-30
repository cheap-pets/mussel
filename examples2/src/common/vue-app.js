import { createApp } from 'vue'
import { install } from 'mussel'

export function createVueApp (MainView) {
  const app = createApp(MainView)

  install(app).mount('#app')
}
