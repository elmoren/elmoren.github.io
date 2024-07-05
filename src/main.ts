import { createApp } from 'vue'
import './style.css'
import '../node_modules/bulma/css/bulma.css'
import App from './App.vue'
import router from './router'

createApp(App)
    .use(router)
    .mount('#app')