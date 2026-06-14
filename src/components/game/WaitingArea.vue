<script setup lang="ts">
import { computed } from 'vue'
import { Users, AlertTriangle } from 'lucide-vue-next'
import type { WaitingArea as WaitingAreaType } from '@/types'
import PassengerCard from './PassengerCard.vue'
import { useGameStore } from '@/stores/gameStore'
import { useDragDrop } from '@/composables/useDragDrop'
import { getDestinationColor } from '@/utils/formatters'
import { PRIORITY_ORDER } from '@/types'

const props = defineProps<{
  area: WaitingAreaType
}>()

const gameStore = useGameStore()
const { onDragOver, onDragLeave, onDrop, dragOverTarget, currentDragData } = useDragDrop()

const passengers = computed(() => {
  return props.area.passengers
    .map(id => gameStore.getPassengerById(id))
    .filter(p => p !== undefined)
    .sort((a, b) => PRIORITY_ORDER[b!.priority] - PRIORITY_ORDER[a!.priority])
})

const usagePercent = computed(() => 
  Math.round((props.area.passengers.length / props.area.capacity) * 100)
)

const isOverCapacity = computed(() => 
  props.area.passengers.length >= props.area.capacity
)

const isCapacityReduced = computed(() => 
  props.area.capacity < props.area.originalCapacity
)

const canDrop = computed(() => {
  if (!currentDragData.value || currentDragData.value.type !== 'passenger') return false
  if (isOverCapacity.value) return false
  const passenger = gameStore.getPassengerById(currentDragData.value.id)
  return passenger?.destination === props.area.destination
})

const areaClasses = computed(() => {
  const base = 'flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all duration-300'
  
  if (dragOverTarget.value === props.area.id) {
    if (canDrop.value) {
      return `${base} border-emerald-500 bg-emerald-50`
    } else {
      return `${base} border-rose-500 bg-rose-50`
    }
  }
  
  if (isOverCapacity.value) {
    return `${base} border-rose-300`
  }
  
  if (isCapacityReduced.value) {
    return `${base} border-amber-300`
  }
  
  return `${base} border-transparent`
})

const usageBarClasses = computed(() => {
  if (usagePercent.value >= 90) return 'bg-rose-500'
  if (usagePercent.value >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const handleDrop = (e: DragEvent) => {
  const data = onDrop(e)
  if (data && data.type === 'passenger') {
    gameStore.movePassengerToArea(data.id, props.area.id)
  }
}

const handlePassengerClick = (passengerId: string) => {
  gameStore.removePassengerFromArea(passengerId)
}
</script>

<template>
  <div :class="areaClasses">
    <div 
      :class="[
        'px-4 py-3 text-white',
        isOverCapacity ? 'bg-gradient-to-r from-rose-600 to-rose-700' :
        isCapacityReduced ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
        'bg-gradient-to-r from-blue-600 to-blue-700'
      ]"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <Users class="w-5 h-5" />
          <h3 class="font-bold">{{ area.name }}</h3>
        </div>
        <div class="flex items-center gap-2">
          <AlertTriangle v-if="isCapacityReduced" class="w-4 h-4 text-amber-200" />
          <span class="text-sm">
            {{ area.passengers.length }}/{{ area.capacity }}
          </span>
        </div>
      </div>
      
      <div class="h-2 bg-white/30 rounded-full overflow-hidden">
        <div 
          :class="['h-full transition-all duration-500', usageBarClasses]"
          :style="{ width: `${usagePercent}%` }"
        />
      </div>

      <div class="mt-2 flex items-center gap-2">
        <span 
          :class="[
            'text-xs px-2 py-0.5 rounded-full border',
            getDestinationColor(area.destination)
          ]"
        >
          目的地: {{ area.destination }}
        </span>
        <span v-if="isCapacityReduced" class="text-xs text-amber-200">
          容量减少 {{ area.originalCapacity - area.capacity }}
        </span>
      </div>
    </div>

    <div 
      class="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      @dragover="(e) => onDragOver(e, area.id)"
      @dragleave="onDragLeave"
      @drop="handleDrop"
    >
      <div v-if="passengers.length === 0" 
           class="flex flex-col items-center justify-center h-full text-slate-400">
        <Users class="w-10 h-10 mb-2 opacity-50" />
        <p class="text-sm">拖拽乘客到此处</p>
      </div>

      <TransitionGroup name="list" tag="div" class="space-y-2">
        <PassengerCard
          v-for="passenger in passengers"
          :key="passenger!.id"
          :passenger="passenger!"
          @click="handlePassengerClick(passenger!.id)"
        />
      </TransitionGroup>

      <div v-if="isOverCapacity" class="mt-2 p-2 bg-rose-50 rounded-lg text-rose-600 text-xs text-center">
        候车区已满，请先安排乘客上车
      </div>

      <div v-if="dragOverTarget === area.id && !canDrop && currentDragData" 
           class="mt-2 p-2 bg-rose-50 rounded-lg text-rose-600 text-xs text-center">
        该乘客目的地不匹配
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.list-leave-active {
  position: absolute;
}
</style>
