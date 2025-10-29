<template>
  <a-form :label-col="{ style: { width: '50px' } }">
    <h3 style="text-align: center;">评分连线配置</h3>
    <a-divider style="margin: 15px 0 10px;" />
    <a-form-item>
      <a-radio-group v-model:value="conditionType" class="mb-4">
        <a-radio value="single">单条件</a-radio>
        <a-radio value="double">双条件</a-radio>
      </a-radio-group>
    </a-form-item>
    <a-form-item label="范围:">
      <div>
        <template v-if="conditionType === 'single'">
          <a-tag color="blue" style="width: 60px;margin: 0 3px;">分数</a-tag>
          <!-- 下限操作符 -->
          <a-select v-model:value="localOp1" style="width: 60px">
            <a-select-option v-for="(v, k) in selectOption" :key="k" :value="k">{{ v }}</a-select-option>
          </a-select>
          <!-- 下限值 -->
          <a-input-number v-model:value="localMin" style="width: 60px" />
        </template>
        <!-- 双条件时显示第二个条件 -->
        <template v-if="conditionType === 'double'">
          <a-tag color="blue" style="width: 60px;margin: 0 3px;">分数</a-tag>
          <a-select v-model:value="localOp1" style="width: 60px">
            <a-select-option v-for="(v, k) in selectOption" :key="k" :value="k">{{ v }}</a-select-option>
          </a-select>
          <a-input-number v-model:value="localMin" style="width: 60px" />
          <div>且</div>
          <a-tag color="blue" style="width: 60px;margin: 0 3px;">分数</a-tag>
          <!-- 上限操作符 -->
          <a-select v-model:value="localOp2" style="width: 60px">
            <a-select-option v-for="(v, k) in selectOption" :key="k" :value="k">{{ v }}</a-select-option>
          </a-select>
          <!-- 上限值 -->
          <a-input-number v-model:value="localMax" style="width: 60px" />
        </template>
      </div>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  model: any
  config: {
    condition?: { operator1?: string; value1?: number; operator2?: string; value2?: number }
  }
}>()
const emit = defineEmits(['update:config'])

// 本地表单值初始化
// 根据是否有第二个条件来初始化条件类型
const conditionType = ref(props.config.condition?.operator2 ? 'double' : 'single')

const localOp1 = ref(props.config.condition?.operator1 ?? '>=')
const localMin = ref(props.config.condition?.value1 ?? 0)
const localOp2 = ref(props.config.condition?.operator2 ?? '')
const localMax = ref(props.config.condition?.value2 ?? 0)


const selectOptionMap = ref({
  '>=': '≤',
  '>': '<',
  '<=': '≥',
  '<': '>',
  '=': '=',
})
const selectOption = ref({
  '<=': '≤',
  '<': '<',
  '>=': '≥',
  '>': '>',
  '=': '=',
})

// 监听条件类型变化
watch(conditionType, (type) => {
  if (type === 'single') {
    // 切换到单条件时，清除第二个条件的值
    localOp2.value = undefined
    localMax.value = undefined
  } else {
    // 切换到双条件时，如果没有值则设置默认值
    if (!localOp2.value) localOp2.value = '>'
    if (localMax.value === undefined) localMax.value = 0
  }
})

// 当用户修改任一值时更新父组件 config + Edge 实例数据
watch([conditionType, localOp1, localMin, localOp2, localMax], ([type, op1, min, op2, max]) => {
  const condition = type === 'single'
    ? { operator1: op1, value1: min }
    : { operator1: op1, value1: min, operator2: op2, value2: max }

  const newCfg = {
    ...props.config,
    condition
  }

  emit('update:config', newCfg) // 更新父组件 config
  props.model.setData(newCfg) // 更新 Graph edge.data

  // 更新 label
  let labelText = ''
  if (type === 'single' && op1 && min != null) {
    labelText = `分数 ${selectOption.value[op1]} ${min}`
  } else if (type === 'double' && op1 && min != null && op2 && max != null) {
    labelText = `${max} ${selectOptionMap.value[op2]} 分数 ${selectOption.value[op1]} ${min}`
  }
  props.model.setLabels(
    labelText
      ? [{ attrs: { label: { text: labelText, fill: '#333', fontSize: 12 } }, position: 0.5 }]
      : []
  )
})
</script>
