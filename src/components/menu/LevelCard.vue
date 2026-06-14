<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Star, Lock, Play, Users, Bus, Clock, Zap, Trophy } from 'lucide-vue-next'
import type { LevelConfig, GameRecord } from '@/types'
import { getBestRecord } from '@/utils/idb'

const props = defineProps<{
  level: LevelConfig
}>()

const emit = defineEmits<{
  (e: 'select', levelId: string): void
}>()

const bestRecord = ref<GameRecord | null>(null)
const isLoading = ref(true)

const difficultyStars = computed(() => props.level.difficulty)

const difficultyLabel = computed(() => {
  switch (props.level.difficulty) {
    case 1: return '简单'
    case 2: return '中等'
    case 3: return '困难'
    case 4: return '专家'
    default: return '未知'
  }
})

const difficultyColor = computed(() => {
  switch (props.level.difficulty) {
    case 1: return 'text-emerald-600 bg-emerald-100'
    case 2: return 'text-blue-600 bg-blue-100'
    case 3: return 'text-amber-600 bg-amber-100'
    case 4: return 'text-rose-600 bg-rose-100'
    default: return 'text-slate-600 bg-slate-100'
  }
})

const cardGradient = computed(() => {
  switch (props.level.difficulty) {
    case 1: return 'from-emerald-500 to-teal-600'
    case 2: return 'from-blue-500 to-indigo-600'
    case 3: return 'from-amber-500 to-orange-600'
    case 4: return 'from-rose-500 to-red-600'
    default: return 'from-slate-500 to-slate-600'
  }
})

const isUnlocked = computed(() => {
  if (props.level.difficulty === 1) return true
  return true
})

const loadBestRecord = async () => {
  try {
    const record = await getBestRecord(props.level.id)
    bestRecord.value = record
  } catch (error) {
    console.error('Failed to load best record:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadBestRecord()
})

const handleClick = () => {
  if (isUnlocked.value) {
    emit('select', props.level.id)
  }
}
</script>

<template>
  <div
    :class="[
      'relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer group',
      isUnlocked ? 'hover:shadow-2xl hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'
    ]"
    @click="handleClick"
  >
    <div :class="['h-24 bg-gradient-to-r', cardGradient]">
      <div class="absolute top-4 left-4">
        <span :class="['px-3 py-1 rounded-full text-xs font-bold', difficultyColor]">
          {{ difficultyLabel }}
        </span>
      </div>
      <div class="absolute top-4 right-4 flex gap-1">
        <Star 
          v-for="i in 4" 
          :key="i" 
          :class="[
            'w-5 h-5 transition-all duration-300',
            i <= difficultyStars ? 'text-amber-400 fill-amber-400' : 'text-white/30'
          ]"
        />
      </div>
      <Lock v-if="!isUnlocked" class="absolute inset-0 m-auto w-12 h-12 text-white/80" />
    </div>

    <div class="p-5 bg-white">
      <h3 class="text-xl font-bold text-slate-800 mb-2">{{ level.name }}</h3>
      <p class="text-sm text-slate-500 mb-4 line-clamp-2">{{ level.description }}</p>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="text-center p-2 bg-slate-50 rounded-lg">
          <Users class="w-4 h-4 mx-auto mb-1 text-blue-500" />
          <p class="text-xs text-slate-500">乘客</p>
          <p class="font-bold text-slate-700">{{ level.passengerCount }}</p>
        </div>
        <div class="text-center p-2 bg-slate-50 rounded-lg">
          <Bus class="w-4 h-4 mx-auto mb-1 text-emerald-500" />
          <p class="text-xs text-slate-500">车辆</p>
          <p class="font-bold text-slate-700">{{ level.vehicleCount }}</p>
        </div>
        <div class="text-center p-2 bg-slate-50 rounded-lg">
          <Zap class="w-4 h-4 mx-auto mb-1 text-amber-500" />
          <p class="text-xs text-slate-500">事件</p>
          <p class="font-bold text-slate-700">随机</p>
        </div>
      </div>

      <div v-if="bestRecord" class="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Trophy class="w-4 h-4 text-amber-500" />
            <span class="text-sm font-medium text-amber-800">最佳成绩</span>
          </div>
          <div class="flex items-center gap-1">
            <Star 
              v-for="i in 3" 
              :key="i" 
              :class="[
                'w-4 h-4',
                i <= bestRecord.stars ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
              ]"
            />
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-2xl font-bold text-amber-600">{{ bestRecord.score }}</span>
          <span class="text-xs text-slate-500">
            <Clock class="w-3 h-3 inline" />
            {{ Math.round(bestRecord.playTime / 60) }} 分钟
          </span>
        </div>
      </div>

      <div v-else-if="!isLoading" class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <p class="text-sm text-slate-500">暂无记录</p>
        <p class="text-xs text-slate-400">完成关卡后显示成绩</p>
      </div>

      <button
        v-if="isUnlocked"
        class="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all duration-300"
        :class="[
          'bg-gradient-to-r hover:shadow-lg',
          cardGradient
        ]"
      >
        <Play class="w-5 h-5" />
        开始游戏
      </button>
      <div v-else class="w-full mt-4 py-3 rounded-xl bg-slate-200 text-slate-500 text-center font-medium">
        <Lock class="w-4 h-4 inline mr-2" />
        完成前一关解锁
      </div>
    </div>
  </div>
</template>
