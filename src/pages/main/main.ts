import { createApp } from 'vue'
import App from './App.vue'
import '~/styles/tokens/index.css'
import '~/styles/global.css'
// macos remove scrollbar
// import '~/styles/scrollbars.css'
import 'virtual:uno.css'

createApp(App).mount('#app')
