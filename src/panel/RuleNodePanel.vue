<template>
    <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <h3 style="text-align: center;" v-if="!isCom">规则节点配置</h3>
        <a-divider style="margin: 15px 0 10px;" />
        <!-- 节点名称 -->
        <a-form-item label="节点名称">
            <a-input v-model:value="localName" @change="onNameChange" />
        </a-form-item>

        <!-- 表达式按钮组 -->
        <a-form-item label="表达式构建">
            <div class="btn-group">
                <a-button type="primary" @click="addCondition">条件</a-button>
                <a-button type="primary" @click="addOperator('AND')">且</a-button>
                <a-button type="primary" @click="addOperator('OR')">或</a-button>
                <a-button type="primary" @click="addParen('(')">(</a-button>
                <a-button type="primary" @click="addParen(')')">)</a-button>
            </div>
        </a-form-item>
        <a-divider style="margin: 15px 0 10px;" />

        <!-- 表达式预览 -->
        <a-form-item :label-col="{ span: 0 }" :wrapper-col="{ span: 24 }">
            <div class="expression-preview" @dragover.prevent @drop="onDrop">
                <span v-for="(element, index) in localExpression" :key="element.uid"
                    :class="['expr-item', selectedExprKey === element.uid ? 'selected' : '', element.type === 'condition' ? 'condition-item' : '']"
                    :draggable="true" @click="selectedExprKey = element.uid" @dragstart="onDragStart($event, index)"
                    @dragenter.prevent="onDragEnter($event, index)" @dragover.prevent>
                    {{ formatExprItem(element) }}
                    <svg class="expr-del" @click.stop="delCondition(index)" width="12" height="12" viewBox="0 0 14 14"
                        aria-hidden="true" focusable="false">
                        <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            fill="none" />
                    </svg>
                </span>
            </div>
        </a-form-item>

        <!-- 条件编辑 -->
        <div v-if="selectedItem?.type === 'condition'" style="margin-top: 12px">
            <a-divider style="margin: 15px 0 10px;" />
            <!-- 条件名称 -->
            <a-form-item label="条件名称">
                <a-input v-model:value="selectedItem.name" placeholder="请输入条件名称" />
            </a-form-item>
            <!-- 风控因子 -->
            <a-form-item label="因子">
                <a-select v-model:value="selectedItem.field" placeholder="请选择" @change="onFactorChange">
                    <a-select-option v-for="opt in riskFactorOptions" :key="opt.value" :label="opt.label"
                        :value="opt.value">{{ opt.label }}</a-select-option>
                </a-select>
            </a-form-item>

            <!-- 运算符 -->
            <a-form-item label="运算符">
                <a-select v-model:value="selectedItem.operator" placeholder="请选择">
                    <a-select-option value="gt">&gt;</a-select-option>
                    <a-select-option value="ge">&gt;=</a-select-option>
                    <a-select-option value="lt">&lt;</a-select-option>
                    <a-select-option value="le">&lt;=</a-select-option>
                    <a-select-option value="eq">&#61;</a-select-option>
                    <a-select-option value="ne">&#33;&#61;</a-select-option>
                    <a-select-option value="contains">包含</a-select-option>
                    <a-select-option value="in">在集合中</a-select-option>
                    <a-select-option value="notIn">不在集合中</a-select-option>
                </a-select>
            </a-form-item>

            <!-- 值输入，根据 valueType 动态渲染 -->
            <a-form-item label="值">
                <!-- 枚举 -->
                <a-select v-if="selectedFactor?.valueType === 5" v-model:value="selectedItem.value"
                    placeholder="请选择枚举值">
                    <a-select-option v-for="enm in enumOptions" :key="enm.value" :value="enm.value">{{ enm.name
                        }}</a-select-option>
                </a-select>

                <!-- 数值 or 百分比 -->
                <a-input-number v-else-if="[0, 2].includes(selectedFactor?.valueType)"
                    v-model:value="selectedItem.value" :min="0" style="width: 150px" />

                <!-- 字符串 -->
                <a-input v-else-if="selectedFactor?.valueType === 1" v-model:value="selectedItem.value"
                    placeholder="请输入字符串" />

                <!-- 区间 -->
                <div v-else-if="selectedFactor?.valueType === 3" style="display: flex; gap: 8px; align-items: center;">
                    <a-input-number v-model:value="selectedItem.valueStart" :min="0" style="width: 100px" />
                    <span>~</span>
                    <a-input-number v-model:value="selectedItem.valueEnd" :min="0" style="width: 100px" />
                </div>

                <!-- 布尔 -->
                <a-select v-else-if="selectedFactor?.valueType === 4" v-model:value="selectedItem.value">
                    <a-select-option value="0">是</a-select-option>
                    <a-select-option value="1">否</a-select-option>
                </a-select>

                <!-- 默认输入框 -->
                <a-input v-else v-model:value="selectedItem.value" placeholder="请输入条件值" />
            </a-form-item>
        </div>
    </a-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, toRefs } from 'vue'

const props = withDefaults(defineProps<{ model: any; config: { name?: string; expression?: any[] }; isCom?: boolean; riskFactorOptions?: { label: string; value: string; raw: any }[] }>(), {
    isCom: false
})
const { isCom } = toRefs(props)
const emit = defineEmits(['update:config'])

const localName = ref(props.config.name ?? props.model.attrs.label.text ?? '')
const onNameChange = (e: Event) => {
    const val = (e.target as HTMLInputElement).value
    props.model.setAttrs({ label: { text: val } })
    props.model.setData({ ...props.config, name: val })
    emit('update:config', { ...props.config, name: val, expression: localExpression.value })
}

const localExpression = ref<any[]>(Array.isArray(props.config?.expression) ? [...props.config.expression] : [])
const selectedExprKey = ref<string | null>(null)
const selectedItem = computed(() => {
    if (!selectedExprKey.value) return null
    return localExpression.value.find((it) => it.uid === selectedExprKey.value) || null
})

const genUid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
const ensureExprUids = () => {
    localExpression.value.forEach((it) => {
        if (!it.uid) it.uid = genUid()
    })
}
// 风控因子选项：改为从 props 获取
const riskFactorOptions = computed(() => props.riskFactorOptions ?? [])
onMounted(() => {
    ensureExprUids()
    ensureConditionNames()
})

// 补齐条件名称（默认：条件+索引）
const ensureConditionNames = () => {
    let counter = 1
    localExpression.value.forEach((it) => {
        if (it.type === 'condition') {
            if (!it.name || String(it.name).trim() === '') {
                it.name = `条件${counter}`
            }
            counter++
        }
    })
}
// 当前选中因子信息
const selectedFactor = computed(() => {
    if (!selectedItem.value?.field) return null
    return riskFactorOptions.value.find((f) => f.value === selectedItem.value.field)?.raw ?? null
})

// 枚举选项
const enumOptions = computed(() => {
    if (selectedFactor.value?.enumData) {
        try {
            return JSON.parse(selectedFactor.value.enumData) || []
        } catch {
            return []
        }
    }
    return []
})

const onFactorChange = () => {
    // 重置值
    selectedItem.value.value = ''
}

// 添加条件项
const addCondition = () => {
    const idx = localExpression.value.filter((i) => i.type === 'condition').length + 1
    localExpression.value.push({ type: 'condition', uid: genUid(), name: `条件${idx}`, field: '', operator: '', value: '' })
}
// 删除条件项
const delCondition = (index: number) => {
    const removed = localExpression.value.splice(index, 1)[0]
    if (removed?.uid && selectedExprKey.value === removed.uid) {
        selectedExprKey.value = null
    }
}
// 添加 AND/OR
const addOperator = (op: 'AND' | 'OR') => {
    localExpression.value.push({ type: 'operator', uid: genUid(), value: op })
}
// 添加括号
const addParen = (paren: '(' | ')') => {
    localExpression.value.push({ type: 'paren', uid: genUid(), value: paren })
}

// 展示格式
const formatExprItem = (item: any) => {
    if (item.type === 'condition') {
        // 仅展示条件名称
        return item.name || '条件'
    } else if (item.type === 'operator') {
        return item.value === 'AND' ? '且' : '或'
    } else if (item.type === 'paren') {
        return item.value
    }
    return ''
}

// 拖拽相关状态
const draggedIndex = ref<number | null>(null)

// 拖拽开始
const onDragStart = (event: DragEvent, index: number) => {
    draggedIndex.value = index
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', index.toString())
    }
    // 添加拖拽样式
    const target = event.target as HTMLElement
    target.style.opacity = '0.5'
}

// 拖拽进入
const onDragEnter = (event: DragEvent, index: number) => {
    event.preventDefault()
    if (draggedIndex.value !== null && draggedIndex.value !== index) {
        // 添加拖拽目标样式
        const target = event.target as HTMLElement
        target.style.borderLeft = '2px solid #1890ff'
    }
}

// 拖拽结束时的放置处理
const onDrop = (event: DragEvent) => {
    event.preventDefault()

    // 清除所有拖拽样式
    const allItems = document.querySelectorAll('.expr-item')
    allItems.forEach(item => {
        const element = item as HTMLElement
        element.style.opacity = ''
        element.style.borderLeft = ''
    })

    if (draggedIndex.value === null) return

    // 找到放置目标的索引
    const target = event.target as HTMLElement
    const targetItem = target.closest('.expr-item')
    if (!targetItem) return

    const targetIndex = Array.from(targetItem.parentElement?.children || []).indexOf(targetItem)

    if (targetIndex !== -1 && targetIndex !== draggedIndex.value) {
        // 执行数组元素移动
        const draggedItem = localExpression.value[draggedIndex.value]
        const newExpression = [...localExpression.value]

        // 移除拖拽的元素
        newExpression.splice(draggedIndex.value, 1)

        // 计算新的插入位置
        const insertIndex = draggedIndex.value < targetIndex ? targetIndex - 1 : targetIndex

        // 插入到新位置
        newExpression.splice(insertIndex, 0, draggedItem)

        localExpression.value = newExpression
    }

    draggedIndex.value = null
}

watch(localExpression, (val) => {
    props.model.setData({ ...props.config, expression: val })
    emit('update:config', { ...props.config, expression: val })
}, { deep: true })
</script>

<style scoped>
.btn-group {
    display: flex;
    flex-wrap: wrap;

    /* gap: 4px; */
    margin-bottom: 8px;
}

.btn-group .ant-btn {
    width: 40px;
    padding: 2px;
    margin: 0;
    margin-right: 3px;
}

.expression-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.expr-item {
    position: relative;
    padding: 2px 8px;
    cursor: move;
    background: #f5f5f5;
    border-radius: 4px;
    transition: all 0.2s ease;
    user-select: none;
}

.expr-item:hover {
    background: #e6f7ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.expr-item.selected {
    background: #e6f7ff;
    border: 1px solid #1890ff;
}

.condition-item {
    color: #aeaeae;
}

.expr-del {
    position: absolute;
    top: -6px;
    right: -6px;
    display: none;
    color: #F56C6C;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
}

.expr-item:hover .expr-del,
.expr-item.selected .expr-del {
    display: inline-flex;
}
</style>
