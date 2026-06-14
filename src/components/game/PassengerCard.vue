<script setup lang="ts">
import { computed } from 'vue'
import { User, Crown, Accessibility, Clock } from 'lucide-vue-next'
import type { Passenger } from '@/types'
import { formatTime, formatClockTime } from '@/utils/helpers'
import { getPriorityColor, getDestinationColor } from '@/utils/formatters'
import { useDragDrop } from '@/composables/useDragDrop'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  passenger: Passenger
  draggable?: boolean
  showArrivalTime?: boolean
}>()

const emit = defineEmits<{
  (e: 'dragStart', passengerId: string): void
  (e: 'click', passengerId: string): void
}>()

const gameStore = useGameStore()
const { onDragStart, onDragEnd } = useDragDrop()

const priorityIcon = computed(() => {
  switch (props.passenger.priority) {
    case 'disabled': return Accessibility
    case 'vip': return Crown
    default: return User
  }
})

const waitTime = computed(() => {
  if (props.passenger.status === 'pending') return null
  return Math.max(0, gameStore.gameTime - props.passenger.arrivalTime)
})

const isDraggable = computed(() => {
  return props.draggable !== false && 
         (props.passenger.status === 'arrived' || props.passenger.status === 'waiting')
})

const cardClasses = computed(() => {
  const base = 'p-3 rounded-lg border-2 cursor-move transition-all duration-200 select-none'
  const priority = getPriorityColor(props.passenger.priority)
  const opacity = props.passenger.status === 'pending' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'
  return `${base} ${priority} ${opacity}`
})

const handleDragStart = (e: DragEvent) => {
  if (!isDraggable.value) {
    e.preventDefault()
    return
  }
  onDragStart(e, {
    type: 'passenger',
    id: props.passenger.id,
    sourceAreaId: props.passenger.waitingAreaId,
  })
  emit('dragStart', props.passenger.id)
}

const handleDragEnd = () => {
  onDragEnd()
}

const handleClick = () => {
  if (props.passenger.status !== 'pending') {
    emit('click', props.passenger.id)
  }
}
</script>

<template>
  <div
    :class="cardClasses"
    :draggable="isDraggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <component :is="priorityIcon" class="w-4 h-4" />
        <span class="text-xs font-medium">
          {{ passenger.priority === 'disabled' ? '残障' : passenger.priority === 'vip' ? 'VIP' : '普通' }}
        </span>
      </div>
      <span 
        :class="[
          'text-xs px-2 py-0.5 rounded-full border',
          getDestinationColor(passenger.destination)
        ]"
      >
        {{ passenger.destination }}
      </span>
    </div>
    
    <div class="text-xs text-slate-600 flex items-center gap-1">
      <Clock class="w-3 h-3" />
      <span v-if="passenger.status === 'pending'">
        到达时间: {{ formatClockTime(passenger.arrivalTime) }}
      </span>
      <span v-else-if="waitTime !== null">
        已等待: {{ formatTime(waitTime) }}
      </span>
    </div>

    <div v-if="passenger.originalPriority && passenger.originalPriority !== passenger.priority" 
         class="mt-1 text-xs text-amber-600">
      优先级已变更
    </div>

    <div v-if="passenger.status === 'pending'" 
         class="mt-2 text-xs text-slate-400">
      尚未到达，无法操作
    </div>
  </div>
</template>
