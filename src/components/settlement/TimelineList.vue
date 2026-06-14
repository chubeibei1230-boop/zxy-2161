<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Clock, Filter, ChevronDown, ChevronUp } from 'lucide-vue-next'
import TimelineItem from './TimelineItem.vue'
import type { TimelineItem as TimelineItemType, TimelineType } from '@/types'
import { useTimelineStore } from '@/stores/timelineStore'
import { getTimelineEvents } from '@/utils/idb'
import { useRoute } from 'vue-router'

const route = useRoute()
const timelineStore = useTimelineStore()

const events = ref<TimelineItemType[]>([])
const selectedFilter = ref<TimelineType | 'all'>('all')
const isExpanded = ref(true)

const filterOptions: { value: TimelineType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'passenger_arrive', label: '乘客到达' },
  { value: 'passenger_move', label: '乘客移动' },
  { value: 'vehicle_arrive', label: '车辆到达' },
  { value: 'vehicle_depart', label: '车辆发车' },
  { value: 'event_trigger', label: '事件触发' },
  { value: 'score_change', label: '扣分记录' },
]

const filteredEvents = computed(() => {
  if (selectedFilter.value === 'all') return events.value
  return events.value.filter(e => e.type === selectedFilter.value)
})

const keyEvents = computed(() => 
  events.value.filter(e => 
    e.type === 'event_trigger' || 
    e.type === 'vehicle_depart' ||
    (e.pointChange && e.pointChange < -5)
  )
)

const loadEvents = async () => {
  const recordId = route.params.recordId as string
  if (recordId) {
    try {
      const storedEvents = await getTimelineEvents(recordId)
      if (storedEvents.length > 0) {
        events.value = storedEvents
      } else {
        events.value = timelineStore.getAllEvents()
      }
    } catch {
      events.value = timelineStore.getAllEvents()
    }
  } else {
    events.value = timelineStore.getAllEvents()
  }
}

onMounted(() => {
  loadEvents()
})

watch(() => route.params.recordId, () => {
  loadEvents()
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div 
      class="px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white cursor-pointer flex items-center justify-between"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3">
        <Clock class="w-5 h-5" />
        <h3 class="text-lg font-bold">时间线复盘</h3>
        <span class="text-sm text-slate-300">共 {{ events.length }} 条记录</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-300">关键事件 {{ keyEvents.length }} 条</span>
        <ChevronUp v-if="isExpanded" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </div>
    </div>

    <Transition name="expand">
      <div v-if="isExpanded" class="p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-500" />
            <span class="text-sm text-slate-600">筛选:</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in filterOptions"
              :key="opt.value"
              @click="selectedFilter = opt.value"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                selectedFilter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="max-h-[600px] overflow-y-auto pr-2">
          <div v-if="filteredEvents.length === 0" 
               class="flex flex-col items-center justify-center py-12 text-slate-400">
            <Clock class="w-12 h-12 mb-3 opacity-50" />
            <p>暂无记录</p>
          </div>
          
          <TransitionGroup name="list">
            <TimelineItem
              v-for="(item, index) in filteredEvents"
              :key="item.id"
              :item="item"
              :index="index"
            />
          </TransitionGroup>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
