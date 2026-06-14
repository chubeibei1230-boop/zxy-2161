<script setup lang="ts">
import { ref, computed } from 'vue'
import { Target, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, MapPin } from 'lucide-vue-next'
import type { TaskProgress, TaskWarning, TaskObjective } from '@/types'
import { TASK_ICONS, TASK_COLORS, getTaskById } from '@/utils/tasks'
import { useGameStore } from '@/stores/gameStore'
import { useTaskTracker } from '@/stores/taskTracker'

const props = defineProps<{
  taskId: string
  progress: TaskProgress | null
  warnings: TaskWarning[]
  overallProgress: number
  isExpanded?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const gameStore = useGameStore()
const taskTracker = useTaskTracker()
const expanded = ref(props.isExpanded ?? true)

const taskConfig = computed(() => getTaskById(props.taskId as any))

const latestWarning = computed(() => {
  if (props.warnings.length === 0) return null
  return props.warnings[props.warnings.length - 1]
})

const LOWER_IS_BETTER_IDS = new Set([
  'zero_priority_errors', 'no_left_behind', 'low_empty_count',
  'delay_count', 'max_delay',
])
const UPPER_LIMIT_IDS = new Set(['target_wait_time', 'time_bonus'])

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

const getProgressColor = (status: string) => {
  switch (status) {
    case 'success': return 'bg-emerald-500'
    case 'warning': return 'bg-amber-500'
    case 'danger': return 'bg-rose-500'
    default: return 'bg-slate-400'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return 'text-emerald-500'
    case 'warning': return 'text-amber-500'
    case 'danger': return 'text-rose-500'
    default: return 'text-slate-400'
  }
}

const getWarningColor = (type: string) => {
  switch (type) {
    case 'info': return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'warning': return 'bg-amber-50 border-amber-200 text-amber-700'
    case 'danger': return 'bg-rose-50 border-rose-200 text-rose-700'
    default: return 'bg-slate-50 border-slate-200 text-slate-700'
  }
}

const timeRemaining = computed(() => {
  if (!taskConfig.value?.timeLimit || !props.progress) return null
  const elapsed = gameStore.gameTime - props.progress.startTime
  const remaining = Math.max(0, taskConfig.value.timeLimit - elapsed)
  return remaining
})

const evacuationTargetArea = computed(() => {
  if (props.taskId !== 'evacuation') return null
  return taskTracker.evacuationArea || null
})

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
    <div
      @click="emit('toggle')"
      :class="[
        'px-5 py-4 cursor-pointer transition-colors',
        `bg-gradient-to-r ${TASK_COLORS[taskId as any]}`
      ]"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
            {{ TASK_ICONS[taskId as any] }}
          </div>
          <div class="text-white">
            <h3 class="font-bold text-lg">{{ taskConfig?.name }}</h3>
            <div class="flex items-center gap-2 text-white/80 text-sm">
              <Target class="w-4 h-4" />
              <span>任务进行中</span>
              <span v-if="evacuationTargetArea" class="flex items-center gap-1 ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                <MapPin class="w-3 h-3" />
                目标区域: {{ evacuationTargetArea }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div v-if="timeRemaining !== null" class="text-right text-white">
            <div class="flex items-center gap-1 text-sm">
              <Clock class="w-4 h-4" />
              <span>剩余时间</span>
            </div>
            <div :class="[
              'font-mono font-bold text-xl',
              timeRemaining < 60 ? 'text-red-200 animate-pulse' : ''
            ]">
              {{ formatTime(timeRemaining) }}
            </div>
          </div>
          <div class="text-right text-white min-w-[80px]">
            <div class="text-sm opacity-80">完成度</div>
            <div class="font-bold text-2xl">{{ overallProgress }}%</div>
          </div>
          <div class="text-white/80">
            <ChevronUp v-if="expanded" class="w-5 h-5" />
            <ChevronDown v-else class="w-5 h-5" />
          </div>
        </div>
      </div>

      <div class="w-full h-1.5 bg-white/30 mt-3">
        <div
          class="h-full bg-white transition-all duration-500"
          :style="{ width: overallProgress + '%' }"
        />
      </div>
    </div>

    <Transition name="slide">
      <div v-if="expanded" class="p-5 space-y-4">
        <div v-if="evacuationTargetArea" class="flex items-start gap-3 p-4 rounded-xl border bg-orange-50 border-orange-200 text-orange-700">
          <MapPin class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium text-sm">疏散目标区域: <strong>{{ evacuationTargetArea }}</strong></p>
            <p class="text-xs opacity-70 mt-0.5">请优先将 {{ evacuationTargetArea }} 的乘客安排上车</p>
          </div>
        </div>

        <div v-if="latestWarning" :class="[
          'flex items-start gap-3 p-4 rounded-xl border',
          getWarningColor(latestWarning.type)
        ]">
          <AlertTriangle class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium text-sm">{{ latestWarning.message }}</p>
            <p class="text-xs opacity-70 mt-0.5">
              游戏时间 {{ formatTime(latestWarning.gameTime) }}
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-slate-700">任务目标</h4>
          <div
            v-for="obj in progress?.objectives"
            :key="obj.id"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ obj.description }}</span>
              <div class="flex items-center gap-2">
                <span :class="['font-medium', getStatusIcon(getObjectiveStatus(obj))]">
                  {{ obj.current }} / {{ obj.target }}{{ obj.unit }}
                </span>
                <span class="text-xs text-slate-400">
                  ({{ obj.weight }}分)
                </span>
              </div>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-500', getProgressColor(getObjectiveStatus(obj))]"
                :style="{ width: Math.max(0, Math.min(100, getObjectiveProgress(obj))) + '%' }"
              />
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-200">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <div class="flex items-center gap-1">
              <CheckCircle class="w-3.5 h-3.5 text-emerald-500" />
              <span>良好</span>
            </div>
            <div class="flex items-center gap-1">
              <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
              <span>需关注</span>
            </div>
            <div class="flex items-center gap-1">
              <XCircle class="w-3.5 h-3.5 text-rose-500" />
              <span>需改进</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}
</style>
