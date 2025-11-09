import { attempt as jfdiAttempt } from '@jfdi/attempt'

interface SuccessResult<T> {
  ok: true
  value: T
}

interface ErrorResult {
  ok: false
  error: Error
}

export type Result<T> = SuccessResult<T> | ErrorResult

export const attempt = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  const result = await jfdiAttempt(fn)

  if (result.ok === true) {
    return {
      ok: true,
      value: result.value as T
    }
  }

  const err = result.error
  return {
    ok: false,
    error: err instanceof Error ? err : new Error(String(err))
  }
}
