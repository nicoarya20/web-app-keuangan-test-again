import { useRef, useCallback } from 'react'

/**
 * Idempotency key stabil per "submission logis".
 * - getKey(): bikin key baru kalau belum ada, lalu pakai ulang untuk retry submission yang sama.
 * - reset(): dipanggil setelah submit SUKSES → submission berikutnya dapat key baru.
 *
 * Dikombinasikan dgn flag isSubmitting: mencegah double-click, sekaligus jadi backstop
 * untuk kasus "request sudah masuk tapi response hilang lalu user retry".
 */
export function useIdempotencyKey() {
  const keyRef = useRef<string | null>(null)

  const getKey = useCallback(() => {
    if (!keyRef.current) keyRef.current = crypto.randomUUID()
    return keyRef.current
  }, [])

  const reset = useCallback(() => {
    keyRef.current = null
  }, [])

  return { getKey, reset }
}
