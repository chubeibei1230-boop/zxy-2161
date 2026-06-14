<script setup lang="ts">
import { useGameEngine } from '@/composables/useGameEngine'
import PassengerQueue from '@/components/game/PassengerQueue.vue'
import WaitingArea from '@/components/game/WaitingArea.vue'
import VehicleList from '@/components/game/VehicleList.vue'
import EventBanner from '@/components/game/EventBanner.vue'
import ControlPanel from '@/components/game/ControlPanel.vue'
import CongestionWarning from '@/components/game/CongestionWarning.vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
useGameEngine()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col">
    <EventBanner />
    
    <div class="flex-1 p-4 max-w-7xl mx-auto w-full flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">
            {{ gameStore.levelConfig?.name || '游戏进行中' }}
          </h1>
          <p class="text-sm text-slate-500">
            {{ gameStore.levelConfig?.description }}
          </p>
        </div>
        <CongestionWarning />
      </div>

      <div class="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div class="col-span-3 min-h-0">
          <PassengerQueue />
        </div>

        <div class="col-span-6 min-h-0">
          <div class="h-full flex flex-col gap-4">
            <div class="flex-1 grid gap-4 min-h-0" 
                 :class="gameStore.waitingAreas.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'">
              <WaitingArea
                v-for="area in gameStore.waitingAreas"
                :key="area.id"
                :area="area"
              />
            </div>
          </div>
        </div>

        <div class="col-span-3 min-h-0">
          <VehicleList />
        </div>
      </div>

      <ControlPanel />
    </div>
  </div>
</template>
