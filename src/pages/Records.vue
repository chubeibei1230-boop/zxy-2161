<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Trophy, Star, Clock, Trash2, Calendar, MapPin, Target, CheckCircle, XCircle } from 'lucide-vue-next'
import { getGameRecords, clearAllData } from '@/utils/idb'
import { LEVELS, getLevelById } from '@/utils/levels'
import { getTaskById, TASK_ICONS, TASK_COLORS } from '@/utils/tasks'
import type { GameRecord } from '@/types'
import { formatTime } from '@/utils/helpers'
import { getScoreColor } from '@/utils/formatters'

const router = useRouter()
const records = ref<GameRecord[]>([])
const isLoading = ref(true)
const selectedLevel = ref<string | null>(null)
const selectedTask = ref<string | null>(null)

const loadRecords = async () => {
  try {
    const allRecords = await getGameRecords()
    records.value = allRecords.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to load records:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRecords()
})

const filteredRecords = computed(() => {
  let result = records.value
  if (selectedLevel.value) {
    result = result.filter(r => r.levelId === selectedLevel.value)
  }
  if (selectedTask.value === 'with_task') {
    result = result.filter(r => r.taskId)
  } else if (selectedTask.value === 'without_task') {
    result = result.filter(r => !r.taskId)
  } else if (selectedTask.value) {
    result = result.filter(r => r.taskId === selectedTask.value)
  }
  return result
})

const stats = computed(() => {
  const totalGames = records.value.length
  const avgScore = totalGames > 0 
    ? Math.round(records.value.reduce((sum, r) => sum + r.score, 0) / totalGames)
    : 0
  const bestScore = totalGames > 0
    ? Math.max(...records.value.map(r => r.score))
    : 0
  const totalStars = records.value.reduce((sum, r) => sum + r.stars, 0)
  const taskGames = records.value.filter(r => r.taskId).length
  const taskCompleted = records.value.filter(r => r.taskResult?.completed).length

  return { totalGames, avgScore, bestScore, totalStars, taskGames, taskCompleted }
})

const getLevelName = (levelId: string): string => {
  const level = getLevelById(levelId)
  return level?.name || '未知关卡'
}

const getTaskName = (taskId?: string): string => {
  if (!taskId) return ''
  const task = getTaskById(taskId as any)
  return task?.name || '未知任务'
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleBack = () => {
  router.push('/')
}

const handleViewRecord = (recordId: string) => {
  router.push(`/settlement/${recordId}`)
}

const handleClearData = async () => {
  if (confirm('确定要清除所有游戏数据吗？此操作不可恢复！')) {
    try {
      await clearAllData()
      records.value = []
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }
}

const taskFilterOptions = [
  { value: null, label: '全部' },
  { value: 'with_task', label: '有任务' },
  { value: 'without_task', label: '无任务' },
  { value: 'priority_protection', label: '优先保障' },
  { value: 'evacuation', label: '紧急疏散' },
  { value: 'minimize_empty_seats', label: '高效运力' },
  { value: 'on_time_perfection', label: '准点率挑战' },
  { value: 'area_specialist', label: '区域专家' },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <button
          @click="handleBack"
          class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          返回主菜单
        </button>
        <h1 class="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Trophy class="w-8 h-8 text-amber-500" />
          历史记录
        </h1>
        <button
          @click="handleClearData"
          class="flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl transition-colors"
        >
          <Trash2 class="w-4 h-4" />
          清除数据
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <p class="text-slate-500 text-sm mb-1">总游戏次数</p>
          <p class="text-3xl font-bold text-slate-800">{{ stats.totalGames }}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <p class="text-slate-500 text-sm mb-1">任务挑战次数</p>
          <p class="text-3xl font-bold text-indigo-600 flex items-center gap-1">
            <Target class="w-5 h-5" />
            {{ stats.taskGames }}
          </p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <p class="text-slate-500 text-sm mb-1">任务完成次数</p>
          <p class="text-3xl font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle class="w-5 h-5" />
            {{ stats.taskCompleted }}
          </p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <p class="text-slate-500 text-sm mb-1">平均得分</p>
          <p class="text-3xl font-bold text-blue-600">{{ stats.avgScore }}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <p class="text-slate-500 text-sm mb-1">最高得分</p>
          <p class="text-3xl font-bold text-emerald-600">{{ stats.bestScore }}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <p class="text-slate-500 text-sm mb-1">获得星星</p>
          <p class="text-3xl font-bold text-amber-500 flex items-center gap-1">
            <Star class="w-6 h-6 fill-amber-500" />
            {{ stats.totalStars }}
          </p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-sm text-slate-600">筛选关卡:</span>
            <button
              @click="selectedLevel = null"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                selectedLevel === null ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              ]"
            >
              全部
            </button>
            <button
              v-for="level in LEVELS"
              :key="level.id"
              @click="selectedLevel = level.id"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                selectedLevel === level.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              ]"
            >
              {{ level.name }}
            </button>
          </div>
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-sm text-slate-600">筛选任务:</span>
            <button
              v-for="opt in taskFilterOptions"
              :key="opt.value ?? 'all'"
              @click="selectedTask = opt.value"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                selectedTask === opt.value ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>

        <div v-else-if="filteredRecords.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <Trophy class="w-16 h-16 mb-4 opacity-50" />
          <p class="text-lg">暂无游戏记录</p>
          <p class="text-sm">完成一局游戏后记录将显示在这里</p>
        </div>

        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="record in filteredRecords"
            :key="record.id"
            class="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
            @click="handleViewRecord(record.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <MapPin class="w-6 h-6 text-white" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-slate-800">{{ getLevelName(record.levelId) }}</h3>
                    <span v-if="record.taskId" :class="[
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      record.taskResult?.completed 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    ]">
                      <span>{{ TASK_ICONS[record.taskId as keyof typeof TASK_ICONS] }}</span>
                      <span>{{ getTaskName(record.taskId) }}</span>
                      <CheckCircle v-if="record.taskResult?.completed" class="w-3 h-3" />
                      <XCircle v-else class="w-3 h-3" />
                    </span>
                  </div>
                  <p class="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(record.timestamp) }}
                    <span v-if="record.taskResult" class="text-indigo-500">
                      任务得分: {{ record.taskResult.percentage }}%
                    </span>
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-6">
                <div class="text-right">
                  <p class="text-sm text-slate-500">游戏时长</p>
                  <p class="font-medium text-slate-700 flex items-center gap-1">
                    <Clock class="w-4 h-4" />
                    {{ formatTime(record.playTime) }}
                  </p>
                </div>
                
                <div class="flex gap-1">
                  <Star 
                    v-for="i in 3" 
                    :key="i" 
                    :class="[
                      'w-5 h-5',
                      i <= record.stars ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                    ]"
                  />
                </div>
                
                <div class="text-right min-w-[80px]">
                  <p class="text-sm text-slate-500">得分</p>
                  <p :class="['text-2xl font-bold', getScoreColor(record.score)]">
                    {{ record.score }}
                  </p>
                </div>

                <div class="text-sm text-blue-600 font-medium">
                  查看详情 →
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
