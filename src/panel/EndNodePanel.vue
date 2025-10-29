<template>
  <a-form :label-col="{ style: { width: '80px' } }">
    <h3 style="text-align: center;">结束节点配置</h3>
    <a-divider style="margin: 15px 0 10px;" />
    <a-form-item label="节点名称">
      <a-input v-model:value="localName" @update:value="onNameChange" />
    </a-form-item>
    <a-form-item label="用户等级">
      <a-select v-model:value="localUserRiskLevel">
        <a-select-option :value="0">尾流用户</a-select-option>
        <a-select-option :value="1">全流程用户</a-select-option>
        <a-select-option :value="2">中流程用户</a-select-option>
        <a-select-option :value="3">半流程用户</a-select-option>
      </a-select>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{ model: any; config: { name?: string; userRiskLevel?: number } }>()
const emit = defineEmits(['update:config'])

const localName = ref(props.config.name ?? props.model.attrs.label.text ?? '')
const localUserRiskLevel = ref(props.config.userRiskLevel ?? 0)

const onNameChange = (val: string) => {
  props.model.setAttrs({ label: { text: val } })
  props.model.setData({
    ...props.config,
    name: val,
    userRiskLevel: localUserRiskLevel.value
  })
  emit('update:config', { ...props.config, name: val, userRiskLevel: localUserRiskLevel.value })
}

watch(localUserRiskLevel, (val) => {
  props.model.setData({
    ...props.config,
    name: localName.value,
    userRiskLevel: val
  })
  emit('update:config', { ...props.config, name: localName.value, userRiskLevel: val })
})
</script>
