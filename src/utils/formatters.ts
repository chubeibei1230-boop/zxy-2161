import type { Priority } from '@/types'
import { PRIORITY_LABELS } from '@/types'

export function formatPriority(priority: Priority): string {
  return PRIORITY_LABELS[priority]
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'disabled':
      return 'text-rose-600 bg-rose-50 border-rose-200'
    case 'vip':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'normal':
      return 'text-slate-600 bg-slate-50 border-slate-200'
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200'
  }
}

export function getPriorityIcon(priority: Priority): string {
  switch (priority) {
    case 'disabled':
      return 'accessibility'
    case 'vip':
      return 'crown'
    case 'normal':
      return 'user'
    default:
      return 'user'
  }
}

export function getDestinationColor(destination: string): string {
  const colors: Record<string, string> = {
    'A区': 'text-blue-600 bg-blue-50 border-blue-200',
    'B区': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'C区': 'text-purple-600 bg-purple-50 border-purple-200',
    'D区': 'text-orange-600 bg-orange-50 border-orange-200',
  }
  return colors[destination] || 'text-slate-600 bg-slate-50 border-slate-200'
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-rose-600'
}
