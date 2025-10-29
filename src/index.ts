import type { App as VueApp } from 'vue';
import App from './App.vue';

export const RiskFlowChart = App;

export default {
  install(app: VueApp) {
    app.component('RiskFlowChart', App);
  },
};