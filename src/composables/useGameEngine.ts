import { ref, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useScoreStore } from '@/stores/scoreStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { useEventSystem } from './useEventSystem'
import { saveGameRecord, saveTimelineEvents } from '@/utils/idb'
import { PRIORITY_ORDER } from '@/types'

export function useGameEngine() {
  const route = useRoute()
  const router = useRouter()
  const gameStore = useGameStore()
  const scoreStore = useScoreStore()
  const timelineStore = useTimelineStore()
  const eventSystem = useEventSystem()

  const animationId = ref<number | null>(null)
  const lastTimestamp = ref<number>(0)
  const recordId = ref<string | null>(null)

  function startLevel(levelId: string) {
    gameStore.startGame(levelId)
    lastTimestamp.value = performance.now()
    startGameLoop()
  }

  function startGameLoop() {
    function loop(timestamp: number) {
      if (gameStore.status !== 'playing' && gameStore.status !== 'paused') {
        return
      }

      if (!gameStore.isPaused) {
        const delta = (timestamp - lastTimestamp.value) / 1000
        if (delta > 0 && delta < 1) {
          gameStore.updateGameTime(delta)
          updatePassengerStatus()
          updateVehicleStatus()
          checkGameEvents()
          checkGameEnd()
        }
      }

      lastTimestamp.value = timestamp
      animationId.value = requestAnimationFrame(loop)
    }

    animationId.value = requestAnimationFrame(loop)
  }

  function stopGameLoop() {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
      animationId.value = null
    }
  }

  function updatePassengerStatus() {
    gameStore.passengers.forEach(p => {
      if (p.status === 'pending' && p.arrivalTime <= gameStore.gameTime) {
        p.status = 'arrived'
        timelineStore.addEvent(
          'passenger_arrive',
          `乘客 ${p.id.slice(0, 6)} 到达，目的地：${p.destination}`,
          gameStore.gameTime
        )
      }
    })

    checkWaitingPassengers()
  }

  function checkWaitingPassengers() {
    gameStore.passengers.forEach(p => {
      if (p.status === 'arrived' || p.status === 'waiting') {
        const waitTime = gameStore.gameTime - p.arrivalTime
        if (waitTime > 180 && Math.floor(waitTime) % 30 === 0) {
          const deduction = Math.floor((waitTime - 180) / 30) + 1
          scoreStore.addDeduction(
            'long_wait',
            `乘客 ${p.id.slice(0, 6)} 等待时间过长（${Math.floor(waitTime / 60)}分钟）`,
            deduction,
            gameStore.gameTime,
            'wait'
          )
        }
      }
    })
  }

  function updateVehicleStatus() {
    gameStore.vehicles.forEach(v => {
      if (v.status === 'pending' && v.scheduledDeparture - 30 <= gameStore.gameTime) {
        v.status = 'arrived'
        timelineStore.addEvent(
          'vehicle_arrive',
          `车辆 ${v.name} 到达，目的地：${v.destination}，容量：${v.capacity}`,
          gameStore.gameTime
        )
      }

      if (v.status === 'arrived' && shouldStartBoarding(v)) {
        startBoarding(v)
      }

      if (v.status === 'boarding' && shouldDepart(v)) {
        departVehicle(v)
      }
    })
  }

  function shouldStartBoarding(vehicle: typeof gameStore.vehicles[0]): boolean {
    return gameStore.gameTime >= vehicle.scheduledDeparture - 10
  }

  function shouldDepart(vehicle: typeof gameStore.vehicles[0]): boolean {
    if (vehicle.status !== 'boarding') return false

    const timePassed = gameStore.gameTime - vehicle.scheduledDeparture
    const isFull = vehicle.passengers.length >= vehicle.capacity
    const isOverdue = timePassed >= 60
    const hasWaitingPassengers = gameStore.waitingAreas.some(
      a => a.destination === vehicle.destination && a.passengers.length > 0
    )

    return (isFull && timePassed >= 0) || isOverdue || (timePassed >= 0 && !hasWaitingPassengers)
  }

  function startBoarding(vehicle: typeof gameStore.vehicles[0]) {
    vehicle.status = 'boarding'
    timelineStore.addEvent(
      'event_trigger',
      `车辆 ${vehicle.name} 开始登车`,
      gameStore.gameTime,
      '系统处理'
    )

    const area = gameStore.waitingAreas.find(a => a.destination === vehicle.destination)
    if (!area) return

    const passengersToBoard = area.passengers
      .map(id => gameStore.getPassengerById(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])

    let boardedCount = 0
    let priorityErrorCount = 0

    for (let i = 0; i < passengersToBoard.length; i++) {
      if (vehicle.passengers.length >= vehicle.capacity) break

      const passenger = passengersToBoard[i]
      const expectedPosition = passengersToBoard.findIndex(
        p => PRIORITY_ORDER[p.priority] > PRIORITY_ORDER[passenger.priority]
      )

      if (i > expectedPosition && expectedPosition >= 0) {
        priorityErrorCount++
      }

      passenger.status = 'boarded'
      passenger.vehicleId = vehicle.id
      passenger.boardTime = gameStore.gameTime
      vehicle.passengers.push(passenger.id)
      area.passengers = area.passengers.filter(id => id !== passenger.id)
      passenger.waitingAreaId = undefined
      boardedCount++

      const waitTime = gameStore.gameTime - passenger.arrivalTime
      if (waitTime > 180) {
        scoreStore.addDeduction(
          'passenger_wait',
          `乘客 ${passenger.id.slice(0, 6)} 等待 ${Math.floor(waitTime)} 秒后上车`,
          Math.floor((waitTime - 180) / 60),
          gameStore.gameTime,
          'wait'
        )
      }
    }

    if (priorityErrorCount > 0) {
      scoreStore.addDeduction(
        'priority_order',
        `${priorityErrorCount} 名乘客登车顺序不符合优先级`,
        priorityErrorCount * 3,
        gameStore.gameTime,
        'priority'
      )
    }

    timelineStore.addEvent(
      'passenger_move',
      `${boardedCount} 名乘客登上 ${vehicle.name}`,
      gameStore.gameTime,
      '自动登车'
    )
  }

  function departVehicle(vehicle: typeof gameStore.vehicles[0]) {
    vehicle.status = 'departed'
    vehicle.actualDeparture = gameStore.gameTime

    const delay = Math.max(0, gameStore.gameTime - vehicle.scheduledDeparture)
    if (delay > 0) {
      const deduction = Math.floor(delay / 10) * 2
      if (deduction > 0) {
        scoreStore.addDeduction(
          'late_departure',
          `车辆 ${vehicle.name} 晚点 ${Math.floor(delay)} 秒发车`,
          deduction,
          gameStore.gameTime,
          'onTime'
        )
      }
    }

    const remaining = vehicle.capacity - vehicle.passengers.length
    if (remaining > 0) {
      const area = gameStore.waitingAreas.find(a => a.destination === vehicle.destination)
      if (area && area.passengers.length > 0) {
        scoreStore.addDeduction(
          'empty_seats',
          `车辆 ${vehicle.name} 发车时还有 ${remaining} 个空位，但 ${area.passengers.length} 人未上车`,
          remaining * 2,
          gameStore.gameTime,
          'conflict'
        )
      }
    }

    timelineStore.addEvent(
      'vehicle_depart',
      `车辆 ${vehicle.name} 发车，载客 ${vehicle.passengers.length}/${vehicle.capacity} 人`,
      gameStore.gameTime,
      delay > 0 ? `晚点 ${Math.floor(delay)} 秒` : '准点'
    )

    gameStore.updateCongestionRisk()
  }

  function checkGameEvents() {
    eventSystem.cleanupExpiredEvents()
    if (eventSystem.checkShouldTriggerEvent()) {
      eventSystem.triggerRandomEvent()
    }
  }

  function checkGameEnd() {
    const allVehiclesDeparted = gameStore.vehicles.every(v => v.status === 'departed')
    const noMoreArrivals = gameStore.passengers.every(
      p => p.status !== 'pending' || p.arrivalTime > gameStore.gameTime + 120
    )

    if (allVehiclesDeparted && (noMoreArrivals || gameStore.passengers.every(p => p.status === 'boarded'))) {
      endGame()
    }
  }

  async function endGame() {
    stopGameLoop()
    
    const remainingPassengers = gameStore.passengers.filter(
      p => p.status !== 'boarded' && p.status !== 'pending'
    )
    if (remainingPassengers.length > 0) {
      scoreStore.addDeduction(
        'passengers_left',
        `${remainingPassengers.length} 名乘客未能乘车`,
        remainingPassengers.length * 10,
        gameStore.gameTime,
        'conflict'
      )
    }

    const record = gameStore.endGame()
    recordId.value = record.id

    try {
      await saveGameRecord(record)
      await saveTimelineEvents(record.id, timelineStore.getAllEvents())
    } catch (error) {
      console.error('Failed to save game record:', error)
    }

    router.push(`/settlement/${record.id}`)
  }

  function togglePause() {
    if (gameStore.isPaused) {
      gameStore.resumeGame()
      lastTimestamp.value = performance.now()
    } else {
      gameStore.pauseGame()
    }
  }

  function setSpeed(speed: number) {
    gameStore.setSpeed(speed)
  }

  function quitGame() {
    stopGameLoop()
    gameStore.resetGame()
    router.push('/')
  }

  watch(() => route.params.levelId, (newLevelId) => {
    if (newLevelId && typeof newLevelId === 'string') {
      startLevel(newLevelId)
    }
  }, { immediate: true })

  onUnmounted(() => {
    stopGameLoop()
  })

  return {
    recordId,
    startLevel,
    togglePause,
    setSpeed,
    quitGame,
    endGame,
  }
}
