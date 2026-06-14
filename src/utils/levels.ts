import type { LevelConfig, Passenger, Vehicle, WaitingArea, EventType, ScheduledEvent } from '@/types'
import { generateId } from './helpers'

function createPassengers(
  count: number,
  destinations: string[],
  vipRatio: number,
  disabledRatio: number,
  startTime: number,
  endTime: number,
  burstMode: boolean = false
): Omit<Passenger, 'status' | 'waitingAreaId' | 'vehicleId' | 'boardTime'>[] {
  const passengers: Omit<Passenger, 'status' | 'waitingAreaId' | 'vehicleId' | 'boardTime'>[] = []
  
  for (let i = 0; i < count; i++) {
    let arrivalTime: number
    if (burstMode) {
      const burstEnd = startTime + (endTime - startTime) * 0.4
      arrivalTime = i < count * 0.7
        ? startTime + Math.random() * (burstEnd - startTime)
        : burstEnd + Math.random() * (endTime - burstEnd)
    } else {
      arrivalTime = startTime + Math.random() * (endTime - startTime)
    }

    const rand = Math.random()
    let priority: Passenger['priority'] = 'normal'
    if (rand < disabledRatio) {
      priority = 'disabled'
    } else if (rand < disabledRatio + vipRatio) {
      priority = 'vip'
    }

    passengers.push({
      id: generateId(),
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      priority,
      arrivalTime: Math.round(arrivalTime),
    })
  }

  return passengers.sort((a, b) => a.arrivalTime - b.arrivalTime)
}

function createVehicles(
  count: number,
  baseCapacity: number,
  destinations: string[],
  interval: number,
  startTime: number,
  variableCapacity: boolean = false,
  multiRoute: boolean = false
): Omit<Vehicle, 'actualDeparture' | 'status' | 'passengers' | 'order'>[] {
  const vehicles: Omit<Vehicle, 'actualDeparture' | 'status' | 'passengers' | 'order'>[] = []
  
  for (let i = 0; i < count; i++) {
    const capacity = variableCapacity 
      ? Math.max(6, Math.round(baseCapacity + (Math.random() - 0.5) * 6))
      : baseCapacity
    
    let destination: string
    if (multiRoute) {
      destination = destinations[i % destinations.length]
    } else {
      destination = destinations[Math.floor(Math.random() * destinations.length)]
    }

    vehicles.push({
      id: generateId(),
      name: `接驳车 ${String.fromCharCode(65 + i)}${i + 1}`,
      capacity,
      originalCapacity: capacity,
      destination,
      scheduledDeparture: startTime + i * interval,
    })
  }

  return vehicles
}

function createWaitingAreas(
  count: number,
  destinations: string[],
  baseCapacity: number
): Omit<WaitingArea, 'passengers'>[] {
  return destinations.slice(0, count).map((dest, i) => ({
    id: generateId(),
    name: `${dest}候车区`,
    capacity: baseCapacity,
    originalCapacity: baseCapacity,
    destination: dest,
  }))
}

function createEventPool(level: number): { type: EventType; weight: number }[] {
  const basePool = [
    { type: 'surge' as EventType, weight: 30 },
    { type: 'delay' as EventType, weight: 25 },
    { type: 'full' as EventType, weight: 25 },
    { type: 'priority_change' as EventType, weight: 20 },
  ]

  if (level >= 3) {
    basePool.find(e => e.type === 'surge')!.weight += 15
    basePool.find(e => e.type === 'priority_change')!.weight += 10
  }

  return basePool
}

function createScheduledEvents(
  level: number,
  duration: number,
  vehicleCount: number,
  destinations: string[]
): ScheduledEvent[] {
  const events: ScheduledEvent[] = []
  const eventCount = Math.floor(duration / 120) - 1

  const eventTypes: EventType[] = ['surge', 'delay', 'full', 'priority_change']
  
  for (let i = 0; i < eventCount; i++) {
    const triggerTime = Math.round(120 + i * (duration / (eventCount + 1)))
    const typeIndex = (i + level) % eventTypes.length
    const type = eventTypes[typeIndex]
    
    const event: ScheduledEvent = {
      triggerTime,
      type,
      data: {},
    }

    switch (type) {
      case 'surge':
        event.data = { count: 2 + level + Math.floor(Math.random() * 2) }
        break
      case 'delay':
        event.data = { 
          vehicleIndex: Math.floor(Math.random() * vehicleCount),
          delaySeconds: (2 + Math.floor(Math.random() * 3)) * 10
        }
        break
      case 'full':
        event.data = { 
          destination: destinations[Math.floor(Math.random() * destinations.length)],
          reduction: 2 + Math.floor(Math.random() * 2)
        }
        break
      case 'priority_change':
        event.data = {
          newPriority: (['normal', 'vip', 'disabled'] as const)[Math.floor(Math.random() * 3)]
        }
        break
    }

    events.push(event)
  }

  return events.sort((a, b) => a.triggerTime - b.triggerTime)
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'level-1',
    name: '入门园区',
    description: '熟悉基本操作，乘客平稳到达，事件较少。',
    difficulty: 1,
    passengerCount: 30,
    vehicleCount: 5,
    waitingAreas: createWaitingAreas(2, ['A区', 'B区'], 12),
    passengers: createPassengers(30, ['A区', 'B区'], 0.1, 0, 0, 600),
    vehicles: createVehicles(5, 8, ['A区', 'B区'], 120, 120),
    eventPool: createEventPool(1),
    eventFrequency: 180,
    scheduledEvents: createScheduledEvents(1, 600, 5, ['A区', 'B区']),
  },
  {
    id: 'level-2',
    name: '早高峰',
    description: '乘客集中到达，候车区容易满员，需要快速响应。',
    difficulty: 2,
    passengerCount: 60,
    vehicleCount: 8,
    waitingAreas: createWaitingAreas(3, ['A区', 'B区', 'C区'], 15),
    passengers: createPassengers(60, ['A区', 'B区', 'C区'], 0.2, 0.05, 0, 720, true),
    vehicles: createVehicles(8, 10, ['A区', 'B区', 'C区'], 90, 90),
    eventPool: createEventPool(2),
    eventFrequency: 120,
    scheduledEvents: createScheduledEvents(2, 720, 8, ['A区', 'B区', 'C区']),
  },
  {
    id: 'level-3',
    name: '多线路调度',
    description: '3条线路同时运营，车辆容量不均，需要精准匹配。',
    difficulty: 3,
    passengerCount: 80,
    vehicleCount: 10,
    waitingAreas: createWaitingAreas(3, ['A区', 'B区', 'C区'], 18),
    passengers: createPassengers(80, ['A区', 'B区', 'C区'], 0.25, 0.08, 0, 900),
    vehicles: createVehicles(10, 9, ['A区', 'B区', 'C区'], 75, 90, true, true),
    eventPool: createEventPool(3),
    eventFrequency: 90,
    scheduledEvents: createScheduledEvents(3, 900, 10, ['A区', 'B区', 'C区']),
  },
  {
    id: 'level-4',
    name: '极端天气',
    description: '车辆容量下降，晚到频繁，大量临时增员，优先级多变。',
    difficulty: 4,
    passengerCount: 100,
    vehicleCount: 12,
    waitingAreas: createWaitingAreas(4, ['A区', 'B区', 'C区', 'D区'], 12),
    passengers: createPassengers(100, ['A区', 'B区', 'C区', 'D区'], 0.3, 0.1, 0, 1200, true),
    vehicles: createVehicles(12, 6, ['A区', 'B区', 'C区', 'D区'], 60, 120, true, true),
    eventPool: createEventPool(4),
    eventFrequency: 60,
    scheduledEvents: createScheduledEvents(4, 1200, 12, ['A区', 'B区', 'C区', 'D区']),
  },
]

export async function initLevels(): Promise<void> {
  const { saveLevel, getLevel } = await import('./idb')
  for (const level of LEVELS) {
    const existing = await getLevel(level.id)
    if (!existing) {
      await saveLevel(level)
    }
  }
}

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id)
}
