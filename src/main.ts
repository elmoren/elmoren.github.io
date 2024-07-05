import { createApp } from 'vue'
import '../node_modules/bulma/css/bulma.css'
import '@/styles.module.scss'

import App from './App.vue'
import router from './router.ts'

createApp(App)
    .use(router)
    .mount('#app')