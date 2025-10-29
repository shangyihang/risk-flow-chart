// Mock external dependencies used by built output to avoid loading heavy modules in Jest
jest.mock('vue', () => {
  const components = new Map<string, any>();
  return {
    createApp: () => {
      const app = {
        component: (name: string, comp?: any) => {
          if (comp) {
            components.set(name, comp);
            return undefined;
          }
          return components.get(name);
        },
        use: (plugin: any) => {
          if (typeof plugin === 'function') {
            plugin(app);
          } else if (plugin && typeof plugin.install === 'function') {
            plugin.install(app);
          }
        },
      };
      return app;
    },
    defineComponent: () => ({}),
  };
});
jest.mock('@antv/x6', () => ({}));
jest.mock('@antv/x6-plugin-transform', () => ({}));
jest.mock('@antv/x6-plugin-selection', () => ({}));
jest.mock('@antv/x6-plugin-snapline', () => ({}));
jest.mock('@antv/x6-plugin-keyboard', () => ({}));
jest.mock('@antv/x6-plugin-clipboard', () => ({}));
jest.mock('@antv/x6-plugin-history', () => ({}));

// Use CommonJS require to avoid TS type resolution for built output
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mod = require('../dist/index.js');
const plugin = mod.default || mod;
const { RiskFlowChart } = mod;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp, defineComponent } = require('vue');

describe('RiskFlowChart plugin', () => {
  it('exports install function', () => {
    expect(typeof plugin.install).toBe('function');
  });

  it('registers component via app.use', () => {
    const app = createApp(defineComponent({}));
    app.use(plugin);
    const registered = app.component('RiskFlowChart');
    expect(registered).toBeDefined();
  });

  it('exports SFC component', () => {
    expect(RiskFlowChart).toBeDefined();
  });
});