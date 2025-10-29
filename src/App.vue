<template>
    <div class="editor-container" style="height: calc(100vh - 120px)">
        <a-layout style="flex-direction: column; height: 100%">
            <!-- 主体布局 -->
            <a-layout class="editor-body">
                <!-- 左侧组件库 -->
                <a-layout-sider class="editor-aside-left">
                    <h4 class="aside-title">组件库</h4>
                    <a-divider style="margin: 15px 0 10px;" />

                    <div class="component-grid">
                        <div v-for="item in COMPONENT_LIST" :key="item.shape"
                            @dragstart="(e) => e.dataTransfer?.setData('application/json', JSON.stringify(item))"
                            class="component-card" draggable="true">
                            <div class="card-icon">
                                <svg v-if="item.shape === 'start-node'" width="50" height="30">
                                    <rect x="2" y="2" width="46" height="26" rx="13" ry="13" fill="#EFF4FF"
                                        stroke="#1890FF" />
                                </svg>
                                <svg v-else-if="item.shape === 'end-node'" width="50" height="30">
                                    <rect x="2" y="2" width="46" height="26" rx="13" ry="13" fill="#FFF1F0"
                                        stroke="#FF4D4F" />
                                </svg>
                                <svg v-else-if="item.shape === 'rule-node'" width="56" height="30" viewBox="0 0 60 30">
                                    <polygon points="0,15 28,0 56,15 28,30" fill="#EFF4FF" stroke="#5F95FF" />
                                </svg>
                                <svg v-else width="56" height="30" viewBox="0 0 56 30">
                                    <rect x="2" y="2" width="52" height="26" rx="6" ry="6" fill="#EFF4FF"
                                        stroke="#5F95FF" />
                                </svg>
                            </div>
                            <div class="card-label">{{ item.label }}</div>
                        </div>
                    </div>
                </a-layout-sider>

                <!-- 中间画布 -->
                <a-layout-content class="editor-main" @drop="onDrop" @dragover.prevent>
                    <a-button-group class="toolbar">
                        <a-button @click="setValue()">初始化数据</a-button>
                        <a-button @click="centerGraph()">居中</a-button>
                        <a-button @click="handleBeforeClose(close)">返回</a-button>
                        <a-button @click="saveConfig" type="primary" :disabled="formLoading">保存</a-button>
                    </a-button-group>
                    <div ref="graphContainer" class="canvas-area"></div>
                    <!-- 悬浮配置面板 -->
                    <div class="floating-config" :class="{ collapsed: isAsideCollapsed }"
                        :style="{ width: asideWidth + 'px' }">
                        <div class="resize-handle" @mousedown="onAsideResizeStart"></div>
                        <div class="toggle-btn" @click="isAsideCollapsed = !isAsideCollapsed">
                            <svg v-if="!isAsideCollapsed" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="panel-content" v-if="!isAsideCollapsed">
                            <component v-if="currentComponent" :is="currentComponent" :key="currentKey"
                                :model="currentModel" :config="currentConfig" :riskFactorOptions="riskFactorOptions"
                                @update:config="handleUpdateConfig" />
                            <div v-else class="panel-empty">
                                <p>请选择节点或连线进行配置</p>
                            </div>
                        </div>
                    </div>
                </a-layout-content>
            </a-layout>
        </a-layout>
    </div>
</template>

<script setup lang="ts" name="RiskFlowChart">
import { ref, reactive, nextTick, computed, watch, onMounted } from "vue";
import { COMPONENT_LIST, OPERATOR_SYMBOL_MAP, FLOW_PORTS } from "./constants";
import { useAsideResize } from "./hooks/useAsideResize";
import { Graph, Shape } from "@antv/x6";
import type { Node, Edge } from "@antv/x6";
import { Transform } from "@antv/x6-plugin-transform";
import { Selection } from "@antv/x6-plugin-selection";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Keyboard } from "@antv/x6-plugin-keyboard";
import { Clipboard } from "@antv/x6-plugin-clipboard";
import { History } from "@antv/x6-plugin-history";
import StartNodePanel from "./panel/StartNodePanel.vue";
import EndNodePanel from "./panel/EndNodePanel.vue";
import RuleNodePanel from "./panel/RuleNodePanel.vue";
import ScoreNodePanel from "./panel/ScoreNodePanel.vue";
import RuleEdgePanel from "./panel/RuleEdgePanel.vue";
import ScoreEdgePanel from "./panel/ScoreEdgePanel.vue";

// 课时子表组件名称定义
defineOptions({
    name: "RiskFlowChart",
});

const emit = defineEmits(["success"]);

// 接收父组件传来的 Edge 实例(model) 和当前配置对象(row)
const props = withDefaults(
    defineProps<{
        graphConfigJson?: string;
        flowConfigJson?: string;
        riskFactorOptions?: any[];
        isMerchant?: boolean;
    }>(),
    {
        graphConfigJson: () => `{"cells":[{"position":{"x":590,"y":131},"size":{"width":80,"height":36},"attrs":{"text":{"text":"开始"}},"visible":true,"shape":"start-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"bottom","id":"0b5c9b0c-ec82-4388-ad83-658fc1b7ece1","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"a5cfc35d-9d35-4038-ad72-af899de729e4","data":{"name":"开始"},"zIndex":3},{"shape":"edge","attrs":{"line":{"stroke":"#A2B1C3","targetMarker":{"name":"block","width":12,"height":8}}},"id":"8529cb98-257f-4d9a-84a0-49ed12dc8053","source":{"cell":"a5cfc35d-9d35-4038-ad72-af899de729e4","port":"0b5c9b0c-ec82-4388-ad83-658fc1b7ece1"},"target":{"cell":"5371e781-f7e0-4c24-9b27-b955d2d24502","port":"9925b7c1-9334-42e2-9632-7fac805b5ff8"},"zIndex":4},{"shape":"edge","attrs":{"line":{"stroke":"#A2B1C3","targetMarker":{"name":"block","width":12,"height":8}}},"id":"447b3a9d-2990-4fa9-9a6d-e4a19d491acb","source":{"cell":"5371e781-f7e0-4c24-9b27-b955d2d24502","port":"108b3272-1e4f-4515-8b54-35230dbe4e3a"},"target":{"cell":"030d292c-6221-4dbe-a144-297fec211a49","port":"615d7503-ba6b-47d7-aac1-a7165662a82c"},"zIndex":8,"data":{"branchType":"branchYes","label":"是"},"labels":[{"attrs":{"label":{"text":"是","fill":"#333","fontSize":12}},"position":0.5}]},{"shape":"edge","attrs":{"line":{"stroke":"#A2B1C3","targetMarker":{"name":"block","width":12,"height":8}}},"id":"a7cbc7e1-df70-4f07-9cf6-73873829dc47","source":{"cell":"5371e781-f7e0-4c24-9b27-b955d2d24502","port":"e7f8b1b4-2b7b-4f7f-9525-bd5bc06eccff"},"target":{"cell":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","port":"295e2149-6fe2-459d-be76-736bc9957e38"},"zIndex":13,"data":{"branchType":"branchNo","label":"否"},"labels":[{"attrs":{"label":{"text":"否","fill":"#333","fontSize":12}},"position":0.5}]},{"position":{"x":920,"y":434},"size":{"width":80,"height":36},"attrs":{"text":{"text":"结束"}},"visible":true,"shape":"end-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"top","id":"295e2149-6fe2-459d-be76-736bc9957e38","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","data":{"name":"结束"},"zIndex":14},{"position":{"x":590,"y":650},"size":{"width":80,"height":36},"attrs":{"text":{"text":"结束"}},"visible":true,"shape":"end-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"top","id":"615d7503-ba6b-47d7-aac1-a7165662a82c","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"030d292c-6221-4dbe-a144-297fec211a49","data":{"name":"结束","userRiskLevel":3},"zIndex":15},{"position":{"x":590,"y":380},"size":{"width":80,"height":48},"attrs":{"text":{"text":"规则"}},"visible":true,"shape":"rule-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"top","id":"9925b7c1-9334-42e2-9632-7fac805b5ff8","attrs":{"circle":{"style":{"visibility":"hidden"}}}},{"group":"right","id":"e7f8b1b4-2b7b-4f7f-9525-bd5bc06eccff","attrs":{"circle":{"style":{"visibility":"hidden"}}}},{"group":"bottom","id":"108b3272-1e4f-4515-8b54-35230dbe4e3a","attrs":{"circle":{"style":{"visibility":"hidden"}}}},{"group":"left","id":"aac16c0a-5d39-4473-aca9-f0f8b21d7b8f","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"5371e781-f7e0-4c24-9b27-b955d2d24502","data":{"name":"规则","expression":[{"type":"condition","uid":"mhacwvv0_cya927","name":"条件1","field":"","operator":"eq","value":"1"}]},"zIndex":16}]}`,
        flowConfigJson: () => `{"nodes":[{"id":"a5cfc35d-9d35-4038-ad72-af899de729e4","type":"start","name":"开始"},{"id":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","type":"end","name":"结束"},{"id":"030d292c-6221-4dbe-a144-297fec211a49","type":"end","name":"结束","userRiskLevel":3},{"id":"5371e781-f7e0-4c24-9b27-b955d2d24502","type":"rule","name":"规则","expression":{"logic":"AND","conditions":[{"parameterName":"","parameter":"","operator":"=","value":1}]}}],"edges":[{"id":"8529cb98-257f-4d9a-84a0-49ed12dc8053","source":"a5cfc35d-9d35-4038-ad72-af899de729e4","target":"5371e781-f7e0-4c24-9b27-b955d2d24502","type":"normal"},{"id":"447b3a9d-2990-4fa9-9a6d-e4a19d491acb","source":"5371e781-f7e0-4c24-9b27-b955d2d24502","target":"030d292c-6221-4dbe-a144-297fec211a49","type":"branchYes","label":"是"},{"id":"a7cbc7e1-df70-4f07-9cf6-73873829dc47","source":"5371e781-f7e0-4c24-9b27-b955d2d24502","target":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","type":"branchNo","label":"否"}]}`,
        riskFactorOptions: () => [],
        isMerchant: () => false,
    }
);

/***********************
 * 基础状态与常量
 ***********************/

// 组件列表常量已从 constants 模块导入
const nodePanelMap: any = {
    "start-node": StartNodePanel,
    "end-node": EndNodePanel,
    "rule-node": RuleNodePanel,
    "score-node": ScoreNodePanel,
};
const edgePanelMap: any = {
    "rule-edge": RuleEdgePanel,
    "score-edge": ScoreEdgePanel,
};

let graph: Graph;
const formLoading = ref<Boolean>(false);
const isAsideCollapsed = ref<Boolean>(false);
const { width: asideWidth, onResizeStart: onAsideResizeStart } = useAsideResize({ initial: 400, min: 200, max: 600 });

const lastGraphJson = ref("");
const form = reactive({
    graphConfigJson: "",
    flowConfigJson: "",
});
const riskFactorOptions = ref<any[]>([]);
const currentConfig = ref<any>({});
const graphContainer = ref<HTMLDivElement>();
const selectedNode = ref<any>(null);
const selectedEdge = ref<any>(null);
const selectedEdgeType = ref<string>("");

// 计算属性：当前应渲染的组件
const currentComponent = computed(() => {
    if (selectedNode.value) {
        return nodePanelMap[selectedNode.value.shape];
    }
    if (selectedEdge.value) {
        return edgePanelMap[selectedEdgeType.value];
    }
    return null;
});

// 计算属性：当前组件的 model 数据
const currentModel = computed(() => {
    return selectedNode.value || selectedEdge.value || null;
});

// 计算属性：当前组件的唯一 key（确保切换时重新渲染）
const currentKey = computed(() => {
    if (selectedNode.value) return selectedNode.value.id;
    if (selectedEdge.value) return selectedEdge.value.id;
    return "";
});

/***********************
 * 工具函数
 ***********************/
// 操作符映射常量已从 constants 模块导入

// 关闭前检查流程图是否改变
const handleBeforeClose = async (done: Function) => {
    if (JSON.stringify(graph.toJSON()) === lastGraphJson.value) {
        done();
    }
    // else {
    //     try {
    //         await message.confirm("未保存的更改内容将不会保存，是否返回？");
    //         done();
    //     } catch (err) {
    //         // 用户取消，阻止关闭
    //     }
    // }
};

/***********************
 * 表单 & 接口方法
 ***********************/

const close = () => {
    formLoading.value = false;
};

const resetForm = () => {
    // 清空画布
    graph?.clearCells();
    // 重置配置
    currentConfig.value = {};
    // 重置选中节点和边
    selectedNode.value = null;
    selectedEdge.value = null;
    selectedEdgeType.value = "";
};

/***********************
 * 画布数据导入导出
 ***********************/
function flatExprToLogicTree(flatExpr: any[], riskFactorOptions: any[]): any {
    const stack: any[] = [];
    let currentGroup: any = { logic: "AND", conditions: [] };
    stack.push(currentGroup);

    flatExpr.forEach((item) => {
        if (item.type === "condition") {
            const factor = riskFactorOptions.find((f) => f.value === item.field);
            currentGroup.conditions.push({
                parameterName: factor ? factor.label : item.field,
                parameter: item.field,
                operator: OPERATOR_SYMBOL_MAP[item.operator] ?? item.operator,
                // value 尝试转成数字，否则是字符串
                value: isNaN(Number(item.value)) ? item.value : Number(item.value),
            });
        } else if (item.type === "operator") {
            currentGroup.logic = item.value === "AND" ? "AND" : "OR";
        } else if (item.type === "paren" && item.value === "(") {
            const newGroup = { logic: "AND", conditions: [] };
            currentGroup.conditions.push(newGroup);
            stack.push(newGroup);
            currentGroup = newGroup;
        } else if (item.type === "paren" && item.value === ")") {
            stack.pop();
            currentGroup = stack[stack.length - 1];
        }
    });

    return currentGroup;
}
// 导出业务流程 JSON
function exportBusinessFlow(): any {
    const x6Data = graph?.toJSON();
    const nodes: any[] = [];
    const edges: any[] = [];

    x6Data?.cells.forEach((cell: any) => {
        if (cell.shape !== "edge") {
            // 节点
            const cfg = cell.data || {};
            switch (cell.shape) {
                case "start-node":
                    nodes.push({
                        id: cell.id,
                        type: "start",
                        name: cfg.name || cell.attrs?.label?.text || "",
                    });
                    break;
                case "end-node":
                    nodes.push({
                        id: cell.id,
                        type: "end",
                        name: cfg.name || cell.attrs?.label?.text || "",
                        userRiskLevel: cfg.userRiskLevel,
                    });
                    break;
                case "rule-node":
                    const exprArray = cfg.expression || [];
                    const exprTree = flatExprToLogicTree(exprArray, riskFactorOptions.value);
                    nodes.push({
                        id: cell.id,
                        type: "rule",
                        name: cfg.name || cell.attrs?.label?.text || "",
                        expression: exprTree,
                    });
                    break;
                case "score-node":
                    const rulesData = (cfg.rules || []).map((rule: any) => {
                        const exprArray = rule.expression || [];
                        const exprTree = flatExprToLogicTree(exprArray, riskFactorOptions.value);
                        return {
                            expression: exprTree,
                            score: rule.score,
                        };
                    });
                    nodes.push({
                        id: cell.id,
                        type: "score",
                        name: cfg.name || cell.attrs?.label?.text || "",
                        rules: rulesData,
                    });
                    break;
            }
        } else {
            // 连线
            const sourceNode = graph?.getCellById(cell.source.cell);
            const cfg = cell.data || {};

            const edgeData: any = {
                id: cell.id,
                source: cell.source.cell,
                target: cell.target.cell,
            };

            if (sourceNode?.shape === "rule-node") {
                // 规则节点分支线
                edgeData.type = cfg.branchType || "normal";
                if (edgeData.type === "branchYes") edgeData.label = "是";
                if (edgeData.type === "branchNo") edgeData.label = "否";
            } else if (sourceNode?.shape === "score-node") {
                edgeData.type = "conditional";
                edgeData.condition = cfg.condition || {};

                // 生成 label
                if (cell.labels.length !== 0 && cell.labels[0]?.attrs?.label?.text) {
                    edgeData.label = cell.labels[0]?.attrs?.label.text;
                } else {
                    edgeData.label = "";
                }
            } else {
                edgeData.type = "normal";
            }

            edges.push(edgeData);
        }
    });

    return { nodes, edges };
}

/***********************
 * 画布初始化
 ***********************/
const initGraph = () => {
    // 确保DOM元素已经渲染
    if (!graphContainer.value) {
        console.error("图表容器未找到");
        return;
    }

    graph = new Graph({
        container: graphContainer.value,
        autoResize: true, // 画布自适应大小（撑满）
        grid: {
            visible: true,
            type: "doubleMesh", // 设置为网格类型的画布背景
            args: [
                {
                    color: "#eee", // 主网格线颜色
                    thickness: 1, // 主网格线宽度
                },
                {
                    color: "#ddd", // 次网格线颜色
                    thickness: 1, // 次网格线宽度
                    factor: 4, // 主次网格线间隔
                },
            ],
        },
        mousewheel: {
            enabled: true,
            zoomAtMousePosition: true,
            modifiers: "ctrl",
            minScale: 0.5,
            maxScale: 3,
        },
        // 新增 panning 配置
        panning: {
            enabled: true, // 开启平移
            eventTypes: ["rightMouseDown"],
        },
        connecting: {
            router: "manhattan",
            connector: { name: "rounded", args: { radius: 8 } },
            anchor: "center",
            connectionPoint: "anchor",
            highlight: true, // 高亮
            allowBlank: false,
            snap: { radius: 20 },
            createEdge() {
                return new Shape.Edge({
                    attrs: {
                        line: {
                            stroke: "#A2B1C3",
                            strokeWidth: 2,
                            targetMarker: { name: "block", width: 12, height: 8 },
                        },
                    },
                });
            },
            validateConnection({ sourceView, targetView, sourceMagnet, targetMagnet }) {
                const targetPortType = targetMagnet?.getAttribute("port-group") || "";
                const sourcePortType = sourceMagnet?.getAttribute("port-group") || "";
                const sourceCell = sourceView?.cell;
                // 禁止连接本身
                if (sourceView === targetView) {
                    return false;
                }
                // 只能从输出桩连接出
                if (!sourceMagnet || sourcePortType === "top") {
                    return false;
                }
                // 只能连接到输入桩
                if (!targetMagnet || targetPortType === "bottom") {
                    return false;
                }
                // 规则节点最多只能连出两条线
                if (sourceCell && sourceCell.shape === "rule-node") {
                    const outgoing = graph?.getOutgoingEdges(sourceCell) || [];
                    if (outgoing.length > 2) {
                        // 规则节点最多只能连出两条线(是、否)
                        return false;
                    }
                }

                return true;
            },
        },
        highlighting: {
            magnetAdsorbed: {
                name: "stroke",
                args: { attrs: { fill: "#5F95FF", stroke: "#5F95FF" } },
            },
        },
    });
    graph
        .use(new Transform({ resizing: true }))
        .use(
            new Selection({
                rubberband: true,
                showNodeSelectionBox: true,
                pointerEvents: "none",
                modifiers: "ctrl",
            })
        )
        .use(new Snapline())
        .use(new Keyboard())
        .use(new Clipboard())
        .use(new History());



    Graph.registerNode(
        "start-node",
        {
            inherit: "rect",
            width: 80,
            height: 36,
            attrs: {
                body: { stroke: "#1890FF", fill: "#EFF4FF", rx: 20, ry: 20 },
                label: { text: "开始" },
            },
            ports: {
                ...FLOW_PORTS,
                items: [{ group: "bottom" }],
            },
        },
        true
    );
    Graph.registerNode(
        "end-node",
        {
            inherit: "rect",
            width: 80,
            height: 36,
            attrs: {
                body: { stroke: "#FF4D4F", fill: "#FFF1F0", rx: 20, ry: 20 },
                label: { text: "结束" },
            },
            ports: {
                ...FLOW_PORTS,
                items: [{ group: "top" }],
            },
        },
        true
    );
    Graph.registerNode(
        "rule-node",
        {
            inherit: "polygon",
            width: 80,
            height: 48,
            attrs: {
                body: {
                    stroke: "#5F95FF",
                    fill: "#EFF4FF",
                    refPoints: "0,24 40,0 80,24 40,48",
                },
                label: { text: "规则" },
            },
            ports: FLOW_PORTS,
        },
        true
    );
    Graph.registerNode(
        "score-node",
        {
            inherit: "rect",
            width: 130,
            height: 46,
            attrs: {
                body: { stroke: "#5F95FF", fill: "#EFF4FF", rx: 6, ry: 6 },
                label: { text: "评分" },
            },
            ports: {
                ...FLOW_PORTS,
                items: [{ group: "top" }, { group: "bottom" }],
            },
        },
        true
    );

    function hideAllPorts() {
        graph?.getNodes().forEach((n) => {
            n.getPorts().forEach((p) => {
                if (p.id) {
                    n.portProp(p.id as string, "attrs/circle/style/visibility", "hidden");
                }
            });
        });
    }

    function showPorts(node: any) {
        node.getPorts().forEach((p: any) => {
            if (p.id) {
                node.portProp(p.id as string, "attrs/circle/style/visibility", "visible");
            }
        });
    }

    /***********************
     * 事件
     ***********************/
    graph.on("node:mouseenter", ({ node }) => {
        hideAllPorts(); // 先清除其他节点的连接桩
        node.toFront(); // 保证当前节点在最上层
        showPorts(node); // 显示当前节点连接桩
    });

    graph.on("node:mouseleave", () => {
        hideAllPorts(); // 移出后全部隐藏
    });

    graph.on("node:selected", ({ node }) => {
        hideAllPorts();
        showPorts(node);

        selectedNode.value = node;
        selectedEdge.value = null;

        // 直接引用，让 v-model 改的就是 node.data
        currentConfig.value = node.getData() || {};

        // 点击节点自动展开面板
        isAsideCollapsed.value = false;
    });

    graph.on("node:unselected", () => {
        selectedNode.value = null;
        selectedEdge.value = null;
    });

    // 让非 normal 类型线自动显示 label
    graph.on("edge:added", ({ edge }) => {
        const cfg = edge.getData() || {};
        const type = cfg.branchType || cfg.type;
        if (type && type !== "normal" && cfg.label) {
            edge.setLabels([
                {
                    attrs: {
                        label: {
                            text: cfg.label,
                            fill: "#333",
                            fontSize: 12,
                        },
                    },
                    position: 0.5,
                },
            ]);
        }
    });

    // 新连线连接完成时，设置初始 type 与 label
    graph.on("edge:connected", ({ edge }) => {
        const sourceNode = edge.getSourceCell();

        if (sourceNode && sourceNode.shape === "rule-node") {
            const existingEdges = graph?.getOutgoingEdges(sourceNode) || [];

            const hasYes = existingEdges.some((e) => {
                const d = e.getData() || {}; // 防止 undefined
                return d.branchType === "branchYes";
            });
            const hasNo = existingEdges.some((e) => {
                const d = e.getData() || {}; // 防止 undefined
                return d.branchType === "branchNo";
            });

            const data = edge.getData() || {};
            if (hasYes && !hasNo) {
                data.branchType = "branchNo";
                data.label = "否";
            } else if (!hasYes && hasNo) {
                data.branchType = "branchYes";
                data.label = "是";
            } else {
                data.branchType = "branchYes";
                data.label = "是";
            }

            edge.setData(data);
            edge.setLabels([
                {
                    attrs: { label: { text: data.label, fill: "#333", fontSize: 12 } },
                    position: 0.5,
                },
            ]);
        }

        if (sourceNode && sourceNode.shape === "score-node") {
            const data = edge.getData() || {};
            if (!data.type) {
                data.type = "conditional";
                data.condition = {};
            }
        }
    });

    graph.on("edge:selected", ({ edge }) => {
        hideAllPorts();

        selectedEdge.value = edge;
        selectedNode.value = null;

        const sourceNode = edge.getSourceCell();
        // graph.getCellById(edge.source.edge)
        if (sourceNode && sourceNode.shape === "rule-node") {
            selectedEdgeType.value = "rule-edge";
        } else if (sourceNode && sourceNode.shape === "score-node") {
            selectedEdgeType.value = "score-edge";
        } else {
            selectedEdgeType.value = "";
        }

        // 直接引用，让面板改的就是 edge.data
        currentConfig.value = edge.getData() || {};

        // 点击连线自动展开面板
        isAsideCollapsed.value = false;
        edge.setAttrs({
            line: {
                stroke: "#FF5722",
                strokeWidth: 2,
            },
        });
    });

    graph.on("edge:unselected", ({ edge }) => {
        selectedNode.value = null;
        selectedEdge.value = null;
        edge.setAttrs({
            line: {
                stroke: "#A2B1C3",
                strokeWidth: 2,
            },
        });
    });

    /***********************
     * region 快捷键与事件
     ***********************/
    graph.bindKey(["meta+c", "ctrl+c"], () => {
        const cells = graph?.getSelectedCells();
        if (cells?.length) {
            graph?.copy(cells);
        }
        return false;
    });
    graph.bindKey(["meta+x", "ctrl+x"], () => {
        const cells = graph?.getSelectedCells();
        if (cells?.length) {
            graph?.cut(cells);
        }
        return false;
    });
    graph.bindKey(["meta+v", "ctrl+v"], () => {
        if (!graph?.isClipboardEmpty()) {
            const cells = graph?.paste({ offset: 32 });
            graph?.cleanSelection();
            graph?.select(cells);
        }
        return false;
    });
    // undo redo
    graph.bindKey(["meta+z", "ctrl+z"], () => {
        if (graph?.canUndo()) {
            graph?.undo();
        }
        return false;
    });
    graph.bindKey(["meta+shift+z", "ctrl+shift+z"], () => {
        if (graph?.canRedo()) {
            graph?.redo();
        }
        return false;
    });
    // select all
    graph.bindKey(["meta+a", "ctrl+a"], () => {
        const nodes = graph?.getNodes();
        if (nodes?.length) {
            graph?.select(nodes);
        }
    });
    // delete
    graph.bindKey("backspace", () => {
        const cells = graph?.getSelectedCells();
        if (cells?.length) {
            graph?.removeCells(cells);
        }
    });
};

/***********************
 * 画布方法
 ***********************/
const saveConfig = () => {
    // 导出业务流程 JSON
    const flowJson = exportBusinessFlow();
    form.flowConfigJson = JSON.stringify(flowJson) as any;
    // 导出画布状态 JSON
    const graphJson = graph?.toJSON();
    form.graphConfigJson = JSON.stringify(graphJson) as any;

    // formLoading.value = true;

    console.log("form:::::::::::::::::::::::", form);
    emit("success", form);
};

const onDrop = (e: DragEvent) => {
    const data = e.dataTransfer?.getData("application/json");
    if (!data) return;
    const comp = JSON.parse(data);
    const pos = graph?.clientToLocal(e.clientX, e.clientY);
    graph?.addNode({
        x: pos?.x || 0,
        y: pos?.y || 0,
        shape: comp.shape,
        label: comp.label,
        data: {
            name: comp.label, // 初始化节点的 name
        },
    });
};

const handleUpdateConfig = (newConfig: any) => {
    currentConfig.value = newConfig;
};

// 初始化画布数据
const initGraphData = async () => {
    resetForm();
    // 初始化流程图
    nextTick(() => {
        if (form.graphConfigJson) graph?.fromJSON(JSON.parse(form.graphConfigJson || "{}"));
        if (form.flowConfigJson) {
            try {
                const flowData = JSON.parse(form.flowConfigJson || '{}');

                // 回显节点
                if (Array.isArray(flowData.nodes)) {
                    flowData.nodes.forEach((n: any) => {
                        const cell = graph?.getCellById(n.id);
                        if (cell && cell.isNode()) {
                            const node = cell as Node;
                            node.setData({
                                ...node.getData(),
                                ...n,
                            });
                            if (n.name) {
                                node.attr("label/text", n.name);
                            }
                        }
                    });
                }

                // 回显连线
                if (Array.isArray(flowData.edges)) {
                    flowData.edges.forEach((e: any) => {
                        const cell = graph?.getCellById(e.id);
                        if (cell && cell.isEdge()) {
                            const edge = cell as Edge;
                            edge.setData({
                                ...edge.getData(),
                                ...e,
                            });
                            if (e.label) {
                                edge.setLabels([
                                    {
                                        attrs: {
                                            label: { text: e.label, fill: "#333", fontSize: 12 },
                                        },
                                        position: 0.5,
                                    },
                                ]);
                            }
                        }
                    });
                }
            } catch (err) {
                console.error("flowConfigJson 解析失败", err);
            }
        }
        lastGraphJson.value = JSON.stringify(graph?.toJSON());
        selectedNode.value = null;
        selectedEdge.value = null;
    });
};

// 居中画布
const centerGraph = () => {
    graph?.centerContent();
};

watch(
    () => [props.graphConfigJson, props.flowConfigJson],
    (newVal) => {
        if (!newVal) return;
        console.log("newVal:::::::::::::::::::::::", newVal);
        form.graphConfigJson = newVal?.[0] || "";
        form.flowConfigJson = newVal?.[1] || "";

        initGraphData();
    }
);

// 同步来自 props 的风控因子选项，并做标准化
watch(
    () => props.riskFactorOptions,
    (list) => {
        const src = list ?? [];
        riskFactorOptions.value = src.map((item: any) => ({
            label: item.label ?? item.factorName,
            value: item.value ?? item.factorCode,
            raw: item,
        }));
    },
    { immediate: true }
);

/***********************
 * 监听 & 生命周期
 ***********************/
defineExpose({ close });

onMounted(() => {
    nextTick(() => {
        initGraph();
    });
});


const setValue = () => {
    form.graphConfigJson = `{"cells":[{"position":{"x":590,"y":131},"size":{"width":80,"height":36},"attrs":{"text":{"text":"开始"}},"visible":true,"shape":"start-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"bottom","id":"0b5c9b0c-ec82-4388-ad83-658fc1b7ece1","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"a5cfc35d-9d35-4038-ad72-af899de729e4","data":{"name":"开始"},"zIndex":3},{"shape":"edge","attrs":{"line":{"stroke":"#A2B1C3","targetMarker":{"name":"block","width":12,"height":8}}},"id":"8529cb98-257f-4d9a-84a0-49ed12dc8053","source":{"cell":"a5cfc35d-9d35-4038-ad72-af899de729e4","port":"0b5c9b0c-ec82-4388-ad83-658fc1b7ece1"},"target":{"cell":"5371e781-f7e0-4c24-9b27-b955d2d24502","port":"9925b7c1-9334-42e2-9632-7fac805b5ff8"},"zIndex":4},{"shape":"edge","attrs":{"line":{"stroke":"#A2B1C3","targetMarker":{"name":"block","width":12,"height":8}}},"id":"447b3a9d-2990-4fa9-9a6d-e4a19d491acb","source":{"cell":"5371e781-f7e0-4c24-9b27-b955d2d24502","port":"108b3272-1e4f-4515-8b54-35230dbe4e3a"},"target":{"cell":"030d292c-6221-4dbe-a144-297fec211a49","port":"615d7503-ba6b-47d7-aac1-a7165662a82c"},"zIndex":8,"data":{"branchType":"branchYes","label":"是"},"labels":[{"attrs":{"label":{"text":"是","fill":"#333","fontSize":12}},"position":0.5}]},{"shape":"edge","attrs":{"line":{"stroke":"#A2B1C3","targetMarker":{"name":"block","width":12,"height":8}}},"id":"a7cbc7e1-df70-4f07-9cf6-73873829dc47","source":{"cell":"5371e781-f7e0-4c24-9b27-b955d2d24502","port":"e7f8b1b4-2b7b-4f7f-9525-bd5bc06eccff"},"target":{"cell":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","port":"295e2149-6fe2-459d-be76-736bc9957e38"},"zIndex":13,"data":{"branchType":"branchNo","label":"否"},"labels":[{"attrs":{"label":{"text":"否","fill":"#333","fontSize":12}},"position":0.5}]},{"position":{"x":920,"y":434},"size":{"width":80,"height":36},"attrs":{"text":{"text":"结束"}},"visible":true,"shape":"end-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"top","id":"295e2149-6fe2-459d-be76-736bc9957e38","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","data":{"name":"结束"},"zIndex":14},{"position":{"x":590,"y":650},"size":{"width":80,"height":36},"attrs":{"text":{"text":"结束"}},"visible":true,"shape":"end-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"top","id":"615d7503-ba6b-47d7-aac1-a7165662a82c","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"030d292c-6221-4dbe-a144-297fec211a49","data":{"name":"结束","userRiskLevel":3},"zIndex":15},{"position":{"x":590,"y":380},"size":{"width":80,"height":48},"attrs":{"text":{"text":"规则"}},"visible":true,"shape":"rule-node","ports":{"groups":{"top":{"position":"top","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"right":{"position":"right","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"bottom":{"position":"bottom","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}},"left":{"position":"left","attrs":{"circle":{"r":4,"magnet":true,"stroke":"#5F95FF","strokeWidth":1,"fill":"#fff","style":{"visibility":"hidden"}}}}},"items":[{"group":"top","id":"9925b7c1-9334-42e2-9632-7fac805b5ff8","attrs":{"circle":{"style":{"visibility":"hidden"}}}},{"group":"right","id":"e7f8b1b4-2b7b-4f7f-9525-bd5bc06eccff","attrs":{"circle":{"style":{"visibility":"hidden"}}}},{"group":"bottom","id":"108b3272-1e4f-4515-8b54-35230dbe4e3a","attrs":{"circle":{"style":{"visibility":"hidden"}}}},{"group":"left","id":"aac16c0a-5d39-4473-aca9-f0f8b21d7b8f","attrs":{"circle":{"style":{"visibility":"hidden"}}}}]},"id":"5371e781-f7e0-4c24-9b27-b955d2d24502","data":{"name":"规则","expression":[{"type":"condition","uid":"mhacwvv0_cya927","name":"条件1","field":"","operator":"eq","value":"1"}]},"zIndex":16}]}`;
    form.flowConfigJson = `{"nodes":[{"id":"a5cfc35d-9d35-4038-ad72-af899de729e4","type":"start","name":"开始"},{"id":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","type":"end","name":"结束"},{"id":"030d292c-6221-4dbe-a144-297fec211a49","type":"end","name":"结束","userRiskLevel":3},{"id":"5371e781-f7e0-4c24-9b27-b955d2d24502","type":"rule","name":"规则","expression":{"logic":"AND","conditions":[{"parameterName":"","parameter":"","operator":"=","value":1}]}}],"edges":[{"id":"8529cb98-257f-4d9a-84a0-49ed12dc8053","source":"a5cfc35d-9d35-4038-ad72-af899de729e4","target":"5371e781-f7e0-4c24-9b27-b955d2d24502","type":"normal"},{"id":"447b3a9d-2990-4fa9-9a6d-e4a19d491acb","source":"5371e781-f7e0-4c24-9b27-b955d2d24502","target":"030d292c-6221-4dbe-a144-297fec211a49","type":"branchYes","label":"是"},{"id":"a7cbc7e1-df70-4f07-9cf6-73873829dc47","source":"5371e781-f7e0-4c24-9b27-b955d2d24502","target":"e1a8cdaa-0243-46cf-986b-3b9da6990f49","type":"branchNo","label":"否"}]}`
    initGraphData();

}





</script>

<style>
.panel-tit {
    text-align: center;
}
</style>

<style scoped>
@import './App.less';
</style>
