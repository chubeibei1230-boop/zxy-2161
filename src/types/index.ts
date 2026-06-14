export type Priority = 'normal' | 'vip' | 'disabled'

export type PassengerStatus = 'pending' | 'arrived' | 'waiting' | 'boarded'

export type VehicleStatus = 'pending' | 'arrived' | 'boarding' | 'departed'

export type GameStatus = 'idle' | 'playing' | 'paused' | 'ended'

export type EventType = 'surge' | 'delay' | 'full' | 'priority_change'

export type TimelineType = 
  | 'passenger_arrive' 
  | 'passenger_move' 
  | 'vehicle_arrive' 
  | 'vehicle_depart' 
  | 'event_trigger' 
  | 'score_change'

export interface Passenger {
  id: string
  destination: string
  priority: Priority
  arrivalTime: number
  status: PassengerStatus
  waitingAreaId?: string
  vehicleId?: string
  boardTime?: number
  originalPriority?: Priority
}

export interface WaitingArea {
  id: string
  name: string
  capacity: number
  originalCapacity: number
  destination: string
  passengers: string[]
}

export interface Vehicle {
  id: string
  name: string
  capacity: number
  originalCapacity: number
  destination: string
  scheduledDeparture: number
  actualDeparture?: number
  status: VehicleStatus
  passengers: string[]
  order: number
}

export interface GameEvent {
  id: string
  type: EventType
  triggerTime: number
  description: string
  data: Record<string, any>
  resolved: boolean
  expirationTime?: number
}

export interface TimelineItem {
  id: string
  gameTime: number
  type: TimelineType
  description: string
  action?: string
  pointChange?: number
}

export interface DeductionItem {
  id: string
  type: string
  description: string
  points: number
  gameTime: number
}

export interface Score {
  onTimeDeparture: number
  passengerWait: number
  capacityConflict: number
  prioritySatisfaction: number
  total: number
  stars: number
  deductions: DeductionItem[]
}

export interface ScheduledEvent {
  triggerTime: number
  type: EventType
  data?: Record<string, any>
}

export interface LevelConfig {
  id: string
  name: string
  description: string
  difficulty: number
  passengerCount: number
  vehicleCount: number
  waitingAreas: Omit<WaitingArea, 'passengers'>[]
  passengers: Omit<Passenger, 'status' | 'waitingAreaId' | 'vehicleId' | 'boardTime'>[]
  vehicles: Omit<Vehicle, 'actualDeparture' | 'status' | 'passengers' | 'order'>[]
  eventPool: { type: EventType; weight: number }[]
  eventFrequency: number
  scheduledEvents: ScheduledEvent[]
}

export interface GameRecord {
  id: string
  levelId: string
  timestamp: number
  score: number
  stars: number
  playTime: number
  scoreBreakdown: Omit<Score, 'deductions'>
}

export interface DragData {
  type: 'passenger' | 'vehicle'
  id: string
  sourceAreaId?: string
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  disabled: 3,
  vip: 2,
  normal: 1,
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  disabled: '残障人士',
  vip: 'VIP',
  normal: '普通',
}

export const DESTINATIONS = ['A区', 'B区', 'C区', 'D区']
