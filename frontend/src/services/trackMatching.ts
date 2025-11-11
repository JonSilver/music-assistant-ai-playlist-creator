import { attemptPromise } from '@jfdi/attempt'
import type { MusicAssistantClient } from './musicAssistant'
import type { TrackMatch, TrackSuggestion } from '@shared/types'

export const matchTrack = async (
  suggestion: TrackSuggestion,
  maClient: MusicAssistantClient
): Promise<TrackMatch> => {
  const searchQuery = `${suggestion.title} ${suggestion.artist}`
  const startTime = performance.now()
  console.log(`[${new Date().toISOString()}] [MATCH] Searching: "${searchQuery}"`)

  const trySearch = async (attempt: number): Promise<TrackMatch> => {
    const attemptStart = performance.now()
    const [err, results] = await attemptPromise(async () => maClient.searchTracks(searchQuery, 5))
    const attemptDuration = performance.now() - attemptStart
    const attemptDurationMs = Math.round(attemptDuration)

    if (err !== undefined) {
      console.warn(
        `[${new Date().toISOString()}] [MATCH] Attempt ${attempt}/3 failed after ${attemptDurationMs}ms: ${err.message}`
      )

      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        return trySearch(attempt + 1)
      }

      const totalDuration = performance.now() - startTime
      const totalDurationMs = Math.round(totalDuration)
      console.error(
        `[${new Date().toISOString()}] [MATCH] ❌ Failed after 3 attempts (${totalDurationMs}ms total): "${searchQuery}"`,
        err.message
      )
      return {
        suggestion,
        matched: false
      }
    }

    if (results.length === 0) {
      const totalDuration = performance.now() - startTime
      const totalDurationMs = Math.round(totalDuration)
      console.warn(
        `[${new Date().toISOString()}] [MATCH] ❌ No results after ${totalDurationMs}ms for "${searchQuery}"`
      )
      return {
        suggestion,
        matched: false
      }
    }

    const match = results[0]
    const firstArtist = match.artists?.[0]
    const matchedArtist = firstArtist !== undefined ? firstArtist.name : 'unknown'
    const totalDuration = performance.now() - startTime
    const durationMs = Math.round(totalDuration)
    console.log(
      `[${new Date().toISOString()}] [MATCH] ✓ "${match.name}" by "${matchedArtist}" (${durationMs}ms)`
    )

    return {
      suggestion,
      matched: true,
      maTrack: match
    }
  }

  return trySearch(1)
}

export const matchTracksProgressively = async (
  tracks: TrackMatch[],
  maUrl: string,
  onUpdate: (updater: (prev: TrackMatch[]) => TrackMatch[]) => void,
  onError: (message: string) => void
): Promise<void> => {
  const BATCH_SIZE = 10

  const { MusicAssistantClient } = await import('./musicAssistant')
  const maClient = new MusicAssistantClient(maUrl)

  const [connectErr] = await attemptPromise(async () => maClient.connect())
  if (connectErr !== undefined) {
    onError(`Failed to connect to Music Assistant: ${connectErr.message}`)
    return
  }

  const processBatch = async (batch: TrackMatch[], startIndex: number): Promise<void> => {
    await Promise.all(
      batch.map(async (track, batchIdx) => {
        const index = startIndex + batchIdx
        onUpdate(prev => prev.map((t, idx) => (idx === index ? { ...t, matching: true } : t)))

        const [err, matchedTrack] = await attemptPromise(async () =>
          matchTrack(track.suggestion, maClient)
        )

        if (err === undefined) {
          onUpdate(prev =>
            prev.map((t, idx) => (idx === index ? { ...matchedTrack, matching: false } : t))
          )
        } else {
          onUpdate(prev => prev.map((t, idx) => (idx === index ? { ...t, matching: false } : t)))
        }
      })
    )
  }

  const batches = tracks.reduce<TrackMatch[][]>((acc, track, index) => {
    const batchIndex = Math.floor(index / BATCH_SIZE)
    const currentBatch = acc[batchIndex] ?? []
    const updatedBatch = [...currentBatch, track]
    const updatedBatches = [...acc]
    updatedBatches[batchIndex] = updatedBatch
    return updatedBatches
  }, [])

  await batches.reduce(async (prevPromise, batch, batchNum) => {
    await prevPromise
    await processBatch(batch, batchNum * BATCH_SIZE)
    if (batchNum < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }, Promise.resolve())

  maClient.disconnect()
}
