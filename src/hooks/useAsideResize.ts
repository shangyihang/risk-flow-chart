import { ref } from 'vue'

export function useAsideResize(options?: { initial?: number; min?: number; max?: number }) {
  const width = ref<number>(options?.initial ?? 400)
  const isResizing = ref<boolean>(false)
  let startX = 0
  let startWidth = width.value

  const onResizeStart = (e: MouseEvent) => {
    isResizing.value = true
    startX = e.clientX
    startWidth = width.value

    const onResizing = (e: MouseEvent) => {
      if (!isResizing.value) return
      const min = options?.min ?? 200
      const max = options?.max ?? 500
      const delta = startX - e.clientX // drag left increases width
      const next = Math.max(min, Math.min(max, startWidth + delta))
      width.value = next
    }

    const onResizeEnd = () => {
      if (!isResizing.value) return
      isResizing.value = false
      document.removeEventListener('mousemove', onResizing)
      document.removeEventListener('mouseup', onResizeEnd)
    }

    document.addEventListener('mousemove', onResizing)
    document.addEventListener('mouseup', onResizeEnd)
    e.preventDefault()
  }

  return { width, isResizing, onResizeStart }
}