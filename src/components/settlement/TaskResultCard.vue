<script setup lang="ts">
import { computed } from 'vue'
import { Target, CheckCircle, XCircle, AlertTriangle, TrendingUp, Lightbulb, Clock, Award } from 'lucide-vue-next'
import type { TaskResult, TaskType, TaskMistake, TaskObjective } from '@/types'
import { TASK_ICONS, TASK_COLORS, getTaskById } from '@/utils/tasks'
import { useTaskTracker } from '@/stores/taskTracker'

const props = defineProps<{
  taskId: TaskType
  taskResult: TaskResult
}>()

const taskTracker = useTaskTracker()

const LOWER_IS_BETTER_IDS = new Set([
  'zero_priority_errors', 'no_left_behind', 'low_empty_count',
  'delay_count', 'max_delay',
])
const UPPER_LIMIT_IDS = new Set(['target_wait_time', 'time_bonus'])

const taskConfig = computed(() => getTaskById(props.taskId))

const getStatusColor = (percentage: number) => {
  if (percentage >= 80) return 'text-emerald-500'
  if (percentage >= 60) return 'text-amber-500'
  return 'text-rose-500'
}

const getStatusBg = (percentage: number) => {
  if (percentage >= 80) return 'from-emerald-500 to-teal-500'
  if (percentage >= 60) return 'from-amber-500 to-orange-500'
  return 'from-rose-500 to-red-500'
}

const getStatusText = (percentage: number) => {
  if (percentage >= 90) return '完美完成'
  if (percentage >= 80) return '优秀'
  if (percentage >= 60) return '通过'
  return '未通过'
}

const getObjectiveStatus = (obj: TaskObjective) => {
  if (LOWER_IS_BETTER_IDS.has(obj.id)) {
    if (obj.current <= obj.target) return 'success'
    return obj.current <= obj.target + 2 ? 'warning' : 'danger'
  }
  if (UPPER_LIMIT_IDS.has(obj.id)) {
    return obj.current <= obj.target ? 'success' : 'danger'
  }
  const ratio = obj.current / Math.max(1, obj.target)
  if (ratio >= 0.9) return 'success'
  if (ratio >= 0.6) return 'warning'
  return 'danger'
}

const getObjectiveProgress = (obj: TaskObjective) => {
  return taskTracker.calcObjectiveProgress(obj)
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const totalPointsLost = computed(() => {
  return props.taskResult.mistakes.reduce((sum, m) => sum + m.pointsLost, 0)
})

const keyMistakes = computed(() => {
  return [...props.taskResult.mistakes]
    .sort((a, b) => b.pointsLost - a.pointsLost)
    .slice(0, 3)
})
</script>

<template>
  <div class="bg-white rounded-3xl shadow-xl overflow-hidden">
    <div :class="[
      'px-8 py-6 bg-gradient-to-r',
      TASK_COLORS[taskId]
    ]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
            {{ TASK_ICONS[taskId] }}
          </div>
          <div class="text-white">
            <div class="flex items-center gap-2 mb-1">
              <Target class="w-5 h-5" />
              <span class="text-sm opacity-80">任务挑战结果</span>
            </div>
            <h2 class="text-2xl font-bold">{{ taskConfig?.name }}</h2>
            <p class="text-white/80 text-sm mt-1">{{ taskConfig?.description }}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="flex items-center gap-2 mb-1">
            <Award :class="['w-6 h-6', getStatusColor(taskResult.percentage)]" />
            <span :class="['text-5xl font-bold', getStatusColor(taskResult.percentage)]">
              {{ taskResult.percentage }}%
            </span>
          </div>
          <p :class="['text-lg font-semibold', getStatusColor(taskResult.percentage)]">
            {{ getStatusText(taskResult.percentage) }}
          </p>
          <p class="text-white/70 text-sm">
            {{ taskResult.score }} / {{ taskResult.maxScore }} 分
          </p>
        </div>
      </div>

      <div class="mt-6 w-full h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          :class="['h-full rounded-full transition-all duration-1000 bg-gradient-to-r', getStatusBg(taskResult.percentage)]"
          :style="{ width: `${taskResult.percentage}%` }"
        />
      </div>
    </div>

    <div class="p-8 space-y-8">
      <div>
        <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-indigo-500" />
          任务目标完成情况
        </h3>
        <div class="grid md:grid-cols-3 gap-4">
          <div
            v-for="obj in taskResult.objectives"
            :key="obj.id"
            class="bg-slate-50 rounded-2xl p-5 border border-slate-200"
          >
            <div class="flex items-start justify-between mb-3">
              <h4 class="font-semibold text-slate-700 text-sm">{{ obj.description }}</h4>
              <div :class="[
                'w-8 h-8 rounded-full flex items-center justify-center',
                getObjectiveStatus(obj) === 'success' ? 'bg-emerald-100' :
                getObjectiveStatus(obj) === 'warning' ? 'bg-amber-100' : 'bg-rose-100'
              ]">
                <CheckCircle v-if="getObjectiveStatus(obj) === 'success'" class="w-4 h-4 text-emerald-600" />
                <AlertTriangle v-else-if="getObjectiveStatus(obj) === 'warning'" class="w-4 h-4 text-amber-600" />
                <XCircle v-else class="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <div class="flex items-end justify-between mb-2">
              <span :class="[
                'text-2xl font-bold',
                getObjectiveStatus(obj) === 'success' ? 'text-emerald-600' :
                getObjectiveStatus(obj) === 'warning' ? 'text-amber-600' : 'text-rose-600'
              ]">
                {{ obj.current }}
              </span>
              <span class="text-slate-500 text-sm">
                / {{ obj.target }}{{ obj.unit }}
              </span>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                :class="[
                  'h-full rounded-full transition-all',
                  getObjectiveStatus(obj) === 'success' ? 'bg-emerald-500' :
                  getObjectiveStatus(obj) === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                ]"
                :style="{ width: `${Math.max(0, Math.min(100, getObjectiveProgress(obj)))}%` }"
              />
            </div>
            <p class="text-xs text-slate-400 mt-2">权重: {{ obj.weight }} 分</p>
          </div>
        </div>
      </div>

      <div v-if="keyMistakes.length > 0">
        <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <XCircle class="w-5 h-5 text-rose-500" />
          关键失误原因
          <span class="text-sm font-normal text-slate-500 ml-2">
            (共损失 {{ totalPointsLost }} 分)
          </span>
        </h3>
        <div class="space-y-3">
          <div
            v-for="mistake in keyMistakes"
            :key="mistake.id"
            class="bg-rose-50 border border-rose-200 rounded-2xl p-5"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <AlertTriangle class="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p class="font-medium text-rose-800">{{ mistake.description }}</p>
              </div>
              <span class="text-rose-600 font-bold text-sm whitespace-nowrap">
                -{{ mistake.pointsLost }} 分
              </span>
            </div>
            <p class="text-sm text-rose-700 mb-2 ml-7">
              <strong>影响:</strong> {{ mistake.impact }}
            </p>
            <p class="text-sm text-rose-600 ml-7 flex items-start gap-1">
              <Lightbulb class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{{ mistake.suggestion }}</span>
            </p>
            <p class="text-xs text-rose-400 mt-2 ml-7 flex items-center gap-1">
              <Clock class="w-3 h-3" />
              发生于游戏时间 {{ formatTime(mistake.gameTime) }}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lightbulb class="w-5 h-5 text-amber-500" />
          改进建议
        </h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div
            v-for="(suggestion, index) in taskResult.suggestions"
            :key="index"
            class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <span class="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {{ index + 1 }}
            </span>
            <p class="text-sm text-amber-800">{{ suggestion }}</p>
          </div>
        </div>
      </div>

      <div v-if="taskConfig?.tips" class="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
        <h4 class="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
          <Target class="w-4 h-4" />
          任务技巧回顾
        </h4>
        <ul class="space-y-2">
          <li
            v-for="(tip, i) in taskConfig.tips"
            :key="i"
            class="text-sm text-indigo-700 flex items-start gap-2"
          >
            <span class="text-indigo-400">•</span>
            {{ tip }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
