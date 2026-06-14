<script setup lang="ts">
import { computed } from 'vue'
import { Play, Pause, RotateCcw, Home, FastForward, Clock, Star } from 'lucide-vue-next'
import { useGameStore } from '@/stores/gameStore'
import { useScoreStore } from '@/stores/scoreStore'
import { formatTime } from '@/utils/helpers'
import { useGameEngine } from '@/composables/useGameEngine'

const gameStore = useGameStore()
const scoreStore = useScoreStore()
const gameEngine = useGameEngine()

const formattedTime = computed(() => formatTime(gameStore.gameTime))

const speedOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
]

const handleSpeedChange = (speed: number) => {
  gameEngine.setSpeed(speed)
}

const handlePauseToggle = () => {
  gameEngine.togglePause()
}

const handleQuit = () => {
  if (confirm('确定要退出当前游戏吗？进度将不会保存。')) {
    gameEngine.quitGame()
  }
}

const handleEndGame = () => {
  if (confirm('确定要提前结束游戏吗？')) {
    gameEngine.endGame()
  }
}
</script>

<template>
  <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-400" />
          <div>
            <p class="text-xs text-slate-400">游戏时间</p>
            <p class="text-2xl font-mono font-bold">{{ formattedTime }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Star class="w-5 h-5 text-amber-400" />
          <div>
            <p class="text-xs text-slate-400">当前得分</p>
            <p class="text-2xl font-bold">{{ scoreStore.total }}</p>
          </div>
        </div>

        <div class="h-10 w-px bg-slate-700" />

        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-400">速度:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in speedOptions"
              :key="opt.value"
              @click="handleSpeedChange(opt.value)"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                gameStore.speed === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="handlePauseToggle"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
        >
          <Play v-if="gameStore.isPaused" class="w-4 h-4" />
          <Pause v-else class="w-4 h-4" />
          {{ gameStore.isPaused ? '继续' : '暂停' }}
        </button>

        <button
          v-if="gameStore.isPaused"
          @click="handleEndGame"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 transition-colors font-medium"
        >
          <FastForward class="w-4 h-4" />
          结束游戏
        </button>

        <button
          @click="handleQuit"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors font-medium"
        >
          <Home class="w-4 h-4" />
          返回菜单
        </button>
      </div>
    </div>

    <div v-if="gameStore.isPaused" class="mt-4 p-4 bg-slate-700/50 rounded-xl text-center">
      <p class="text-lg font-bold text-amber-400">游戏已暂停</p>
      <p class="text-sm text-slate-300">所有事件和时间推进已冻结，点击"继续"恢复游戏</p>
    </div>
  </div>
</template>
