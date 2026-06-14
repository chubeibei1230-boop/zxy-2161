import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Passenger, 
  WaitingArea, 
  Vehicle, 
  GameEvent, 
  GameStatus,
  LevelConfig,
  GameRecord
} from '@/types'
import { generateId } from '@/utils/helpers'
import { getLevelById } from '@/utils/levels'
import { useScoreStore } from './scoreStore'
import { useTimelineStore } from './timelineStore'

export const useGameStore = defineStore('game', () => {
  const scoreStore = useScoreStore()
  const timelineStore = useTimelineStore()

  const levelId = ref<string | null>(null)
  const levelConfig = ref<LevelConfig | null>(null)
  const gameTime = ref(0)
  const isPaused = ref(false)
  const speed = ref(1)
  const status = ref<GameStatus>('idle')
  const congestionRisk = ref(0)
  const lastEventTime = ref(0)

  const passengers = ref<Passenger[]>([])
  const waitingAreas = ref<WaitingArea[]>([])
  const vehicles = ref<Vehicle[]>([])
  const activeEvents = ref<GameEvent[]>([])

  const arrivedPassengers = computed(() => 
    passengers.value.filter(p => p.status === 'arrived')
  )

  const pendingPassengers = computed(() => 
    passengers.value.filter(p => p.status === 'pending')
  )

  const sortedVehicles = computed(() => 
    [...vehicles.value].sort((a, b) => {
      if (a.status === 'departed' && b.status !== 'departed') return 1
      if (a.status !== 'departed' && b.status === 'departed') return -1
      return a.order - b.order
    })
  )

  const activeNonDepartedVehicles = computed(() =>
    vehicles.value.filter(v => v.status !== 'departed')
  )

  const allVehiclesDeparted = computed(() =>
    vehicles.value.length > 0 && vehicles.value.every(v => v.status === 'departed')
  )

  const allPassengersProcessed = computed(() =>
    passengers.value.every(p => p.status === 'boarded' || p.status === 'pending')
  )

  function startGame(level: string) {
    const config = getLevelById(level)
    if (!config) throw new Error(`Level ${level} not found`)

    levelId.value = level
    levelConfig.value = config
    gameTime.value = 0
    isPaused.value = false
    speed.value = 1
    status.value = 'playing'
    congestionRisk.value = 0
    lastEventTime.value = 0

    passengers.value = config.passengers.map(p => ({
      ...p,
      status: 'pending' as const,
    }))

    waitingAreas.value = config.waitingAreas.map(area => ({
      ...area,
      passengers: [],
    }))

    vehicles.value = config.vehicles.map((v, i) => ({
      ...v,
      status: 'pending' as const,
      passengers: [],
      order: i,
    }))

    activeEvents.value = []

    scoreStore.resetScore()
    timelineStore.clearEvents()

    timelineStore.addEvent('event_trigger', `关卡开始：${config.name}`, 0)
  }

  function pauseGame() {
    if (status.value === 'playing') {
      isPaused.value = true
      status.value = 'paused'
    }
  }

  function resumeGame() {
    if (status.value === 'paused') {
      isPaused.value = false
      status.value = 'playing'
    }
  }

  function setSpeed(newSpeed: number) {
    speed.value = Math.max(0.5, Math.min(3, newSpeed))
  }

  function movePassengerToArea(passengerId: string, areaId: string): boolean {
    const passenger = passengers.value.find(p => p.id === passengerId)
    const area = waitingAreas.value.find(a => a.id === areaId)

    if (!passenger || !area) return false
    if (passenger.status !== 'arrived') return false
    if (passenger.destination !== area.destination) return false
    if (area.passengers.length >= area.capacity) return false

    if (passenger.waitingAreaId) {
      const oldArea = waitingAreas.value.find(a => a.id === passenger.waitingAreaId)
      if (oldArea) {
        oldArea.passengers = oldArea.passengers.filter(id => id !== passengerId)
      }
    }

    passenger.status = 'waiting'
    passenger.waitingAreaId = areaId
    area.passengers.push(passengerId)

    timelineStore.addEvent(
      'passenger_move',
      `乘客 ${passengerId.slice(0, 6)} 移动到 ${area.name}`,
      gameTime.value,
      `拖拽操作`
    )

    updateCongestionRisk()
    return true
  }

  function removePassengerFromArea(passengerId: string): boolean {
    const passenger = passengers.value.find(p => p.id === passengerId)
    if (!passenger || passenger.status !== 'waiting') return false

    const area = waitingAreas.value.find(a => a.id === passenger.waitingAreaId)
    if (area) {
      area.passengers = area.passengers.filter(id => id !== passengerId)
    }

    passenger.status = 'arrived'
    passenger.waitingAreaId = undefined

    updateCongestionRisk()
    return true
  }

  function reorderVehicle(vehicleId: string, newOrder: number) {
    const vehicle = vehicles.value.find(v => v.id === vehicleId)
    if (!vehicle || vehicle.status === 'departed') return

    const oldOrder = vehicle.order
    const sorted = [...vehicles.value]
      .filter(v => v.status !== 'departed')
      .sort((a, b) => a.order - b.order)

    sorted.splice(oldOrder, 1)
    const targetIndex = Math.min(Math.max(0, newOrder), sorted.length)
    sorted.splice(targetIndex, 0, vehicle)

    sorted.forEach((v, i) => {
      v.order = i
    })

    timelineStore.addEvent(
      'passenger_move',
      `调整 ${vehicle.name} 发车顺序为第 ${targetIndex + 1} 位`,
      gameTime.value,
      `车辆排序`
    )
  }

  function addPassenger(passenger: Omit<Passenger, 'status' | 'waitingAreaId' | 'vehicleId' | 'boardTime'>) {
    passengers.value.push({
      ...passenger,
      status: 'arrived',
    })
    updateCongestionRisk()
  }

  function updateCongestionRisk() {
    const totalCapacity = waitingAreas.value.reduce((sum, a) => sum + a.capacity, 0)
    const totalWaiting = waitingAreas.value.reduce((sum, a) => sum + a.passengers.length, 0)
    const arrivingSoon = passengers.value.filter(
      p => p.status === 'pending' && p.arrivalTime <= gameTime.value + 30
    ).length

    congestionRisk.value = Math.min(100, 
      ((totalWaiting + arrivingSoon) / Math.max(1, totalCapacity)) * 100
    )
  }

  function triggerEvent(event: Omit<GameEvent, 'id' | 'resolved'>) {
    activeEvents.value.push({
      ...event,
      id: generateId(),
      resolved: false,
    })
  }

  function resolveEvent(eventId: string) {
    const event = activeEvents.value.find(e => e.id === eventId)
    if (event) {
      event.resolved = true
    }
  }

  function updateGameTime(delta: number) {
    if (status.value !== 'playing' || isPaused.value) return
    gameTime.value += delta * speed.value
    updateCongestionRisk()
  }

  function endGame(): GameRecord {
    status.value = 'ended'

    const record: GameRecord = {
      id: generateId(),
      levelId: levelId.value!,
      timestamp: Date.now(),
      score: scoreStore.total,
      stars: scoreStore.stars,
      playTime: gameTime.value,
      scoreBreakdown: scoreStore.getScoreBreakdown(),
    }

    return record
  }

  function resetGame() {
    levelId.value = null
    levelConfig.value = null
    gameTime.value = 0
    isPaused.value = false
    speed.value = 1
    status.value = 'idle'
    congestionRisk.value = 0
    lastEventTime.value = 0
    passengers.value = []
    waitingAreas.value = []
    vehicles.value = []
    activeEvents.value = []
    scoreStore.resetScore()
    timelineStore.clearEvents()
  }

  function getPassengerById(id: string): Passenger | undefined {
    return passengers.value.find(p => p.id === id)
  }

  function getWaitingAreaById(id: string): WaitingArea | undefined {
    return waitingAreas.value.find(a => a.id === id)
  }

  function getVehicleById(id: string): Vehicle | undefined {
    return vehicles.value.find(v => v.id === id)
  }

  return {
    levelId,
    levelConfig,
    gameTime,
    isPaused,
    speed,
    status,
    congestionRisk,
    lastEventTime,
    passengers,
    waitingAreas,
    vehicles,
    activeEvents,
    arrivedPassengers,
    pendingPassengers,
    sortedVehicles,
    activeNonDepartedVehicles,
    allVehiclesDeparted,
    allPassengersProcessed,
    startGame,
    pauseGame,
    resumeGame,
    setSpeed,
    movePassengerToArea,
    removePassengerFromArea,
    reorderVehicle,
    addPassenger,
    triggerEvent,
    resolveEvent,
    updateGameTime,
    endGame,
    resetGame,
    updateCongestionRisk,
    getPassengerById,
    getWaitingAreaById,
    getVehicleById,
  }
})
