export const COMPONENT_LIST = [
  { shape: 'start-node', label: '开始' },
  { shape: 'end-node', label: '结束' },
  { shape: 'rule-node', label: '规则' },
  { shape: 'score-node', label: '评分' },
];

export const OPERATOR_SYMBOL_MAP: Record<string, string> = {
  gt: '>',
  ge: '>=',
  lt: '<',
  le: '<=',
  eq: '=',
  ne: '!=',
  contains: 'contains',
  in: 'in',
  notIn: 'not in',
};

export const FLOW_PORTS = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: { visibility: 'hidden' },
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: { visibility: 'hidden' },
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: { visibility: 'hidden' },
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: { visibility: 'hidden' },
        },
      },
    },
  },
  items: [{ group: 'top' }, { group: 'right' }, { group: 'bottom' }, { group: 'left' }],
};
