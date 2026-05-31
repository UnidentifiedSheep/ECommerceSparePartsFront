import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import ElementPlus, { ElNotification } from 'element-plus'
import 'element-plus/dist/index.css'
import { ApiError } from '@/models/errorModel.ts'

const app = createApp(App)

app.config.errorHandler = (err, _instance, _info) => {
  console.log(err)

  if (err instanceof ApiError) {
    if (err.validationErrors && err.validationErrors.length !== 0) {
      ElNotification({
        title: 'Ошибка',
        message: err.validationErrors.map((e) => e.errorMessage).join('\n'),
        type: 'error',
      })
      return
    }

    ElNotification({
      title: 'Ошибка',
      message: err.message,
      type: 'error',
    })
    return
  }

  ElNotification({
    title: 'Ошибка',
    message: err instanceof Error ? err.message : 'Непредвиденная ошибка',
    type: 'error',
  })
}

app.use(createPinia())
app.use(ElementPlus)
app.use(router)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
