<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Users, Clock, UserPlus, RefreshCw } from 'lucide-vue-next'
import { useGameStore } from '@/stores/gameStore'
import { formatTime } from '@/utils/helpers'

const gameStore = useGameStore()

const activeUnresolvedEvents = computed(() => 
  gameStore.activeEvents.filter(e => !e.resolved)
)

const eventIcons: Record<string, any> = {
  surge: Users,
  delay: Clock,
  full: AlertTriangle,
  priority_change: RefreshCw,
}

const eventColors: Record<string, string> = {
  surge: 'bg-purple-600 border-purple-700',
  delay: 'bg-amber-600 border-amber-700',
  full: 'bg-rose-600 border-rose-700',
  priority_change: 'bg-blue-600 border-blue-700',
}

function getTimeRemaining(event: typeof gameStore.activeEvents[0]): number {
  if (!event.expirationTime) return 0
  return Math.max(0, event.expirationTime - gameStore.gameTime)
}
</script>

<template>
  <Transition name="banner">
    <div 
      v-if="activeUnresolvedEvents.length > 0"
      class="w-full"
    >
      <div 
        v-for="event in activeUnresolvedEvents"
        :key="event.id"
        :class="[
          'px-4 py-3 border-b-2 text-white animate-pulse',
          eventColors[event.type] || 'bg-slate-600 border-slate-700'
        ]"
      >
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <div class="flex items-center gap-3">
            <component 
              :is="eventIcons[event.type] || AlertTriangle" 
              class="w-5 h-5"
            />
            <div>
              <p class="font-bold">{{ event.description }}</p>
              <p v-if="event.data.count" class="text-xs opacity-80">
                需要紧急安排 {{ event.data.count }} 名乘客
              </p>
              <p v-else-if="event.data.delaySeconds" class="text-xs opacity-80">
                请调整后续车辆调度
              </p>
              <p v-else-if="event.data.reduction" class="text-xs opacity-80">
                请及时转移超出容量的乘客
              </p>
              <p v-else-if="event.data.newPriority" class="text-xs opacity-80">
                请优先安排该乘客
              </p>
            </div>
          </div>
          
          <div v-if="event.expirationTime" class="text-right">
            <p class="text-sm font-mono">
              {{ formatTime(getTimeRemaining(event)) }}
            </p>
            <p class="text-xs opacity-70">剩余时间</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
