import { ref } from 'vue'
import type { DragData } from '@/types'

export function useDragDrop() {
  const isDragging = ref(false)
  const currentDragData = ref<DragData | null>(null)
  const dragOverTarget = ref<string | null>(null)

  function onDragStart(e: DragEvent, data: DragData) {
    if (!e.dataTransfer) return
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'move'
    isDragging.value = true
    currentDragData.value = data
  }

  function onDragEnd() {
    isDragging.value = false
    currentDragData.value = null
    dragOverTarget.value = null
  }

  function onDragOver(e: DragEvent, targetId: string) {
    e.preventDefault()
    if (!e.dataTransfer) return
    e.dataTransfer.dropEffect = 'move'
    dragOverTarget.value = targetId
  }

  function onDragLeave() {
    dragOverTarget.value = null
  }

  function onDrop(e: DragEvent): DragData | null {
    e.preventDefault()
    if (!e.dataTransfer) return null
    
    const dataStr = e.dataTransfer.getData('application/json')
    if (!dataStr) return null

    try {
      const data = JSON.parse(dataStr) as DragData
      onDragEnd()
      return data
    } catch {
      return null
    }
  }

  return {
    isDragging,
    currentDragData,
    dragOverTarget,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
