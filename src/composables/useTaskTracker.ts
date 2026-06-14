import { ref, computed, watch } from 'vue'
import type { 
  TaskType, 
  TaskProgress, 
  TaskResult, 
  TaskObjective, 
  TaskWarning,
  TaskMistake,
  MissionTask
} from '@/types'
import { getTaskById } from '@/utils/tasks'
import { useGameStore } from '@/stores/gameStore'
import { useScoreStore } from '@/stores/scoreStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { generateId } from '@/utils/helpers'
import { PRIORITY_ORDER } from '@/types'

export function useTaskTracker() {
  const gameStore = useGameStore()
  const scoreStore = useScoreStore()
  const timelineStore = useTimelineStore()

  const selectedTask = ref<TaskType | null>(null)
  const taskConfig = ref<MissionTask | null>(null)
  const progress = ref<TaskProgress | null>(null)
  const result = ref<TaskResult | null>(null)

  const priorityErrorCount = ref(0)
  const totalVipPassengers = ref(0)
  const totalDisabledPassengers = ref(0)
  const boardedVipPassengers = ref(0)
  const boardedDisabledPassengers = ref(0)
  const departedVehicles = ref<{ id: string; passengers: number; capacity: number; delay: number; destination: string }[]>([])
  const evacuationArea = ref<string>('A区')
  const maxDelay = ref(0)
  const delayCount = ref(0)
  const targetAreaBoardings = ref<{ passengerId: string; waitTime: number }[]>([])
  const targetAreaDepartures = ref<{ onTime: boolean }[]>([])
  const taskMistakes = ref<TaskMistake[]>([])
  const taskWarnings = ref<TaskWarning[]>([])

  const isTaskActive = computed(() => selectedTask.value !== null && progress.value !== null)

  const overallProgress = computed(() => {
    if (!progress.value) return 0
    const objectives = progress.value.objectives
    if (objectives.length === 0) return 0
    
    let totalWeight = 0
    let weightedProgress = 0
    
    for (const obj of objectives) {
      totalWeight += obj.weight
      const objProgress = Math.min(100, (obj.current / Math.max(1, obj.target)) * 100)
      weightedProgress += objProgress * (obj.weight / 100)
    }
    
    return Math.round(weightedProgress * 100 / totalWeight)
  })

  function initializeTask(taskId: TaskType) {
    const task = getTaskById(taskId)
    if (!task) return

    selectedTask.value = taskId
    taskConfig.value = task

    const objectives: TaskObjective[] = task.objectives.map(obj => ({
      ...obj,
      current: 0,
    }))

    progress.value = {
      taskId,
      status: 'in_progress',
      objectives,
      warnings: [],
      startTime: 0,
    }

    resetCounters()
  }

  function resetCounters() {
    priorityErrorCount.value = 0
    totalVipPassengers.value = 0
    totalDisabledPassengers.value = 0
    boardedVipPassengers.value = 0
    boardedDisabledPassengers.value = 0
    departedVehicles.value = []
    maxDelay.value = 0
    delayCount.value = 0
    targetAreaBoardings.value = []
    targetAreaDepartures.value = []
    taskMistakes.value = []
    taskWarnings.value = []
  }

  function updateObjective(objectiveId: string, currentValue: number) {
    if (!progress.value) return
    
    const obj = progress.value.objectives.find(o => o.id === objectiveId)
    if (obj) {
      obj.current = currentValue
    }
  }

  function addWarning(type: 'info' | 'warning' | 'danger', message: string) {
    if (!progress.value) return
    
    const warning: TaskWarning = {
      id: generateId(),
      type,
      message,
      gameTime: gameStore.gameTime,
    }
    
    progress.value.warnings.push(warning)
    taskWarnings.value.push(warning)
    
    timelineStore.addEvent(
      'task_update',
      `[任务提醒] ${message}`,
      gameStore.gameTime,
      '任务系统'
    )
  }

  function addMistake(description: string, impact: string, suggestion: string, pointsLost: number) {
    const mistake: TaskMistake = {
      id: generateId(),
      description,
      impact,
      suggestion,
      gameTime: gameStore.gameTime,
      pointsLost,
    }
    taskMistakes.value.push(mistake)
    
    timelineStore.addEvent(
      'task_failure',
      `[任务失误] ${description}`,
      gameStore.gameTime,
      '任务系统'
    )
  }

  function onPriorityError(count: number) {
    if (selectedTask.value !== 'priority_protection') return
    
    priorityErrorCount.value += count
    updateObjective('zero_priority_errors', priorityErrorCount.value)
    
    addMistake(
      `${count} 名乘客登车顺序不符合优先级`,
      `优先级满意度扣分 ${count * 3} 分`,
      '下次请确保高优先级乘客排在候车区前列',
      count * 3
    )
    
    if (priorityErrorCount.value >= 3) {
      addWarning('danger', '优先级失误过多，任务濒临失败！')
    }
  }

  function onPassengerBoard(passenger: { id: string; priority: string; destination: string; arrivalTime: number }) {
    if (!selectedTask.value) return

    if (selectedTask.value === 'priority_protection') {
      if (passenger.priority === 'vip') {
        boardedVipPassengers.value++
        const ratio = totalVipPassengers.value > 0 
          ? Math.round((boardedVipPassengers.value / totalVipPassengers.value) * 100)
          : 100
        updateObjective('vip_boarded_ratio', ratio)
      }
      if (passenger.priority === 'disabled') {
        boardedDisabledPassengers.value++
        const ratio = totalDisabledPassengers.value > 0
          ? Math.round((boardedDisabledPassengers.value / totalDisabledPassengers.value) * 100)
          : 100
        updateObjective('disabled_boarded_ratio', ratio)
      }
    }

    if (selectedTask.value === 'area_specialist') {
      const targetArea = taskConfig.value?.targetArea || 'A区'
      if (passenger.destination === targetArea) {
        const waitTime = gameStore.gameTime - passenger.arrivalTime
        targetAreaBoardings.value.push({ passengerId: passenger.id, waitTime })
        updateObjective('target_boarded', targetAreaBoardings.value.length)
        
        const avgWait = targetAreaBoardings.value.reduce((sum, b) => sum + b.waitTime, 0) / targetAreaBoardings.value.length
        updateObjective('target_wait_time', Math.round(avgWait))
      }
    }

    if (selectedTask.value === 'evacuation') {
      updateEvacuationProgress()
    }
  }

  function onVehicleDepart(vehicle: { id: string; passengers: number; capacity: number; scheduledDeparture: number; destination: string }) {
    if (!selectedTask.value) return

    const delay = Math.max(0, gameStore.gameTime - vehicle.scheduledDeparture)
    
    departedVehicles.value.push({
      id: vehicle.id,
      passengers: vehicle.passengers,
      capacity: vehicle.capacity,
      delay,
      destination: vehicle.destination,
    })

    if (selectedTask.value === 'minimize_empty_seats') {
      const totalPassengers = departedVehicles.value.reduce((sum, v) => sum + v.passengers, 0)
      const totalCapacity = departedVehicles.value.reduce((sum, v) => sum + v.capacity, 0)
      const avgOccupancy = totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0
      updateObjective('avg_occupancy', avgOccupancy)
      
      const fullCount = departedVehicles.value.filter(v => v.passengers >= v.capacity).length
      updateObjective('full_departure_count', fullCount)
      
      const lowEmptyCount = departedVehicles.value.filter(v => (v.capacity - v.passengers) > 3).length
      updateObjective('low_empty_count', lowEmptyCount)

      if (vehicle.capacity - vehicle.passengers > 3) {
        const area = gameStore.waitingAreas.find(a => a.destination === vehicle.destination)
        if (area && area.passengers.length > 0) {
          addMistake(
            `车辆 ${vehicle.id.slice(0, 6)} 发车时空座 ${vehicle.capacity - vehicle.passengers} 个`,
            `运力浪费，扣分 ${(vehicle.capacity - vehicle.passengers) * 2} 分`,
            '下次请确保候车区乘客及时登车',
            (vehicle.capacity - vehicle.passengers) * 2
          )
        }
      }
    }

    if (selectedTask.value === 'on_time_perfection') {
      if (delay > maxDelay.value) {
        maxDelay.value = Math.round(delay)
      }
      updateObjective('max_delay', maxDelay.value)
      
      if (delay > 0) {
        delayCount.value++
        updateObjective('delay_count', delayCount.value)
        addMistake(
          `车辆 ${vehicle.id.slice(0, 6)} 延误 ${Math.round(delay)} 秒发车`,
          `准点率下降，扣分 ${Math.floor(delay / 10) * 2} 分`,
          '下次请提前准备好乘客',
          Math.floor(delay / 10) * 2
        )
      }
      
      const onTimeCount = departedVehicles.value.filter(v => v.delay <= 0).length
      const onTimeRate = departedVehicles.value.length > 0 
        ? Math.round((onTimeCount / departedVehicles.value.length) * 100)
        : 100
      updateObjective('on_time_rate', onTimeRate)
    }

    if (selectedTask.value === 'area_specialist') {
      const targetArea = taskConfig.value?.targetArea || 'A区'
      if (vehicle.destination === targetArea) {
        targetAreaDepartures.value.push({ onTime: delay <= 0 })
        const onTimeCount = targetAreaDepartures.value.filter(d => d.onTime).length
        const onTimeRate = targetAreaDepartures.value.length > 0
          ? Math.round((onTimeCount / targetAreaDepartures.value.length) * 100)
          : 100
        updateObjective('target_on_time', onTimeRate)
      }
    }
  }

  function updateEvacuationProgress() {
    if (selectedTask.value !== 'evacuation') return
    
    const targetArea = evacuationArea.value
    const allTargetPassengers = gameStore.passengers.filter(p => p.destination === targetArea)
    const totalTarget = allTargetPassengers.length
    
    if (totalTarget === 0) {
      updateObjective('evacuation_rate', 100)
      return
    }
    
    const boardedTarget = allTargetPassengers.filter(p => p.status === 'boarded').length
    const rate = Math.round((boardedTarget / totalTarget) * 100)
    updateObjective('evacuation_rate', rate)
    
    const leftBehind = allTargetPassengers.filter(p => p.status !== 'boarded' && p.status !== 'pending').length
    updateObjective('no_left_behind', leftBehind)
    
    const timeLimit = taskConfig.value?.timeLimit || 480
    updateObjective('time_bonus', Math.round(gameStore.gameTime))
    
    if (gameStore.gameTime > timeLimit * 0.8 && rate < 80) {
      addWarning('warning', '疏散进度较慢，请注意时间限制！')
    }
    
    if (gameStore.gameTime > timeLimit && rate < 100) {
      addWarning('danger', '已超过时间限制，任务可能失败！')
    }
  }

  function initializeCounters() {
    if (!selectedTask.value) return

    totalVipPassengers.value = gameStore.passengers.filter(p => p.priority === 'vip').length
    totalDisabledPassengers.value = gameStore.passengers.filter(p => p.priority === 'disabled').length

    if (selectedTask.value === 'priority_protection') {
      updateObjective('vip_boarded_ratio', totalVipPassengers.value > 0 ? 0 : 100)
      updateObjective('disabled_boarded_ratio', totalDisabledPassengers.value > 0 ? 0 : 100)
    }

    if (selectedTask.value === 'evacuation') {
      const targetDestinations = [...new Set(gameStore.passengers.map(p => p.destination))]
      evacuationArea.value = targetDestinations[0] || 'A区'
    }

    if (progress.value) {
      progress.value.startTime = gameStore.gameTime
    }
  }

  function calculateTaskResult(): TaskResult {
    if (!progress.value || !taskConfig.value) {
      return {
        completed: false,
        score: 0,
        maxScore: 100,
        percentage: 0,
        objectives: [],
        mistakes: [],
        suggestions: ['未选择任务或任务数据缺失'],
      }
    }

    let totalScore = 0
    let maxScore = 0

    const finalObjectives = progress.value.objectives.map(obj => {
      maxScore += obj.weight
      
      let objScore = 0
      if (obj.id === 'zero_priority_errors' || obj.id === 'no_left_behind' || obj.id === 'low_empty_count' || obj.id === 'delay_count' || obj.id === 'max_delay') {
        objScore = obj.current <= obj.target ? obj.weight : Math.max(0, obj.weight - (obj.current - obj.target) * 5)
      } else if (obj.id === 'target_wait_time') {
        objScore = obj.current <= obj.target ? obj.weight : Math.max(0, obj.weight - Math.floor((obj.current - obj.target) / 30) * 2)
      } else if (obj.id === 'time_bonus') {
        objScore = obj.current <= obj.target ? obj.weight : Math.max(0, obj.weight - Math.floor((obj.current - obj.target) / 30) * 3)
      } else {
        const ratio = Math.min(1, obj.current / Math.max(1, obj.target))
        objScore = Math.round(obj.weight * ratio)
      }
      
      totalScore += objScore
      
      return {
        ...obj,
        current: obj.current,
      }
    })

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const completed = percentage >= 60

    const suggestions = generateSuggestions(finalObjectives, taskConfig.value)

    return {
      completed,
      score: totalScore,
      maxScore,
      percentage,
      objectives: finalObjectives,
      mistakes: taskMistakes.value,
      suggestions,
    }
  }

  function generateSuggestions(objectives: TaskObjective[], task: MissionTask): string[] {
    const suggestions: string[] = []
    
    for (const obj of objectives) {
      const ratio = obj.current / Math.max(1, obj.target)
      
      if (obj.id === 'zero_priority_errors' && obj.current > 0) {
        suggestions.push(`优先级失误 ${obj.current} 次，建议加强对VIP和残障乘客的关注`)
      }
      if (obj.id === 'vip_boarded_ratio' && ratio < 0.9) {
        suggestions.push(`VIP乘客乘车率仅 ${obj.current}%，建议优先安排VIP乘客上车`)
      }
      if (obj.id === 'disabled_boarded_ratio' && ratio < 0.9) {
        suggestions.push(`残障乘客乘车率仅 ${obj.current}%，建议优先安排残障乘客上车`)
      }
      if (obj.id === 'evacuation_rate' && ratio < 0.9) {
        suggestions.push(`疏散率仅 ${obj.current}%，建议增加目标区域的车辆班次`)
      }
      if (obj.id === 'avg_occupancy' && ratio < 0.85) {
        suggestions.push(`平均载客率仅 ${obj.current}%，建议更好地匹配客流与车辆`)
      }
      if (obj.id === 'on_time_rate' && ratio < 0.95) {
        suggestions.push(`准点发车率仅 ${obj.current}%，建议提前做好发车准备`)
      }
      if (obj.id === 'target_wait_time' && obj.current > obj.target) {
        suggestions.push(`目标区域平均等待时间 ${obj.current} 秒，超过目标 ${obj.target} 秒`)
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('任务完成出色！继续保持良好的调度策略')
      suggestions.push('尝试挑战更高难度的任务吧')
    } else {
      suggestions.push(...task.tips.slice(0, 2))
    }

    return suggestions
  }

  function finalizeTask() {
    if (!progress.value || !selectedTask.value) return null

    if (selectedTask.value === 'evacuation') {
      updateEvacuationProgress()
    }

    progress.value.status = overallProgress.value >= 60 ? 'completed' : 'failed'
    progress.value.completedAt = gameStore.gameTime

    result.value = calculateTaskResult()

    if (result.value.completed) {
      timelineStore.addEvent(
        'task_success',
        `任务完成！得分：${result.value.percentage}%`,
        gameStore.gameTime,
        '任务系统'
      )
    } else {
      timelineStore.addEvent(
        'task_failure',
        `任务未通过，得分：${result.value.percentage}%`,
        gameStore.gameTime,
        '任务系统'
      )
    }

    return result.value
  }

  function resetTask() {
    selectedTask.value = null
    taskConfig.value = null
    progress.value = null
    result.value = null
    resetCounters()
  }

  function getTaskResultForRecord() {
    return {
      taskId: selectedTask.value,
      taskResult: result.value,
    }
  }

  return {
    selectedTask,
    taskConfig,
    progress,
    result,
    isTaskActive,
    overallProgress,
    taskWarnings,
    taskMistakes,
    initializeTask,
    initializeCounters,
    updateObjective,
    addWarning,
    addMistake,
    onPriorityError,
    onPassengerBoard,
    onVehicleDepart,
    updateEvacuationProgress,
    finalizeTask,
    resetTask,
    getTaskResultForRecord,
  }
}
