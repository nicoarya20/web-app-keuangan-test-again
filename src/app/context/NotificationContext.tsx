import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, type Notification } from '../../lib/api'
import { useSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAllRead: () => Promise<void>
  markRead: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAllRead: async () => {},
  markRead: async () => {},
  refetch: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const tokenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.notifications.list()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  const teardownRealtime = useCallback(async () => {
    if (tokenTimerRef.current) {
      clearTimeout(tokenTimerRef.current)
      tokenTimerRef.current = null
    }
    if (channelRef.current && supabase) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const setupRealtime = useCallback(async (userId: string) => {
    if (!supabase) return // env belum diisi, REST fallback cukup

    await teardownRealtime()

    try {
      const { token } = await api.notifications.token()
      await supabase.realtime.setAuth(token)

      channelRef.current = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `userId=eq.${userId}`,
          },
          (payload: any) => {
            const n = payload.new as Notification
            setNotifications((prev) => [n, ...prev.slice(0, 49)])
            setUnreadCount((prev) => prev + 1)
          }
        )
        .subscribe()

      // Refresh token 5 menit sebelum expired (JWT 1h → refresh di menit ke-55)
      tokenTimerRef.current = setTimeout(() => setupRealtime(userId), 55 * 60 * 1000)
    } catch {
      // SUPABASE_JWT_SECRET belum diisi atau error jaringan — REST fallback tetap aktif
    }
  }, [teardownRealtime])

  // Mount: fetch + setup realtime saat session siap
  useEffect(() => {
    if (!session?.user?.id) return

    fetchNotifications()
    setupRealtime(session.user.id)

    return () => {
      teardownRealtime()
    }
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on window focus sebagai fallback near-realtime
  useEffect(() => {
    const onFocus = () => {
      if (session?.user?.id) fetchNotifications()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchNotifications, session?.user?.id])

  const markAllRead = useCallback(async () => {
    try {
      await api.notifications.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    try {
      await api.notifications.markRead(id)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAllRead, markRead, refetch: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
