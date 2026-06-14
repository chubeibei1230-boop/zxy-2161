<script setup lang="ts">
import { computed } from 'vue'
import { User, Users, Bus, Clock, AlertTriangle, TrendingDown, Move } from 'lucide-vue-next'
import type { TimelineItem } from '@/types'
import { formatTime } from '@/utils/helpers'

const props = defineProps<{
  item: TimelineItem
  index: number
}>()

const icon = computed(() => {
  switch (props.item.type) {
    case 'passenger_arrive': return User
    case 'passenger_move': return Move
    case 'vehicle_arrive': return Bus
    case 'vehicle_depart': return Bus
    case 'event_trigger': return AlertTriangle
    case 'score_change': return TrendingDown
    default: return Clock
  }
})

const color = computed(() => {
  switch (props.item.type) {
    case 'passenger_arrive': return 'bg-blue-500'
    case 'passenger_move': return 'bg-emerald-500'
    case 'vehicle_arrive': return 'bg-purple-500'
    case 'vehicle_depart': return 'bg-indigo-500'
    case 'event_trigger': return 'bg-amber-500'
    case 'score_change': return 'bg-rose-500'
    default: return 'bg-slate-500'
  }
})

const bgColor = computed(() => {
  if (props.item.pointChange && props.item.pointChange < 0) return 'bg-rose-50 border-rose-200'
  switch (props.item.type) {
    case 'event_trigger': return 'bg-amber-50 border-amber-200'
    case 'vehicle_depart': return 'bg-indigo-50 border-indigo-200'
    default: return 'bg-white border-slate-200'
  }
})

const typeLabel = computed(() => {
  switch (props.item.type) {
    case 'passenger_arrive': return '乘客到达'
    case 'passenger_move': return '乘客移动'
    case 'vehicle_arrive': return '车辆到达'
    case 'vehicle_depart': return '车辆发车'
    case 'event_trigger': return '事件触发'
    case 'score_change': return '扣分'
    default: return '其他'
  }
})
</script>

<template>
  <div class="relative pl-8 pb-6 last:pb-0">
    <div 
      class="absolute left-0 top-0 w-4 h-4 rounded-full border-4 border-white shadow-md z-10"
      :class="color"
    />
    <div 
      v-if="index < 100"
      class="absolute left-[7px] top-4 w-0.5 h-full bg-slate-200"
    />
    
    <div 
      :class="[
        'ml-2 p-4 rounded-xl border transition-all duration-300 hover:shadow-md',
        bgColor
      ]"
    >
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2">
          <component :is="icon" :class="['w-4 h-4', color.replace('bg-', 'text-')]" />
          <span class="text-xs font-medium text-slate-500">{{ typeLabel }}</span>
        </div>
        <span class="text-xs font-mono text-slate-400">
          {{ formatTime(item.gameTime) }}
        </span>
      </div>
      
      <p class="text-slate-800 font-medium">{{ item.description }}</p>
      
      <div class="flex items-center gap-4 mt-2">
        <p v-if="item.action" class="text-sm text-slate-500">
          操作: {{ item.action }}
        </p>
        <p 
          v-if="item.pointChange && item.pointChange !== 0"
          :class="[
            'text-sm font-bold',
            item.pointChange < 0 ? 'text-rose-600' : 'text-emerald-600'
          ]"
        >
          {{ item.pointChange > 0 ? '+' : '' }}{{ item.pointChange }} 分
        </p>
      </div>
    </div>
  </div>
</template>
