<template>
    <a-form :label-col="{ style: { width: '80px' } }">
        <h3 style="text-align: center;">评分卡配置</h3>
        <a-divider style="margin: 15px 0 10px;" />
        <!-- 节点名称 -->
        <a-form-item label="节点名称">
            <a-input v-model:value="localName" @update:value="onNameChange" />
        </a-form-item>

        <a-button type="primary" @click="addRule">添加评分规则</a-button>

        <!-- 循环展示规则，复用现有规则组件 -->
        <div v-for="(rule, i) in localRules" :key="i" class="rule-card">
            <div class="rule-header">
                <span>{{ rule.name }}</span>
                <div style="display:flex;align-items:center;gap:8px">
                    <span>得分:</span>
                    <a-input-number v-model:value="rule.score" :min="0" style="width:80px" />
                    <a-dropdown :trigger="['hover']">
                        <svg
                            class="icon-rotate-90"
                            width="16"
                            height="16"
                            viewBox="0 0 1024 1024"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <circle cx="256" cy="512" r="64" />
                            <circle cx="512" cy="512" r="64" />
                            <circle cx="768" cy="512" r="64" />
                        </svg>
                        <template #overlay>
                            <a-menu @click="(item: any) => { if (item.key === 'delete') removeRule(i) }">
                                <a-menu-item key="delete">删除</a-menu-item>
                            </a-menu>
                        </template>
                    </a-dropdown>
                </div>
            </div>
            <RuleNodePanel :isCom="true" :model="makeRuleModelProxy(i)" :config="rule"
                @update:config="updateRule(i, $event)" />
        </div>
    </a-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import RuleNodePanel from './RuleNodePanel.vue'

const props = defineProps<{ model: any; config: { name?: string; rules?: any[] } }>()
const emit = defineEmits(['update:config'])

// 本地名称初始化，如果 config.name 没有值，用节点 label.text
const localName = ref(props.config.name ?? props.model.attrs.label?.text ?? '')

// 本地规则副本：每条规则含 name / expression / score
const localRules = ref<{ name?: string; expression?: any[]; score?: number }[]>(
    props.config.rules ? [...props.config.rules] : []
)

// 改名时，同时：
const onNameChange = (val: string) => {
    // 改 label 显示
    props.model.setAttrs({ label: { text: val } })
    // 改节点 data
    props.model.setData({
        ...props.config,
        name: val,
        rules: localRules.value
    })
    // 发给父组件
    emit('update:config', { ...props.config, name: val, rules: localRules.value })
}

// 监听规则数组变化
watch(
    localRules,
    (val) => {
        // 更新 X6 节点 data
        props.model.setData({
            ...props.config,
            name: localName.value,
            rules: val
        })
        // 发给父组件
        emit('update:config', { ...props.config, name: localName.value, rules: val })
    },
    { deep: true }
)


// 添加/删除规则
const addRule = () => {
    localRules.value.push({ name: `规则${localRules.value.length + 1}`, expression: [], score: 0 })
}
const removeRule = (index: number) => {
    localRules.value.splice(index, 1)
}

// 将现有 RuleNodePanel 嵌入到每条规则中：提供一个 model 代理
const makeRuleModelProxy = (index: number) => {
    return {
        attrs: { label: { text: localRules.value[index]?.name ?? '' } },
        setAttrs: (payload: any) => {
            const text = payload?.label?.text
            if (text != null) localRules.value[index].name = text
        },
        setData: (data: any) => {
            // 只合并表达式等字段到对应规则
            localRules.value[index] = { ...localRules.value[index], ...data }
        }
    }
}

// 子组件回传更新
const updateRule = (index: number, cfg: any) => {
    localRules.value[index] = { ...localRules.value[index], ...cfg }
}
</script>

<style scoped>
.rule-card {
    padding: 12px;
    margin-top: 12px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
}

.rule-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.icon-rotate-90 {
    cursor: pointer;
    transform: rotate(90deg);
}
</style>
