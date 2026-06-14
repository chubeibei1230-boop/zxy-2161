<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, RotateCcw, Trophy } from 'lucide-vue-next'
import ScoreCard from '@/components/settlement/ScoreCard.vue'
import TimelineList from '@/components/settlement/TimelineList.vue'
import SuggestionCard from '@/components/settlement/SuggestionCard.vue'
import { useGameStore } from '@/stores/gameStore'
import { useScoreStore } from '@/stores/scoreStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { getGameRecord, getTimelineEvents } from '@/utils/idb'
import type { GameRecord } from '@/types'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const scoreStore = useScoreStore()
const timelineStore = useTimelineStore()

const record = ref<GameRecord | null>(null)
const isLoading = ref(true)

const loadRecord = async () => {
  const recordId = route.params.recordId as string
  if (!recordId) return

  try {
    record.value = await getGameRecord(recordId)

    if (record.value) {
      scoreStore.onTimeDeparture = record.value.scoreBreakdown.onTimeDeparture
      scoreStore.passengerWait = record.value.scoreBreakdown.passengerWait
      scoreStore.capacityConflict = record.value.scoreBreakdown.capacityConflict
      scoreStore.prioritySatisfaction = record.value.scoreBreakdown.prioritySatisfaction

      gameStore.levelId = record.value.levelId
      timelineStore.clearEvents()
      const timelineEvents = await getTimelineEvents(recordId)
      timelineEvents.forEach(e => {
        timelineStore.addEvent(e.type, e.description, e.gameTime, e.action, e.pointChange)
      })
    }
  } catch (error) {
    console.error('Failed to load record:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRecord()
})

const handleBackToMenu = () => {
  gameStore.resetGame()
  router.push('/')
}

const handleReplay = () => {
  if (gameStore.levelId) {
    router.push(`/game/${gameStore.levelId}`)
  } else if (record.value) {
    router.push(`/game/${record.value.levelId}`)
  } else {
    router.push('/')
  }
}

const handleViewRecords = () => {
  router.push('/records')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full mb-4">
          <Trophy class="w-5 h-5" />
          <span class="font-bold">游戏结束</span>
        </div>
        <h1 class="text-4xl font-bold text-slate-800 mb-2">调度任务完成</h1>
        <p class="text-slate-600">查看本局表现，了解改进方向</p>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>

      <div v-else class="space-y-6">
        <ScoreCard />
        
        <TimelineList />
        
        <SuggestionCard />

        <div class="flex items-center justify-center gap-4 pt-6">
          <button
            @click="handleBackToMenu"
            class="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            <Home class="w-5 h-5" />
            返回主菜单
          </button>
          <button
            @click="handleReplay"
            class="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <RotateCcw class="w-5 h-5" />
            再玩一次
          </button>
          <button
            @click="handleViewRecords"
            class="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            <Trophy class="w-5 h-5" />
            历史记录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
