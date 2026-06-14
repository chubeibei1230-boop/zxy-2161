<script setup lang="ts">
import { computed } from 'vue'
import { Star, Clock, Users, AlertTriangle, Crown } from 'lucide-vue-next'
import { useScoreCalculator } from '@/composables/useScoreCalculator'
import { getScoreColor } from '@/utils/formatters'

const { score, scoreBreakdown, performanceLevel, getDeductionSummary } = useScoreCalculator()

const stars = computed(() => score.value.stars)
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold mb-2">游戏结算</h2>
          <p class="text-lg text-white/90">
            {{ performanceLevel.description }}
          </p>
        </div>
        <div class="text-right">
          <div class="flex gap-1 mb-2">
            <Star 
              v-for="i in 3" 
              :key="i" 
              :class="[
                'w-8 h-8 transition-all duration-500',
                i <= stars ? 'text-amber-400 fill-amber-400 scale-110' : 'text-white/30'
              ]"
              :style="{ transitionDelay: `${i * 200}ms` }"
            />
          </div>
          <p :class="['text-5xl font-bold', getScoreColor(score.total)]">
            {{ score.total }}
          </p>
          <p class="text-sm text-white/70">总分</p>
        </div>
      </div>
    </div>

    <div class="p-6">
      <h3 class="text-lg font-bold text-slate-800 mb-4">评分明细</h3>
      <div class="grid grid-cols-2 gap-4">
        <div 
          v-for="(item, key) in scoreBreakdown" 
          :key="key"
          class="p-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <Clock v-if="key === 'onTimeDeparture'" class="w-5 h-5 text-blue-500" />
              <Users v-else-if="key === 'passengerWait'" class="w-5 h-5 text-emerald-500" />
              <AlertTriangle v-else-if="key === 'capacityConflict'" class="w-5 h-5 text-amber-500" />
              <Crown v-else class="w-5 h-5 text-purple-500" />
              <span class="font-medium text-slate-700">{{ item.label }}</span>
            </div>
            <span class="text-sm text-slate-500">权重 {{ item.weight }}%</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                :class="[
                  'h-full transition-all duration-1000 rounded-full',
                  item.score >= 90 ? 'bg-emerald-500' :
                  item.score >= 70 ? 'bg-blue-500' :
                  item.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                ]"
                :style="{ width: `${item.score}%` }"
              />
            </div>
            <span :class="['font-bold text-lg', getScoreColor(item.score)]">
              {{ item.score }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-2">{{ item.description }}</p>
        </div>
      </div>

      <div v-if="getDeductionSummary().length > 0" class="mt-6">
        <h3 class="text-lg font-bold text-slate-800 mb-3">扣分汇总</h3>
        <div class="space-y-2">
          <div 
            v-for="item in getDeductionSummary()" 
            :key="item.type"
            class="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200"
          >
            <div>
              <p class="font-medium text-rose-800">{{ item.type }}</p>
              <p class="text-xs text-rose-600">{{ item.count }} 次</p>
            </div>
            <span class="font-bold text-rose-600">-{{ item.totalPoints }} 分</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
