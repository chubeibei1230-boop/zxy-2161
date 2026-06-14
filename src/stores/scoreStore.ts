import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Score, DeductionItem } from '@/types'
import { generateId, getStars } from '@/utils/helpers'

export const useScoreStore = defineStore('score', () => {
  const onTimeDeparture = ref(100)
  const passengerWait = ref(100)
  const capacityConflict = ref(100)
  const prioritySatisfaction = ref(100)
  const deductions = ref<DeductionItem[]>([])

  const total = computed(() => {
    return Math.round(
      onTimeDeparture.value * 0.3 +
      passengerWait.value * 0.25 +
      capacityConflict.value * 0.2 +
      prioritySatisfaction.value * 0.25
    )
  })

  const stars = computed(() => getStars(total.value))

  const score = computed<Score>(() => ({
    onTimeDeparture: onTimeDeparture.value,
    passengerWait: passengerWait.value,
    capacityConflict: capacityConflict.value,
    prioritySatisfaction: prioritySatisfaction.value,
    total: total.value,
    stars: stars.value,
    deductions: deductions.value,
  }))

  function addDeduction(
    type: string,
    description: string,
    points: number,
    gameTime: number,
    category: 'onTime' | 'wait' | 'conflict' | 'priority'
  ) {
    deductions.value.push({
      id: generateId(),
      type,
      description,
      points,
      gameTime,
    })

    switch (category) {
      case 'onTime':
        onTimeDeparture.value = Math.max(0, onTimeDeparture.value - points)
        break
      case 'wait':
        passengerWait.value = Math.max(0, passengerWait.value - points)
        break
      case 'conflict':
        capacityConflict.value = Math.max(0, capacityConflict.value - points)
        break
      case 'priority':
        prioritySatisfaction.value = Math.max(0, prioritySatisfaction.value - points)
        break
    }
  }

  function resetScore() {
    onTimeDeparture.value = 100
    passengerWait.value = 100
    capacityConflict.value = 100
    prioritySatisfaction.value = 100
    deductions.value = []
  }

  function getScoreBreakdown(): Omit<Score, 'deductions'> {
    return {
      onTimeDeparture: onTimeDeparture.value,
      passengerWait: passengerWait.value,
      capacityConflict: capacityConflict.value,
      prioritySatisfaction: prioritySatisfaction.value,
      total: total.value,
      stars: stars.value,
    }
  }

  return {
    onTimeDeparture,
    passengerWait,
    capacityConflict,
    prioritySatisfaction,
    total,
    stars,
    deductions,
    score,
    addDeduction,
    resetScore,
    getScoreBreakdown,
  }
})
