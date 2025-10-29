<template>
  <a-form :label-col="{ style: { width: '80px' } }">
    <h3 class="panel-tit">开始节点配置</h3>
    <a-divider style="margin: 15px 0 10px;" />
    <a-form-item label="节点名称">
      <a-input v-model:value="localName" @update:value="onNameChange" />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ model: any; config: any }>()
const emit = defineEmits(['update:config'])

const localName = ref(props.config.name ?? props.model.attrs.label.text ?? '')
const onNameChange = (val: string) => {
  props.model.setAttrs({ label: { text: val } })
  props.model.setData({
    ...props.config,
    name: val
  })
  emit('update:config', { ...props.config, name: val })
}

// Start节点只有名称，无需更新config其他字段
</script>
