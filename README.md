# risk-flow-chart

一个基于 Vue 3 + AntV X6 的风控流程图编辑器组件库。提供可视化节点/连线编辑、规则与评分配置、画布状态与业务流程 JSON 导入/导出等能力。

## 安装

该库以 Vue 插件形式提供默认导出，同时提供 `RiskFlowChart` 组件的命名导出。

安装要求：

- 仅需 `vue@^3.5.0`（作为对等依赖）。
- Ant Design Vue、AntV X6 及其插件均已由本库内置并随构建打包，无需在宿主项目单独安装。

```bash
# 安装本库
npm i risk-flow-chart

# 如你的项目尚未安装 Vue（对等依赖），请同时安装
npm i vue
```

## 快速开始

推荐以插件方式注册组件（需引入库样式）。

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import RiskFlowChartPlugin from 'risk-flow-chart';
// 组件与 Ant Design Vue 已在库内注册
// 样式为独立文件，请在入口导入
import 'risk-flow-chart/style.css';

const app = createApp(App);
app.use(RiskFlowChartPlugin);
app.mount('#app');
```

也可以按需直接使用命名导出的组件：

```vue
<script setup lang="ts">
import { RiskFlowChart } from 'risk-flow-chart';
// 使用命名导出时，仍需在应用入口引入库样式：
// import 'risk-flow-chart/style.css'

const graphJson = '';
const flowJson = '';
const riskFactors = [
  { factorName: '近7天交易次数', factorCode: 'txn_7d_count' },
  { label: '用户年龄', value: 'user_age' },
];

const onSave = (form: { graphConfigJson: string; flowConfigJson: string }) => {
  // 将 form 持久化到服务端或本地
  console.log(form.graphConfigJson, form.flowConfigJson);
};
</script>

<template>
  <RiskFlowChart
    :graphConfigJson="graphJson"
    :flowConfigJson="flowJson"
    :riskFactorOptions="riskFactors"
    :isMerchant="false"
    @success="onSave"
  />
  <!-- 组件会渲染一个编辑器，包含左侧组件库、画布与配置面板 -->
  <!-- 点击工具栏“保存”会触发 success 事件，返回两份 JSON 字符串 -->
  </template>
```

## 组件属性（Props）

- `graphConfigJson?: string`
  - 描述：X6 画布状态的 JSON 字符串，内容来自 `graph.toJSON()`/`graph.fromJSON()`。
  - 用途：用于回显或初始化画布上的节点与连线的几何与状态信息。

- `flowConfigJson?: string`
  - 描述：业务流程的 JSON 字符串，组件在保存时会按如下结构导出/回显：
  - 结构（示意）：
    - `nodes`: 数组，元素可能为：
      - `start`: `{ id, type: 'start', name }`
      - `end`: `{ id, type: 'end', name, userRiskLevel }`
      - `rule`: `{ id, type: 'rule', name, expression }`，其中 `expression` 为逻辑树：
        - `{ logic: 'AND' | 'OR', conditions: Array<Condition | Group> }`
        - `Condition`: `{ parameterName, parameter, operator, value }`
      - `score`: `{ id, type: 'score', name, rules: Array<{ expression, score }> }`
    - `edges`: 数组，元素形如：
      - `{ id, source, target, type, label?, condition? }`
      - `type`: `'normal' | 'branchYes' | 'branchNo' | 'conditional'`

- `riskFactorOptions?: any[]`
  - 描述：风控因子选项列表，组件会进行标准化：
    - 入参每项可含 `label/value` 或 `factorName/factorCode`；
    - 标准化为：`{ label: item.label ?? item.factorName, value: item.value ?? item.factorCode, raw: item }`。
  - 示例：`[{ factorName: '近7天交易次数', factorCode: 'txn_7d_count' }, { label: '用户年龄', value: 'user_age' }]`。

- `isMerchant?: boolean`
  - 描述：预留的业务开关，默认为 `false`。当前版本对行为影响有限。

## 事件（Emits）

- `success(form)`
  - 触发：点击工具栏“保存”按钮时触发。
  - 载荷：`{ graphConfigJson: string; flowConfigJson: string }`（均为字符串）。
  - 用途：将当前画布与业务流程配置提交给外部持久化。

## 暴露方法（Expose）

- `close()`
  - 获取方式：通过 `ref` 获取组件实例后调用。
  - 示例：
    ```vue
    <script setup lang="ts">
    import { ref } from 'vue';
    import { RiskFlowChart } from 'risk-flow-chart';

    const chartRef = ref<InstanceType<any>>();
    const onDone = () => {
      chartRef.value?.close();
    };
    </script>
    <template>
      <RiskFlowChart ref="chartRef" />
      <a-button @click="onDone">完成</a-button>
    </template>
    ```

## 样式与构建产物

- 库自身样式为独立 CSS 文件，需在宿主项目入口 `import 'risk-flow-chart/style.css'`。
- Ant Design Vue 样式采用 CSS-in-JS 注入，无需也不应导入 `ant-design-vue/dist/antd.css`（该文件并不存在）。
- 若你的站点启用严格 CSP（禁止内联 `<style>`），请在根处使用 `ConfigProvider` 传递 `csp.nonce` 或适度放宽 `style-src` 以允许 Antd 的样式注入。
- 构建产物：
  - ESM：`dist/index.es.js`
  - CJS：`dist/index.js`
  - 类型：`dist/index.d.ts`
- 导出形式：默认导出为插件，命名导出为 `RiskFlowChart` 组件。
  - ESM 使用：`import RiskFlowChartPlugin, { RiskFlowChart } from 'risk-flow-chart'`
  - CJS 使用：
    ```js
    const mod = require('risk-flow-chart');
    const plugin = mod.default || mod; // 混合导出下的默认导出
    const { RiskFlowChart } = mod;
    ```

## 目录结构（更新）

```
risk-flow-chart/
├─ src/
│  ├─ index.ts            # 插件入口（注册 RiskFlowChart 组件）
│  ├─ App.vue             # 组件主体（编辑器）
│  ├─ panel/              # 节点/连线配置面板
│  ├─ hooks/              # 交互与尺寸调节等 hooks
│  └─ constants/          # 常量与操作符映射
├─ __tests__/             # 插件导出与注册测试
├─ dist/                  # 构建输出（ES/CJS/样式/类型）
├─ vite.config.ts         # 构建配置
├─ package.json           # 包信息与脚本
└─ README.md              # 使用说明
```

## 本地开发

```bash
# 开发预览
npm run dev

# 代码风格检查
npm run lint

# 单元测试
npm test

# 构建库（生成 dist）
npm run build
```

## 注意事项

- 依赖说明：宿主仅需安装 `vue@^3.5.0`，本库已内置并打包 `@antv/x6` 及其插件与 `ant-design-vue`。
- CSP 提示：如启用 CSP，请为 Antd 的 CSS-in-JS 提供 `nonce`。
- CJS 环境下由于混合导出（默认导出 + 命名导出），如遇默认导入问题请使用 `mod.default || mod` 兼容处理。
- 构建日志中的 CJS Node API 弃用提示为 Vite 的通用消息，不影响使用；如需仅输出 ESM，可在构建配置中调整输出格式。