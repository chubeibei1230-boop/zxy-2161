import type { EventType, GameEvent, Priority, ScheduledEvent } from '@/types'
import { generateId, weightedRandom } from '@/utils/helpers'
import { useGameStore } from '@/stores/gameStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { useScoreStore } from '@/stores/scoreStore'

const EVENT_DESCRIPTIONS: Record<EventType, (data: Record<string, any>) => string> = {
  surge: (data) => `临时增员：${data.count} 名乘客立即到达`,
  delay: (data) => `车辆晚到：${data.vehicleName} 晚点 ${data.delaySeconds} 秒`,
  full: (data) => `候车区满员：${data.areaName} 容量减少 ${data.reduction}`,
  priority_change: (data) => `优先级变更：乘客 ${data.passengerId.slice(0, 6)} 变更为 ${data.newPriority}`,
}

export function useEventSystem() {
  const gameStore = useGameStore()
  const timelineStore = useTimelineStore()
  const scoreStore = useScoreStore()

  function triggerRandomEvent() {
    if (!gameStore.levelConfig) return

    const eventType = weightedRandom(gameStore.levelConfig.eventPool)
    const event = createEvent(eventType.type)
    if (!event) return

    gameStore.triggerEvent(event)
    timelineStore.addEvent(
      'event_trigger',
      event.description,
      gameStore.gameTime,
      '事件触发',
      -5
    )

    applyEventEffect(event)
    gameStore.lastEventTime = gameStore.gameTime
  }

  function createEvent(type: EventType): Omit<GameEvent, 'id' | 'resolved'> | null {
    if (!gameStore.levelConfig) return null

    const data: Record<string, any> = {}
    let description = ''

    switch (type) {
      case 'surge': {
        const count = Math.floor(Math.random() * 3) + 2
        data.count = count
        description = EVENT_DESCRIPTIONS.surge(data)
        break
      }
      case 'delay': {
        const pendingVehicles = gameStore.vehicles.filter(v => v.status === 'pending')
        if (pendingVehicles.length === 0) return null
        const vehicle = pendingVehicles[Math.floor(Math.random() * pendingVehicles.length)]
        const delaySeconds = (Math.floor(Math.random() * 3) + 2) * 10
        data.vehicleId = vehicle.id
        data.vehicleName = vehicle.name
        data.delaySeconds = delaySeconds
        description = EVENT_DESCRIPTIONS.delay(data)
        break
      }
      case 'full': {
        const areas = gameStore.waitingAreas.filter(a => a.passengers.length > 0)
        if (areas.length === 0) return null
        const area = areas[Math.floor(Math.random() * areas.length)]
        const reduction = Math.min(3, Math.floor(area.capacity * 0.3))
        if (reduction <= 0) return null
        data.areaId = area.id
        data.areaName = area.name
        data.reduction = reduction
        description = EVENT_DESCRIPTIONS.full(data)
        break
      }
      case 'priority_change': {
        const arrivedPassengers = gameStore.passengers.filter(
          p => p.status === 'arrived' || p.status === 'waiting'
        )
        if (arrivedPassengers.length === 0) return null
        const passenger = arrivedPassengers[Math.floor(Math.random() * arrivedPassengers.length)]
        const priorities: Priority[] = ['normal', 'vip', 'disabled']
        const otherPriorities = priorities.filter(p => p !== passenger.priority)
        const newPriority = otherPriorities[Math.floor(Math.random() * otherPriorities.length)]
        data.passengerId = passenger.id
        data.oldPriority = passenger.priority
        data.newPriority = newPriority
        description = EVENT_DESCRIPTIONS.priority_change(data)
        break
      }
    }

    return {
      type,
      triggerTime: gameStore.gameTime,
      description,
      data,
      expirationTime: gameStore.gameTime + 60,
    }
  }

  function applyEventEffect(event: Omit<GameEvent, 'id' | 'resolved'>) {
    switch (event.type) {
      case 'surge':
        handleSurge(event.data)
        break
      case 'delay':
        handleDelay(event.data)
        break
      case 'full':
        handleFull(event.data)
        break
      case 'priority_change':
        handlePriorityChange(event.data)
        break
    }
  }

  function handleSurge(data: Record<string, any>) {
    const destinations = gameStore.levelConfig?.waitingAreas.map(a => a.destination) || ['A区']
    for (let i = 0; i < data.count; i++) {
      const rand = Math.random()
      let priority: Priority = 'normal'
      if (rand < 0.1) priority = 'disabled'
      else if (rand < 0.3) priority = 'vip'

      gameStore.addPassenger({
        id: generateId(),
        destination: destinations[Math.floor(Math.random() * destinations.length)],
        priority,
        arrivalTime: gameStore.gameTime,
      })
    }
    scoreStore.addDeduction(
      'event_surge',
      `临时增员 ${data.count} 人`,
      5,
      gameStore.gameTime,
      'conflict'
    )
  }

  function handleDelay(data: Record<string, any>) {
    const vehicle = gameStore.getVehicleById(data.vehicleId)
    if (vehicle) {
      vehicle.scheduledDeparture += data.delaySeconds
      timelineStore.addEvent(
        'event_trigger',
        `${vehicle.name} 发车时间延后至 ${Math.round(vehicle.scheduledDeparture)} 秒`,
        gameStore.gameTime,
        '系统处理'
      )
    }
    scoreStore.addDeduction(
      'event_delay',
      `车辆 ${data.vehicleName} 晚点`,
      3,
      gameStore.gameTime,
      'onTime'
    )
  }

  function handleFull(data: Record<string, any>) {
    const area = gameStore.getWaitingAreaById(data.areaId)
    if (area) {
      area.capacity = Math.max(
        area.passengers.length,
        area.capacity - data.reduction
      )
      const overflow = area.passengers.length - area.capacity
      if (overflow > 0) {
        const toRemove = area.passengers.splice(area.capacity, overflow)
        toRemove.forEach(pId => {
          const passenger = gameStore.getPassengerById(pId)
          if (passenger) {
            passenger.status = 'arrived'
            passenger.waitingAreaId = undefined
          }
        })
        scoreStore.addDeduction(
          'capacity_overflow',
          `${area.name} 容量不足，${overflow} 人被移出`,
          overflow * 5,
          gameStore.gameTime,
          'conflict'
        )
      }
    }
    scoreStore.addDeduction(
      'event_full',
      `${data.areaName} 容量减少 ${data.reduction}`,
      5,
      gameStore.gameTime,
      'conflict'
    )
  }

  function handlePriorityChange(data: Record<string, any>) {
    const passenger = gameStore.getPassengerById(data.passengerId)
    if (passenger) {
      passenger.originalPriority = passenger.originalPriority || passenger.priority
      passenger.priority = data.newPriority
    }
  }

  function checkShouldTriggerEvent(): boolean {
    if (!gameStore.levelConfig) return false
    if (gameStore.status !== 'playing') return false
    if (gameStore.isPaused) return false

    const timeSinceLastEvent = gameStore.gameTime - gameStore.lastEventTime
    return timeSinceLastEvent >= gameStore.levelConfig.eventFrequency
  }

  function cleanupExpiredEvents() {
    gameStore.activeEvents = gameStore.activeEvents.filter(
      e => !e.expirationTime || e.expirationTime > gameStore.gameTime
    )
  }

  function triggerScheduledEvent(scheduled: ScheduledEvent) {
    const data = { ...(scheduled.data || {}) }
    let description = ''

    switch (scheduled.type) {
      case 'surge': {
        if (!data.count) data.count = 3
        description = EVENT_DESCRIPTIONS.surge(data)
        break
      }
      case 'delay': {
        const pendingVehicles = gameStore.vehicles.filter(v => v.status === 'pending')
        if (pendingVehicles.length === 0) return
        
        let vehicle
        if (data.vehicleIndex !== undefined) {
          vehicle = pendingVehicles[data.vehicleIndex % pendingVehicles.length]
        } else {
          vehicle = pendingVehicles[Math.floor(Math.random() * pendingVehicles.length)]
        }
        if (!data.delaySeconds) data.delaySeconds = 30
        data.vehicleId = vehicle.id
        data.vehicleName = vehicle.name
        description = EVENT_DESCRIPTIONS.delay(data)
        break
      }
      case 'full': {
        let areas = gameStore.waitingAreas
        if (data.destination) {
          areas = areas.filter(a => a.destination === data.destination)
        }
        if (areas.length === 0) return
        
        const area = areas[Math.floor(Math.random() * areas.length)]
        if (!data.reduction) data.reduction = 3
        data.areaId = area.id
        data.areaName = area.name
        description = EVENT_DESCRIPTIONS.full(data)
        break
      }
      case 'priority_change': {
        const arrivedPassengers = gameStore.passengers.filter(
          p => p.status === 'arrived' || p.status === 'waiting'
        )
        if (arrivedPassengers.length === 0) return
        
        const passenger = arrivedPassengers[Math.floor(Math.random() * arrivedPassengers.length)]
        if (!data.newPriority) data.newPriority = 'vip'
        data.passengerId = passenger.id
        data.oldPriority = passenger.priority
        description = EVENT_DESCRIPTIONS.priority_change(data)
        break
      }
    }

    const event: Omit<GameEvent, 'id' | 'resolved'> = {
      type: scheduled.type,
      triggerTime: gameStore.gameTime,
      description,
      data,
      expirationTime: gameStore.gameTime + 60,
    }

    gameStore.triggerEvent(event)
    timelineStore.addEvent(
      'event_trigger',
      description,
      gameStore.gameTime,
      '事件触发',
      -5
    )

    applyEventEffect(event)
    gameStore.lastEventTime = gameStore.gameTime
  }

  function checkAndTriggerScheduledEvents() {
    const dueEvents = gameStore.getDueScheduledEvents()
    dueEvents.forEach(event => triggerScheduledEvent(event))
    return dueEvents.length > 0
  }

  return {
    triggerRandomEvent,
    triggerScheduledEvent,
    checkAndTriggerScheduledEvents,
    checkShouldTriggerEvent,
    cleanupExpiredEvents,
  }
}
