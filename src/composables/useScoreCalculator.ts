import { computed } from 'vue'
import { useScoreStore } from '@/stores/scoreStore'
import type { Score, DeductionItem } from '@/types'

export function useScoreCalculator() {
  const scoreStore = useScoreStore()

  const score = computed<Score>(() => scoreStore.score)

  const totalScore = computed(() => scoreStore.total)
  const stars = computed(() => scoreStore.stars)

  const scoreBreakdown = computed(() => ({
    onTimeDeparture: {
      label: '准时发车',
      score: scoreStore.onTimeDeparture,
      weight: 30,
      description: '车辆按预定时间发车不扣分，每延迟10秒扣2分',
    },
    passengerWait: {
      label: '乘客等待',
      score: scoreStore.passengerWait,
      weight: 25,
      description: '乘客从到达到上车时间，超过3分钟每人扣1分',
    },
    capacityConflict: {
      label: '满员冲突',
      score: scoreStore.capacityConflict,
      weight: 20,
      description: '候车区满员后新乘客无法安排，每次扣5分',
    },
    prioritySatisfaction: {
      label: '优先级满足',
      score: scoreStore.prioritySatisfaction,
      weight: 25,
      description: '高优先级乘客优先上车，优先级顺序错误每人扣3分',
    },
  }))

  const recentDeductions = computed<DeductionItem[]>(() => 
    [...scoreStore.deductions].sort((a, b) => b.gameTime - a.gameTime).slice(0, 5)
  )

  const allDeductions = computed<DeductionItem[]>(() =>
    [...scoreStore.deductions].sort((a, b) => a.gameTime - b.gameTime)
  )

  const suggestions = computed<string[]>(() => {
    const suggestions: string[] = []
    const breakdown = scoreBreakdown.value

    if (breakdown.onTimeDeparture.score < 70) {
      suggestions.push('车辆发车延迟较多，建议合理安排候车区，确保乘客及时登车')
    }
    if (breakdown.passengerWait.score < 70) {
      suggestions.push('乘客等待时间过长，建议优先安排等待时间较长的乘客')
    }
    if (breakdown.capacityConflict.score < 70) {
      suggestions.push('候车区容量冲突频繁，建议提前分散乘客到不同候车区')
    }
    if (breakdown.prioritySatisfaction.score < 70) {
      suggestions.push('优先级顺序错误较多，建议将VIP和残障人士乘客安排在候车区前列')
    }

    if (suggestions.length === 0) {
      suggestions.push('表现优秀！继续保持良好的调度策略')
    }

    return suggestions
  })

  const performanceLevel = computed(() => {
    const total = totalScore.value
    if (total >= 90) return { level: '优秀', color: 'text-emerald-600', description: '调度大师！所有环节处理完美' }
    if (total >= 80) return { level: '良好', color: 'text-blue-600', description: '表现不错，还有提升空间' }
    if (total >= 60) return { level: '及格', color: 'text-amber-600', description: '基本达标，需要改进调度策略' }
    return { level: '不及格', color: 'text-rose-600', description: '需要更多练习，注意时间管理' }
  })

  function getDeductionsByType(type: string): DeductionItem[] {
    return scoreStore.deductions.filter(d => d.type === type)
  }

  function getDeductionSummary() {
    const summary: Record<string, { count: number; totalPoints: number }> = {}
    
    scoreStore.deductions.forEach(d => {
      if (!summary[d.type]) {
        summary[d.type] = { count: 0, totalPoints: 0 }
      }
      summary[d.type].count++
      summary[d.type].totalPoints += d.points
    })

    return Object.entries(summary)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }

  return {
    score,
    totalScore,
    stars,
    scoreBreakdown,
    recentDeductions,
    allDeductions,
    suggestions,
    performanceLevel,
    getDeductionsByType,
    getDeductionSummary,
  }
}
