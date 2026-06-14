<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Star, Target, Info, ChevronRight } from 'lucide-vue-next'
import type { TaskType, MissionTask } from '@/types'
import { MISSION_TASKS, TASK_ICONS, TASK_COLORS, getTasksForLevel } from '@/utils/tasks'

const props = defineProps<{
  levelId: string
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', taskId: TaskType | null): void
}>()

const selectedTaskId = ref<TaskType | null>(null)
const hoveredTaskId = ref<TaskType | null>(null)

const availableTasks = computed(() => getTasksForLevel(props.levelId))

const selectedTask = computed(() => {
  if (!selectedTaskId.value) return null
  return MISSION_TASKS.find(t => t.id === selectedTaskId.value)
})

const handleTaskSelect = (taskId: TaskType) => {
  if (selectedTaskId.value === taskId) {
    selectedTaskId.value = null
  } else {
    selectedTaskId.value = taskId
  }
}

const handleConfirm = () => {
  emit('select', selectedTaskId.value)
  emit('close')
}

const handleSkip = () => {
  selectedTaskId.value = null
  emit('select', null)
  emit('close')
}

const getDifficultyStars = (difficulty: number) => {
  return Array.from({ length: 3 }, (_, i) => i < difficulty)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                  <Target class="w-8 h-8" />
                  调度任务挑战
                </h2>
                <p class="text-indigo-200 mt-1">选择一个任务目标，完成特殊挑战获得额外成就感</p>
              </div>
              <button
                @click="emit('close')"
                class="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X class="w-6 h-6" />
              </button>
            </div>
          </div>

          <div class="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
            <div class="mb-6">
              <h3 class="text-lg font-bold text-slate-800 mb-2">可选任务</h3>
              <p class="text-sm text-slate-500">点击选择一个任务，或跳过直接开始游戏</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div
                v-for="task in availableTasks"
                :key="task.id"
                @click="handleTaskSelect(task.id)"
                @mouseenter="hoveredTaskId = task.id"
                @mouseleave="hoveredTaskId = null"
                :class="[
                  'relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300',
                  selectedTaskId === task.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                ]"
              >
                <div v-if="selectedTaskId === task.id" class="absolute -top-2 -right-2">
                  <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    ✓
                  </div>
                </div>

                <div class="flex items-start gap-4">
                  <div :class="[
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br shadow-md',
                    TASK_COLORS[task.id]
                  ]">
                    {{ TASK_ICONS[task.id] }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-800 text-lg">{{ task.name }}</h4>
                    <div class="flex items-center gap-1 mt-1">
                      <Star
                        v-for="(filled, i) in getDifficultyStars(task.difficulty)"
                        :key="i"
                        :class="[
                          'w-4 h-4',
                          filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        ]"
                      />
                      <span class="text-xs text-slate-500 ml-2">
                        {{ ['简单', '中等', '困难'][task.difficulty - 1] }}
                      </span>
                    </div>
                  </div>
                </div>

                <p class="text-sm text-slate-600 mt-3">{{ task.description }}</p>

                <div v-if="task.timeLimit" class="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <Info class="w-4 h-4" />
                  限时 {{ Math.floor(task.timeLimit / 60) }} 分钟
                </div>

                <Transition name="slide">
                  <div v-if="hoveredTaskId === task.id || selectedTaskId === task.id" class="mt-4 pt-4 border-t border-slate-200">
                    <h5 class="text-sm font-semibold text-slate-700 mb-2">任务目标</h5>
                    <ul class="space-y-1.5">
                      <li
                        v-for="obj in task.objectives"
                        :key="obj.id"
                        class="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-medium">
                          {{ obj.weight }}
                        </span>
                        <span>{{ obj.description }}: {{ obj.target }}{{ obj.unit }}</span>
                      </li>
                    </ul>

                    <h5 class="text-sm font-semibold text-slate-700 mt-4 mb-2">小提示</h5>
                    <ul class="space-y-1">
                      <li
                        v-for="(tip, i) in task.tips"
                        :key="i"
                        class="text-xs text-slate-500 flex items-start gap-2"
                      >
                        <span class="text-indigo-400">•</span>
                        {{ tip }}
                      </li>
                    </ul>
                  </div>
                </Transition>
              </div>
            </div>

            <div v-if="selectedTask" class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <div class="flex items-center gap-3 mb-4">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shadow-md',
                  TASK_COLORS[selectedTask.id]
                ]">
                  {{ TASK_ICONS[selectedTask.id] }}
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-lg">已选择: {{ selectedTask.name }}</h4>
                  <p class="text-sm text-slate-600">{{ selectedTask.description }}</p>
                </div>
              </div>
              <div class="text-sm text-indigo-700 bg-white/60 px-4 py-3 rounded-xl">
                <strong>任务目标:</strong> 完成所有目标获得 60% 以上分数即可通过挑战。游戏过程中会实时显示任务进度和风险提醒。
              </div>
            </div>
          </div>

          <div class="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              @click="handleSkip"
              class="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              跳过任务，直接开始
            </button>
            <div class="flex items-center gap-3">
              <button
                @click="emit('close')"
                class="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                @click="handleConfirm"
                class="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all"
              >
                {{ selectedTask ? '开始挑战' : '开始游戏' }}
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
</style>
