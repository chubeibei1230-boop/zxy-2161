<script setup lang="ts">
import { computed } from 'vue'
import { Bus, ArrowUpDown } from 'lucide-vue-next'
import VehicleCard from './VehicleCard.vue'
import { useGameStore } from '@/stores/gameStore'
import { useDragDrop } from '@/composables/useDragDrop'

const gameStore = useGameStore()
const { onDragOver, onDragLeave, onDrop, dragOverTarget } = useDragDrop()

const sortedVehicles = computed(() => gameStore.sortedVehicles)
const activeVehicles = computed(() => 
  sortedVehicles.value.filter(v => v.status !== 'departed')
)
const departedVehicles = computed(() => 
  sortedVehicles.value.filter(v => v.status === 'departed')
)

const handleDrop = (e: DragEvent, targetIndex: number) => {
  const data = onDrop(e)
  if (data && data.type === 'vehicle') {
    gameStore.reorderVehicle(data.id, targetIndex)
  }
}

const handleVehicleDragOver = (e: DragEvent, index: number) => {
  onDragOver(e, `vehicle-${index}`)
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Bus class="w-5 h-5" />
          <h3 class="font-bold">车辆调度</h3>
        </div>
        <div class="flex items-center gap-1 text-sm text-blue-200">
          <ArrowUpDown class="w-4 h-4" />
          <span>拖拽调整顺序</span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <div v-if="activeVehicles.length > 0">
        <p class="text-xs text-slate-500 font-medium mb-2">待发车辆</p>
        <div 
          class="space-y-3"
          @dragover="(e) => onDragOver(e, 'vehicle-list')"
          @dragleave="onDragLeave"
        >
          <div
            v-for="(vehicle, index) in activeVehicles"
            :key="vehicle.id"
            @dragover="(e) => handleVehicleDragOver(e, index)"
            @dragleave="onDragLeave"
            @drop="(e) => handleDrop(e, index)"
            :class="[
              'relative transition-all duration-200',
              dragOverTarget === `vehicle-${index}` ? 'ring-2 ring-blue-500 rounded-xl' : ''
            ]"
          >
            <VehicleCard :vehicle="vehicle" />
          </div>
        </div>
      </div>

      <div v-if="departedVehicles.length > 0" class="mt-4">
        <p class="text-xs text-slate-500 font-medium mb-2">已发车辆</p>
        <div class="space-y-3 opacity-70">
          <VehicleCard
            v-for="vehicle in departedVehicles"
            :key="vehicle.id"
            :vehicle="vehicle"
          />
        </div>
      </div>

      <div v-if="sortedVehicles.length === 0" 
           class="flex flex-col items-center justify-center h-full text-slate-400">
        <Bus class="w-12 h-12 mb-2 opacity-50" />
        <p>暂无车辆信息</p>
      </div>
    </div>
  </div>
</template>
