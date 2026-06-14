<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bus, Trophy, BookOpen, Settings, Info, Target } from 'lucide-vue-next'
import LevelCard from '@/components/menu/LevelCard.vue'
import TaskSelector from '@/components/menu/TaskSelector.vue'
import { LEVELS } from '@/utils/levels'
import { initDB } from '@/utils/idb'
import { initLevels } from '@/utils/levels'
import type { TaskType } from '@/types'

const router = useRouter()
const isLoading = ref(true)
const showInstructions = ref(false)
const showTaskSelector = ref(false)
const selectedLevelId = ref<string | null>(null)

const initialize = async () => {
  try {
    await initDB()
    await initLevels()
  } catch (error) {
    console.error('Failed to initialize:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  initialize()
})

const handleLevelSelect = (levelId: string) => {
  selectedLevelId.value = levelId
  showTaskSelector.value = true
}

const handleTaskSelect = (taskId: TaskType | null) => {
  if (!selectedLevelId.value) return
  
  if (taskId) {
    router.push({
      path: `/game/${selectedLevelId.value}`,
      query: { taskId }
    })
  } else {
    router.push(`/game/${selectedLevelId.value}`)
  }
}

const handleViewRecords = () => {
  router.push('/records')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-3 mb-6">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <Bus class="w-8 h-8 text-white" />
          </div>
          <div class="text-left">
            <h1 class="text-5xl font-bold text-white mb-1">接驳车调度大师</h1>
            <p class="text-slate-400">Shuttle Dispatch Master</p>
          </div>
        </div>
        <p class="text-xl text-slate-300 max-w-2xl mx-auto">
          在车辆到达前合理安排乘客队列，应对各类突发事件，成为最优秀的调度大师！
        </p>
      </div>

      <div class="flex items-center justify-center gap-4 mb-8">
        <button
          @click="showInstructions = !showInstructions"
          class="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
        >
          <BookOpen class="w-4 h-4" />
          游戏说明
        </button>
        <button
          @click="handleViewRecords"
          class="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors"
        >
          <Trophy class="w-4 h-4" />
          历史记录
        </button>
      </div>

      <TaskSelector
        v-if="selectedLevelId"
        :level-id="selectedLevelId"
        :show="showTaskSelector"
        @close="showTaskSelector = false"
        @select="handleTaskSelect"
      />

      <Transition name="fade">
        <div v-if="showInstructions" class="mb-8 p-6 bg-slate-800 rounded-2xl border border-slate-700">
          <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info class="w-5 h-5" />
            游戏说明
          </h3>
          <div class="grid md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h4 class="font-bold text-white mb-2">基本操作</h4>
              <ul class="space-y-2 text-sm">
                <li>• 拖拽<span class="text-blue-400">乘客卡片</span>到对应目的地的候车区</li>
                <li>• 拖拽<span class="text-emerald-400">车辆卡片</span>调整发车顺序</li>
                <li>• 点击候车区内的乘客可将其移回队列</li>
                <li>• 使用暂停功能规划调度策略</li>
                <li>• 调整游戏速度适应你的节奏</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-white mb-2">评分规则</h4>
              <ul class="space-y-2 text-sm">
                <li>• <span class="text-blue-400">准时发车 (30%)</span>: 车辆准时发车不扣分</li>
                <li>• <span class="text-emerald-400">乘客等待 (25%)</span>: 乘客等待不超过3分钟</li>
                <li>• <span class="text-amber-400">满员冲突 (20%)</span>: 避免候车区满员</li>
                <li>• <span class="text-purple-400">优先级满足 (25%)</span>: VIP和残障人士优先</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-white mb-2">随机事件</h4>
              <ul class="space-y-2 text-sm">
                <li>• <span class="text-purple-400">临时增员</span>: 额外乘客突然到达</li>
                <li>• <span class="text-amber-400">车辆晚到</span>: 某车发车时间延后</li>
                <li>• <span class="text-rose-400">候车区满员</span>: 某候车区容量减少</li>
                <li>• <span class="text-blue-400">优先级变更</span>: 乘客优先级变化</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-white mb-2">注意事项</h4>
              <ul class="space-y-2 text-sm">
                <li>• 未到达的乘客无法操作（灰色显示）</li>
                <li>• 乘客只能前往对应目的地的候车区</li>
                <li>• 车辆到站后自动开始登车，按优先级排序</li>
                <li>• 游戏成绩自动保存到本地</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-white mb-2 flex items-center gap-2">
                <Target class="w-4 h-4 text-indigo-400" />
                任务挑战模式
              </h4>
              <ul class="space-y-2 text-sm">
                <li>• 选择关卡后可选择<span class="text-indigo-400">任务挑战</span>或直接开始</li>
                <li>• 任务有特殊目标，完成可获得额外成就感</li>
                <li>• 游戏过程中实时显示任务进度和风险提醒</li>
                <li>• 结算时展示任务完成情况和改进建议</li>
                <li>• 历史记录中可查看任务挑战成绩</li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>

      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LevelCard
          v-for="level in LEVELS"
          :key="level.id"
          :level="level"
          @select="handleLevelSelect"
        />
      </div>

      <div class="mt-12 text-center text-slate-500 text-sm">
        <p>游戏数据保存在本地浏览器中，支持离线游玩</p>
        <p class="mt-1">© 2024 接驳车调度大师</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
