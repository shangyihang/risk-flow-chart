# risk-flow-chart

一个基于 Vue 3 + AntV X6 的风控流程图编辑器组件库。提供可视化节点/连线编辑、规则与评分配置、画布状态与业务流程 JSON 导入/导出等能力。

## 安装

该库以 Vue 插件形式提供默认导出，同时提供 `RiskFlowChart` 组件的命名导出。请确保安装以下对等依赖：

- `vue@^3.5.0`
- `ant-design-vue@^4.2.0`（UI 组件与样式）
- `@antv/x6@^2.18.0` 及其插件：
  - `@antv/x6-plugin-clipboard`
  - `@antv/x6-plugin-dnd`
  - `@antv/x6-plugin-history`
  - `@antv/x6-plugin-keyboard`
  - `@antv/x6-plugin-selection`
  - `@antv/x6-plugin-snapline`
  - `@antv/x6-plugin-transform`

```bash
# 安装本库（对等依赖需在宿主项目中安装）
npm i risk-flow-chart

# 如果你的项目尚未安装对等依赖，可执行（示例）：
npm i vue ant-design-vue @antv/x6 \
  @antv/x6-plugin-clipboard @antv/x6-plugin-dnd @antv/x6-plugin-history \
  @antv/x6-plugin-keyboard @antv/x6-plugin-selection @antv/x6-plugin-snapline \
  @antv/x6-plugin-transform
```

## 快速开始

推荐以插件方式注册组件，并在全局引入样式文件。

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css'; // v4+ 推荐引入 reset.css

import RiskFlowChartPlugin from 'risk-flow-chart';
import 'risk-flow-chart/dist/style.css'; // 引入组件库样式

const app = createApp(App);
app.use(Antd);
app.use(RiskFlowChartPlugin);
app.mount('#app');
```

也可以按需直接使用命名导出的组件：

```vue
<script setup lang="ts">
import { RiskFlowChart } from 'risk-flow-chart';
import 'risk-flow-chart/dist/style.css';

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

- 必须引入组件样式：`import 'risk-flow-chart/dist/style.css'`。
- 同时引入 `ant-design-vue` 样式（v4+ 推荐 `import 'ant-design-vue/dist/reset.css'`）。
- 构建产物：
  - ESM：`dist/index.es.js`
  - CJS：`dist/index.js`
  - 类型：`dist/index.d.ts`
  - 样式：`dist/style.css`
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
│  └─ constants.ts        # 常量与操作符映射
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

- 组件依赖外部的 Ant Design Vue 与 X6，请在宿主项目中正确安装并引入样式。
- CJS 环境下由于混合导出（默认导出 + 命名导出），如遇默认导入问题请使用 `mod.default || mod` 兼容处理。
- 构建时若看到 CJS 输出弃用提示属于 Vite/Rollup 的通用提示，不影响使用；如需仅输出 ESM，可在构建配置中调整 `formats`。