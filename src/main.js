import { createApp } from 'vue';
import { Quasar, Notify, Dialog } from 'quasar';
import App from './App.vue';

import 'quasar/src/css/index.sass';
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import '@quasar/extras/material-icons-round/material-icons-round.css'
import '@quasar/extras/material-icons-sharp/material-icons-sharp.css'
import '@quasar/extras/material-symbols-outlined/material-symbols-outlined.css'
import '@quasar/extras/material-symbols-rounded/material-symbols-rounded.css'
import '@quasar/extras/material-symbols-sharp/material-symbols-sharp.css'

const myApp = createApp(App);

myApp.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
  },
});

myApp.mount('#app');