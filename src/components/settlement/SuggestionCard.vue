<script setup lang="ts">
import { computed } from 'vue'
import { Lightbulb, TrendingUp, Clock, Users, AlertTriangle, Crown } from 'lucide-vue-next'
import { useScoreCalculator } from '@/composables/useScoreCalculator'
import { getScoreColor } from '@/utils/formatters'

const { suggestions, scoreBreakdown } = useScoreCalculator()

const improvementAreas = computed(() => [
  { key: 'onTimeDeparture', label: '准时发车', icon: Clock, score: scoreBreakdown.value.onTimeDeparture },
  { key: 'passengerWait', label: '乘客等待', icon: Users, score: scoreBreakdown.value.passengerWait },
  { key: 'capacityConflict', label: '满员冲突', icon: AlertTriangle, score: scoreBreakdown.value.capacityConflict },
  { key: 'prioritySatisfaction', label: '优先级满足', icon: Crown, score: scoreBreakdown.value.prioritySatisfaction },
])
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div class="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
      <div class="flex items-center gap-3">
        <Lightbulb class="w-5 h-5" />
        <h3 class="text-lg font-bold">改进建议</h3>
      </div>
    </div>

    <div class="p-6 space-y-6">
      <div>
        <h4 class="font-bold text-slate-800 mb-3">需要改进的方面</h4>
        <div class="space-y-3">
          <div 
            v-for="area in improvementAreas.filter(a => a.score.score < 80)" 
            :key="area.key"
            class="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200"
          >
            <div class="flex items-center gap-3">
              <component :is="area.icon" class="w-5 h-5 text-amber-600" />
              <span class="font-medium text-amber-800">{{ area.label }}</span>
            </div>
            <span :class="['font-bold', getScoreColor(area.score.score)]">
              {{ area.score.score }} 分
            </span>
          </div>
        </div>
      </div>

      <div>
        <h4 class="font-bold text-slate-800 mb-3">具体建议</h4>
        <div class="space-y-3">
          <div 
            v-for="(suggestion, index) in suggestions" 
            :key="index"
            class="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
          >
            <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {{ index + 1 }}
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <TrendingUp class="w-4 h-4 text-blue-600" />
                <span class="font-medium text-blue-800">优化建议</span>
              </div>
              <p class="text-slate-700">{{ suggestion }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <div class="flex items-center gap-2 mb-2">
          <Lightbulb class="w-5 h-5 text-emerald-600" />
          <span class="font-bold text-emerald-800">小技巧</span>
        </div>
        <ul class="text-sm text-slate-700 space-y-1">
          <li>• 拖拽乘客到对应目的地的候车区进行安排</li>
          <li>• 优先安排 VIP 和残障人士乘客</li>
          <li>• 注意候车区容量，及时分散乘客</li>
          <li>• 调整车辆顺序以匹配客流高峰</li>
          <li>• 善用暂停功能规划调度策略</li>
        </ul>
      </div>
    </div>
  </div>
</template>
