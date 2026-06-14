<script setup lang="ts">
import { computed } from 'vue'
import { Users, Clock } from 'lucide-vue-next'
import PassengerCard from './PassengerCard.vue'
import { useGameStore } from '@/stores/gameStore'
import { formatTime } from '@/utils/helpers'
import { useDragDrop } from '@/composables/useDragDrop'

const gameStore = useGameStore()
const { onDragOver, onDragLeave, onDrop } = useDragDrop()

const arrivedPassengers = computed(() => gameStore.arrivedPassengers)
const pendingPassengers = computed(() => gameStore.pendingPassengers.slice(0, 5))

const nextArrivalTime = computed(() => {
  const next = gameStore.pendingPassengers[0]
  if (!next) return null
  return Math.max(0, next.arrivalTime - gameStore.gameTime)
})

const handleQueueDrop = (e: DragEvent) => {
  const data = onDrop(e)
  if (data && data.type === 'passenger' && data.sourceAreaId) {
    gameStore.removePassengerFromArea(data.id)
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Users class="w-5 h-5" />
          <h3 class="font-bold">乘客队列</h3>
        </div>
        <div class="text-sm text-slate-300">
          等待: {{ arrivedPassengers.length }} 人
        </div>
      </div>
      
      <div v-if="nextArrivalTime !== null" class="mt-2 flex items-center gap-2 text-sm text-amber-300">
        <Clock class="w-4 h-4" />
        <span>下一批乘客 {{ formatTime(nextArrivalTime) }} 后到达</span>
      </div>
    </div>

    <div 
      class="flex-1 overflow-y-auto p-3 space-y-2"
      @dragover="(e) => onDragOver(e, 'queue')"
      @dragleave="onDragLeave"
      @drop="handleQueueDrop"
    >
      <div v-if="arrivedPassengers.length === 0 && pendingPassengers.length === 0" 
           class="flex flex-col items-center justify-center h-full text-slate-400">
        <Users class="w-12 h-12 mb-2 opacity-50" />
        <p>暂无等待的乘客</p>
      </div>

      <div v-if="arrivedPassengers.length > 0" class="space-y-2">
        <p class="text-xs text-slate-500 font-medium">可安排的乘客</p>
        <TransitionGroup name="list" tag="div" class="space-y-2">
          <PassengerCard
            v-for="passenger in arrivedPassengers"
            :key="passenger.id"
            :passenger="passenger"
          />
        </TransitionGroup>
      </div>

      <div v-if="pendingPassengers.length > 0" class="mt-4 space-y-2">
        <p class="text-xs text-slate-500 font-medium">即将到达</p>
        <div class="space-y-2 opacity-70">
          <PassengerCard
            v-for="passenger in pendingPassengers"
            :key="passenger.id"
            :passenger="passenger"
            :draggable="false"
          />
        </div>
      </div>
    </div>

    <div class="p-3 border-t border-slate-200 bg-slate-50">
      <p class="text-xs text-slate-500 text-center">
        拖拽乘客卡片到对应候车区
      </p>
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
  transform: translateX(-30px);
}

.list-leave-active {
  position: absolute;
}
</style>
