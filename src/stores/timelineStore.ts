import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimelineItem } from '@/types'
import { generateId } from '@/utils/helpers'

export const useTimelineStore = defineStore('timeline', () => {
  const events = ref<TimelineItem[]>([])

  const sortedEvents = computed(() => 
    [...events.value].sort((a, b) => a.gameTime - b.gameTime)
  )

  function addEvent(
    type: TimelineItem['type'],
    description: string,
    gameTime: number,
    action?: string,
    pointChange?: number
  ) {
    events.value.push({
      id: generateId(),
      type,
      description,
      gameTime,
      action,
      pointChange,
    })
  }

  function clearEvents() {
    events.value = []
  }

  function getAllEvents(): TimelineItem[] {
    return sortedEvents.value
  }

  return {
    events,
    sortedEvents,
    addEvent,
    clearEvents,
    getAllEvents,
  }
})
