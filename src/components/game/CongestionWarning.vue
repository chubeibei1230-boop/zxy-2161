<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, TrendingUp } from 'lucide-vue-next'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const riskLevel = computed(() => {
  const risk = gameStore.congestionRisk
  if (risk >= 90) return { level: '极高', color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-300' }
  if (risk >= 70) return { level: '高', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300' }
  if (risk >= 50) return { level: '中', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300' }
  return { level: '低', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300' }
})

const warningMessage = computed(() => {
  const risk = gameStore.congestionRisk
  if (risk >= 90) return '候车区即将满员，请尽快安排乘客上车或转移'
  if (risk >= 70) return '拥堵风险较高，请注意分散乘客'
  if (risk >= 50) return '乘客较多，请注意候车区容量'
  return '当前客流平稳，继续保持'
})
</script>

<template>
  <div 
    :class="[
      'px-4 py-3 rounded-xl border-2 transition-all duration-300',
      riskLevel.bg,
      riskLevel.border
    ]"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <AlertTriangle v-if="gameStore.congestionRisk >= 70" :class="['w-5 h-5', riskLevel.color]" />
        <TrendingUp v-else :class="['w-5 h-5', riskLevel.color]" />
        <div>
          <p :class="['text-sm font-bold', riskLevel.color]">
            拥堵风险: {{ riskLevel.level }}
          </p>
          <p class="text-xs text-slate-600">
            {{ warningMessage }}
          </p>
        </div>
      </div>
      
      <div class="text-right">
        <div class="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            :class="['h-full transition-all duration-500', 
              gameStore.congestionRisk >= 90 ? 'bg-rose-500' :
              gameStore.congestionRisk >= 70 ? 'bg-orange-500' :
              gameStore.congestionRisk >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
            ]"
            :style="{ width: `${gameStore.congestionRisk}%` }"
          />
        </div>
        <p class="text-xs text-slate-500 mt-1">
          {{ Math.round(gameStore.congestionRisk) }}%
        </p>
      </div>
    </div>
  </div>
</template>
