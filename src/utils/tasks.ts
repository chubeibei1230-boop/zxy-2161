import type { MissionTask, TaskType } from '@/types'

export const MISSION_TASKS: MissionTask[] = [
  {
    id: 'priority_protection',
    name: '优先保障任务',
    description: '确保VIP和残障乘客优先上车，零优先级失误。',
    icon: 'shield',
    difficulty: 2,
    objectives: [
      {
        id: 'zero_priority_errors',
        description: '优先级失误次数',
        target: 0,
        current: 0,
        unit: '次',
        weight: 40,
      },
      {
        id: 'vip_boarded_ratio',
        description: 'VIP乘客乘车率',
        target: 100,
        current: 0,
        unit: '%',
        weight: 30,
      },
      {
        id: 'disabled_boarded_ratio',
        description: '残障乘客乘车率',
        target: 100,
        current: 0,
        unit: '%',
        weight: 30,
      },
    ],
    tips: [
      '时刻关注VIP和残障乘客的状态',
      '将高优先级乘客安排到候车区前排',
      '避免普通乘客占用优先登车位置',
    ],
  },
  {
    id: 'evacuation',
    name: '紧急疏散任务',
    description: '在限定时间内疏散指定区域的所有乘客。',
    icon: 'clock',
    difficulty: 3,
    timeLimit: 480,
    objectives: [
      {
        id: 'evacuation_rate',
        description: '目标区域乘客疏散率',
        target: 100,
        current: 0,
        unit: '%',
        weight: 50,
      },
      {
        id: 'time_bonus',
        description: '完成时间',
        target: 480,
        current: 0,
        unit: '秒',
        weight: 30,
      },
      {
        id: 'no_left_behind',
        description: '遗留乘客数',
        target: 0,
        current: 0,
        unit: '人',
        weight: 20,
      },
    ],
    tips: [
      '优先安排大容量车辆前往目标区域',
      '及时将乘客移入候车区',
      '注意不要让候车区满员',
    ],
  },
  {
    id: 'minimize_empty_seats',
    name: '高效运力任务',
    description: '尽量减少车辆空座率，最大化运力利用率。',
    icon: 'users',
    difficulty: 2,
    objectives: [
      {
        id: 'avg_occupancy',
        description: '平均载客率',
        target: 85,
        current: 0,
        unit: '%',
        weight: 40,
      },
      {
        id: 'full_departure_count',
        description: '满员发车次数',
        target: 5,
        current: 0,
        unit: '次',
        weight: 35,
      },
      {
        id: 'low_empty_count',
        description: '空座>3的发车次数',
        target: 0,
        current: 0,
        unit: '次',
        weight: 25,
      },
    ],
    tips: [
      '合理安排乘客到即将发车的车辆',
      '调整车辆顺序以匹配客流',
      '关注候车区乘客数量变化',
    ],
  },
  {
    id: 'on_time_perfection',
    name: '准点率挑战',
    description: '所有车辆必须准点发车，零延误。',
    icon: 'check-circle',
    difficulty: 1,
    objectives: [
      {
        id: 'on_time_rate',
        description: '准点发车率',
        target: 100,
        current: 0,
        unit: '%',
        weight: 50,
      },
      {
        id: 'max_delay',
        description: '最大延误时间',
        target: 0,
        current: 0,
        unit: '秒',
        weight: 30,
      },
      {
        id: 'delay_count',
        description: '延误车次',
        target: 0,
        current: 0,
        unit: '次',
        weight: 20,
      },
    ],
    tips: [
      '确保候车区在发车前有足够乘客',
      '优先处理即将发车的车辆',
      '避免因调整顺序导致发车延误',
    ],
  },
  {
    id: 'area_specialist',
    name: '区域专家任务',
    description: '专注于单个目的地的乘客调度，达到最高效率。',
    icon: 'map-pin',
    difficulty: 2,
    targetArea: 'A区',
    objectives: [
      {
        id: 'target_boarded',
        description: '目标区域乘客乘车数',
        target: 15,
        current: 0,
        unit: '人',
        weight: 40,
      },
      {
        id: 'target_wait_time',
        description: '目标区域平均等待时间',
        target: 120,
        current: 0,
        unit: '秒',
        weight: 35,
      },
      {
        id: 'target_on_time',
        description: '目标区域车辆准点率',
        target: 100,
        current: 0,
        unit: '%',
        weight: 25,
      },
    ],
    tips: [
      '重点关注目标区域的乘客和车辆',
      '优先将目标区域乘客安排上车',
      '为目标区域调配足够的车辆资源',
    ],
  },
]

export function getTaskById(id: TaskType): MissionTask | undefined {
  return MISSION_TASKS.find(t => t.id === id)
}

export function getTasksForLevel(levelId: string): MissionTask[] {
  const levelNum = parseInt(levelId.split('-')[1]) || 1
  return MISSION_TASKS.filter(t => t.difficulty <= Math.min(levelNum + 1, 3))
}

export const TASK_ICONS: Record<TaskType, string> = {
  priority_protection: '🛡️',
  evacuation: '⏱️',
  minimize_empty_seats: '🚌',
  on_time_perfection: '✅',
  area_specialist: '📍',
}

export const TASK_COLORS: Record<TaskType, string> = {
  priority_protection: 'from-purple-500 to-pink-500',
  evacuation: 'from-red-500 to-orange-500',
  minimize_empty_seats: 'from-emerald-500 to-teal-500',
  on_time_perfection: 'from-blue-500 to-indigo-500',
  area_specialist: 'from-amber-500 to-yellow-500',
}
