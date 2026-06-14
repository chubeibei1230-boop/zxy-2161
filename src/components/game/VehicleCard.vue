<script setup lang="ts">
import { computed } from 'vue'
import { Bus, Clock, Users, GripVertical, CheckCircle, XCircle } from 'lucide-vue-next'
import type { Vehicle } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { useDragDrop } from '@/composables/useDragDrop'
import { formatTime } from '@/utils/helpers'
import { getDestinationColor } from '@/utils/formatters'

const props = defineProps<{
  vehicle: Vehicle
}>()

const emit = defineEmits<{
  (e: 'dragStart', vehicleId: string): void
}>()

const gameStore = useGameStore()
const { onDragStart, onDragEnd } = useDragDrop()

const isDraggable = computed(() => 
  props.vehicle.status !== 'departed'
)

const departureCountdown = computed(() => {
  if (props.vehicle.status === 'departed') return null
  return Math.max(0, props.vehicle.scheduledDeparture - gameStore.gameTime)
})

const isDelayed = computed(() => 
  props.vehicle.actualDeparture !== undefined && 
  props.vehicle.actualDeparture > props.vehicle.scheduledDeparture
)

const delayAmount = computed(() => {
  if (!isDelayed.value) return 0
  return Math.round(props.vehicle.actualDeparture! - props.vehicle.scheduledDeparture)
})

const statusInfo = computed(() => {
  switch (props.vehicle.status) {
    case 'pending':
      return { label: '待到达', color: 'text-slate-500', bg: 'bg-slate-100', icon: Clock }
    case 'arrived':
      return { label: '已到达', color: 'text-blue-600', bg: 'bg-blue-100', icon: Bus }
    case 'boarding':
      return { label: '登车中', color: 'text-amber-600', bg: 'bg-amber-100', icon: Users }
    case 'departed':
      return { label: '已发车', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle }
    default:
      return { label: '未知', color: 'text-slate-500', bg: 'bg-slate-100', icon: Clock }
  }
})

const cardClasses = computed(() => {
  const base = 'p-4 rounded-xl border-2 transition-all duration-300 select-none'
  const status = props.vehicle.status

  if (status === 'departed') {
    return `${base} bg-slate-50 border-slate-200 opacity-70`
  }
  if (status === 'boarding') {
    return `${base} bg-amber-50 border-amber-300`
  }
  if (status === 'arrived') {
    return `${base} bg-white border-blue-200 cursor-move hover:shadow-md hover:-translate-y-0.5`
  }
  return `${base} bg-white border-slate-200 cursor-move hover:shadow-md hover:-translate-y-0.5`
})

const usagePercent = computed(() => 
  Math.round((props.vehicle.passengers.length / props.vehicle.capacity) * 100)
)

const handleDragStart = (e: DragEvent) => {
  if (!isDraggable.value) {
    e.preventDefault()
    return
  }
  onDragStart(e, {
    type: 'vehicle',
    id: props.vehicle.id,
  })
  emit('dragStart', props.vehicle.id)
}

const handleDragEnd = () => {
  onDragEnd()
}
</script>

<template>
  <div
    :class="cardClasses"
    :draggable="isDraggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2">
        <GripVertical v-if="isDraggable" class="w-4 h-4 text-slate-400 cursor-grab" />
        <Bus class="w-5 h-5 text-slate-600" />
        <div>
          <h4 class="font-bold text-slate-800">{{ vehicle.name }}</h4>
          <span 
            :class="[
              'text-xs px-2 py-0.5 rounded-full border',
              getDestinationColor(vehicle.destination)
            ]"
          >
            {{ vehicle.destination }}
          </span>
        </div>
      </div>
      
      <div :class="['px-2 py-1 rounded-full text-xs font-medium', statusInfo.bg, statusInfo.color]">
        <component :is="statusInfo.icon" class="w-3 h-3 inline mr-1" />
        {{ statusInfo.label }}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="text-center">
        <p class="text-xs text-slate-500">载客量</p>
        <p class="font-bold text-slate-800">
          {{ vehicle.passengers.length }}/{{ vehicle.capacity }}
        </p>
      </div>
      <div class="text-center">
        <p class="text-xs text-slate-500">发车顺序</p>
        <p class="font-bold text-slate-800">#{{ vehicle.order + 1 }}</p>
      </div>
    </div>

    <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
      <div 
        class="h-full bg-blue-500 transition-all duration-500"
        :style="{ width: `${usagePercent}%` }"
      />
    </div>

    <div class="flex items-center justify-between text-sm">
      <div v-if="departureCountdown !== null" class="flex items-center gap-1">
        <Clock class="w-4 h-4 text-slate-500" />
        <span :class="departureCountdown < 30 ? 'text-rose-600 font-bold' : 'text-slate-600'">
          {{ formatTime(departureCountdown) }} 后发车
        </span>
      </div>
      <div v-else class="flex items-center gap-1">
        <CheckCircle v-if="!isDelayed" class="w-4 h-4 text-emerald-500" />
        <XCircle v-else class="w-4 h-4 text-rose-500" />
        <span :class="isDelayed ? 'text-rose-600' : 'text-emerald-600'">
          {{ isDelayed ? `晚点 ${delayAmount}s` : '准点发车' }}
        </span>
      </div>

      <div v-if="vehicle.status !== 'departed'" class="text-xs text-slate-500">
        计划: {{ formatTime(vehicle.scheduledDeparture) }}
      </div>
    </div>
  </div>
</template>
