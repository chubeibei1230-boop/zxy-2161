import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { GameRecord, LevelConfig, TimelineItem } from '@/types'

interface ShuttleGameDB extends DBSchema {
  levels: {
    key: string
    value: LevelConfig
    indexes: { difficulty: number }
  }
  gameRecords: {
    key: string
    value: GameRecord
    indexes: { levelId: string; timestamp: number; score: number }
  }
  timelineEvents: {
    key: string
    value: TimelineItem & { recordId: string }
    indexes: { recordId: string; gameTime: number }
  }
}

const DB_NAME = 'shuttle_game_db'
const DB_VERSION = 1

let db: IDBPDatabase<ShuttleGameDB> | null = null

export async function initDB(): Promise<void> {
  if (db) return

  db = await openDB<ShuttleGameDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('levels')) {
        const levelStore = db.createObjectStore('levels', { keyPath: 'id' })
        levelStore.createIndex('difficulty', 'difficulty', { unique: false })
      }

      if (!db.objectStoreNames.contains('gameRecords')) {
        const recordStore = db.createObjectStore('gameRecords', { keyPath: 'id' })
        recordStore.createIndex('levelId', 'levelId', { unique: false })
        recordStore.createIndex('timestamp', 'timestamp', { unique: false })
        recordStore.createIndex('score', 'score', { unique: false })
      }

      if (!db.objectStoreNames.contains('timelineEvents')) {
        const timelineStore = db.createObjectStore('timelineEvents', { keyPath: 'id' })
        timelineStore.createIndex('recordId', 'recordId', { unique: false })
        timelineStore.createIndex('gameTime', 'gameTime', { unique: false })
      }
    },
  })
}

export async function getDB(): Promise<IDBPDatabase<ShuttleGameDB>> {
  if (!db) {
    await initDB()
  }
  return db!
}

export async function saveLevel(level: LevelConfig): Promise<void> {
  const database = await getDB()
  await database.put('levels', level)
}

export async function getLevel(id: string): Promise<LevelConfig | undefined> {
  const database = await getDB()
  return database.get('levels', id)
}

export async function getAllLevels(): Promise<LevelConfig[]> {
  const database = await getDB()
  return database.getAll('levels')
}

export async function saveGameRecord(record: GameRecord): Promise<void> {
  const database = await getDB()
  await database.put('gameRecords', record)
}

export async function getGameRecords(levelId?: string): Promise<GameRecord[]> {
  const database = await getDB()
  if (levelId) {
    return database.getAllFromIndex('gameRecords', 'levelId', levelId)
  }
  return database.getAll('gameRecords')
}

export async function getBestRecord(levelId: string): Promise<GameRecord | undefined> {
  const records = await getGameRecords(levelId)
  if (records.length === 0) return undefined
  return records.reduce((best, current) => 
    current.score > best.score ? current : best
  )
}

export async function saveTimelineEvents(recordId: string, events: TimelineItem[]): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('timelineEvents', 'readwrite')
  for (const event of events) {
    await tx.store.put({ ...event, recordId })
  }
  await tx.done
}

export async function getTimelineEvents(recordId: string): Promise<TimelineItem[]> {
  const database = await getDB()
  const events = await database.getAllFromIndex('timelineEvents', 'recordId', recordId)
  return events
    .map(({ recordId, ...rest }) => rest)
    .sort((a, b) => a.gameTime - b.gameTime)
}

export async function getGameRecord(id: string): Promise<GameRecord | undefined> {
  const database = await getDB()
  return database.get('gameRecords', id)
}

export async function clearAllData(): Promise<void> {
  const database = await getDB()
  const tx = database.transaction(['levels', 'gameRecords', 'timelineEvents'], 'readwrite')
  await Promise.all([
    tx.objectStore('levels').clear(),
    tx.objectStore('gameRecords').clear(),
    tx.objectStore('timelineEvents').clear(),
  ])
  await tx.done
}
