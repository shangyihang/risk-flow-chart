<template>
  <a-form :label-col="{ style: { width: '80px' } }">
    <h3 class="panel-tit">规则连线配置</h3>
    <a-divider style="margin: 15px 0 10px;" />
    <a-form-item label="分支类型">
      <a-select v-model:value="localBranchType">
        <a-select-option value="branchYes">是</a-select-option>
        <a-select-option value="branchNo">否</a-select-option>
      </a-select>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// 接收父组件传来的 Edge 实例(model) 和当前配置对象(config)
const props = defineProps<{
  model: any // 选中的 Edge 实例
  config: { branchType?: string } // 当前配置对象
}>()
const emit = defineEmits(['update:config'])

// 初始化面板的本地值
const localBranchType = ref(props.config.branchType ?? '')

// 监听下拉选择的变动
watch(localBranchType, (val) => {
  const newCfg = { ...props.config, branchType: val }

  // 同步到父组件
  emit('update:config', newCfg)

  // 同步到 Graph edge.data
  props.model.setData(newCfg)

  // 同步 label 到画布
  const labelText = val === 'branchYes' ? '是' : val === 'branchNo' ? '否' : ''
  props.model.setLabels(
    labelText
      ? [{ attrs: { label: { text: labelText, fill: '#333', fontSize: 12 } }, position: 0.5 }]
      : []
  )
})
</script>
