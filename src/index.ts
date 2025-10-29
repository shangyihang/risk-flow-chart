import type { App as VueApp } from 'vue';
import App from './App.vue';
import { Layout, Divider, Button, Form, Input, InputNumber, Select, Dropdown, Menu, Radio, Tag } from 'ant-design-vue';
// 引入 Ant Design Vue 基础 reset 与所用组件的 CSS（不是 less），确保样式被打包进库的 style.css
import 'ant-design-vue/dist/reset.css';
import 'ant-design-vue/es/layout/style';
import 'ant-design-vue/es/divider/style';
import 'ant-design-vue/es/button/style';
import 'ant-design-vue/es/form/style';
import 'ant-design-vue/es/input/style';
import 'ant-design-vue/es/input-number/style';
import 'ant-design-vue/es/select/style';
import 'ant-design-vue/es/dropdown/style';
import 'ant-design-vue/es/menu/style';
import 'ant-design-vue/es/radio/style';
import 'ant-design-vue/es/tag/style';

export const RiskFlowChart = App;

export default {
  install(app: VueApp) {
    // 仅注册项目中实际使用到的 Antd 组件，减少体积
    app
      .use(Layout)
      .use(Divider)
      .use(Button)
      .use(Form)
      .use(Input)
      .use(InputNumber)
      .use(Select)
      .use(Dropdown)
      .use(Menu)
      .use(Radio)
      .use(Tag);
    app.component('RiskFlowChart', App);
  },
};