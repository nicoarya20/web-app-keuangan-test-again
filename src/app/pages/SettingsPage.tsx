import React, { useState, useEffect } from 'react'
import { Send, CheckCircle, XCircle, Loader2, ExternalLink, FlaskConical } from 'lucide-react'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import { cn } from '../components/ui/utils'

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined

export const SettingsPage: React.FC = () => {
  const { data: session } = useSession()
  const [chatId, setChatId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    api.user.getById(session.user.id)
      .then((user) => {
        if (user.telegramChatId) {
          setChatId(user.telegramChatId)
          setIsConnected(true)
        }
      })
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleSave = async () => {
    if (!session?.user?.id || !chatId.trim()) return
    setSaving(true)
    try {
      await api.user.updateTelegram(session.user.id, chatId.trim())
      setIsConnected(true)
      showFeedback('success', 'Chat ID berhasil disimpan. Rekap akan dikirim tiap tanggal 1.')
    } catch {
      showFeedback('error', 'Gagal menyimpan. Pastikan Chat ID benar.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!session?.user?.id) return
    setTesting(true)
    try {
      await api.telegram.test(session.user.id)
      showFeedback('success', 'Pesan test terkirim! Cek Telegram kamu.')
    } catch {
      showFeedback('error', 'Gagal kirim test. Pastikan Chat ID benar dan webhook sudah di-register.')
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!session?.user?.id) return
    setSaving(true)
    try {
      await api.user.updateTelegram(session.user.id, '')
      setChatId('')
      setIsConnected(false)
      showFeedback('success', 'Telegram berhasil diputus.')
    } catch {
      showFeedback('error', 'Gagal memutus koneksi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola preferensi dan integrasi akun kamu.</p>
      </div>

      {/* Telegram Recap Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <Send className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Rekap Bulanan Telegram</h2>
            <p className="text-sm text-gray-500">
              Terima ringkasan pengeluaran otomatis setiap tanggal 1.
            </p>
          </div>
          {!loading && (
            <span className={cn(
              'ml-auto text-xs font-medium px-2.5 py-1 rounded-full',
              isConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            )}>
              {isConnected ? 'Terhubung' : 'Belum terhubung'}
            </span>
          )}
        </div>

        {/* Steps */}
        <ol className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 w-4 shrink-0">1.</span>
            <span>
              Buka Telegram, cari bot{' '}
              {BOT_USERNAME ? (
                <a
                  href={`https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 hover:underline inline-flex items-center gap-1"
                >
                  @{BOT_USERNAME} <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="font-medium text-gray-700">bot kamu</span>
              )}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 w-4 shrink-0">2.</span>
            <span>
              Ketik <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">/start</code> dan kirim.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 w-4 shrink-0">3.</span>
            <span>Bot akan membalas dengan <strong>Chat ID</strong> kamu. Copy angkanya.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 w-4 shrink-0">4.</span>
            <span>Paste di kolom di bawah ini, lalu klik <strong>Simpan</strong>.</span>
          </li>
        </ol>

        {/* Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Telegram Chat ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Contoh: 987654321"
              disabled={loading || saving}
              className={cn(
                'flex-1 px-3 py-2 text-sm border rounded-xl outline-none transition-colors',
                'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            <button
              onClick={handleSave}
              disabled={loading || saving || !chatId.trim()}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
                'bg-indigo-600 text-white hover:bg-indigo-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center gap-2'
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan
            </button>
          </div>

          {isConnected && !saving && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleTest}
                disabled={testing}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
                  'bg-sky-50 text-sky-600 hover:bg-sky-100',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {testing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FlaskConical className="w-3.5 h-3.5" />}
                Test Bot
              </button>
              <button
                onClick={handleDisconnect}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                Putus koneksi
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={cn(
            'flex items-center gap-2 text-sm px-4 py-3 rounded-xl',
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          )}>
            {feedback.type === 'success'
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            {feedback.msg}
          </div>
        )}
      </div>
    </div>
  )
}
