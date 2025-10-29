declare module '../dist/index.js' {
  const plugin: { install: (app: any) => void };
  export default plugin;
  export const RiskFlowChart: any;
}