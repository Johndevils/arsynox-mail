'use client'

import { useState, useEffect, useRef } from 'react'
import { Copy, RotateCw, RefreshCw, Mail, Inbox } from 'lucide-react'
import { toast } from 'sonner'

interface Account {
  id: string
  address: string
}

interface Message {
  id: string
  from: {
    address: string
    name?: string
  }
  subject: string
  intro: string
  createdAt: string
  seen: boolean
}

interface MessageDetail {
  id: string
  from: {
    address: string
    name?: string
  }
  to: {
    address: string
  }
  subject: string
  createdAt: string
  html?: string[]
  text?: string
  seen: boolean
}

const MAIL_API_BASE = '/api/mail'
const TIMER_INITIAL = 600 // 10 minutes in seconds

export default function ArsynoxMail() {
  // Account state
  const [account, setAccount] = useState<Account | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Timer state
  const [timeLeft, setTimeLeft] = useState(TIMER_INITIAL)

  // Messages state
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Initialize on mount
  useEffect(() => {
    loadAccountFromStorage()
    startTimer()
    return () => cleanup()
  }, [])

  // Update iframe content when message is selected
  useEffect(() => {
    if (selectedMessage && iframeRef.current) {
      const content = selectedMessage.html && selectedMessage.html.length > 0
        ? selectedMessage.html[0]
        : `<pre style="font-family: sans-serif; padding: 20px; color: #fff;">${selectedMessage.text || ''}</pre>`

      const doc = iframeRef.current.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 20px;
                color: #fff;
                margin: 0;
                background: #000;
              }
              a {
                color: #6b9eff;
                text-decoration: underline;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>${content}</body>
          </html>
        `)
        doc.close()
      }
    }
  }, [selectedMessage])

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current!)
          if (pollRef.current) clearInterval(pollRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const loadAccountFromStorage = async () => {
    const storedAccount = localStorage.getItem('arsynox_account')
    const storedToken = localStorage.getItem('arsynox_token')

    if (storedAccount && storedToken) {
      setAccount(JSON.parse(storedAccount))
      setToken(storedToken)
      await fetchMessages()
      startPolling()
    } else {
      createNewAccount()
    }
  }

  const createNewAccount = async () => {
    setIsLoading(true)
    setSelectedMessage(null)
    setMessages([])

    try {
      const domainRes = await fetch(`${MAIL_API_BASE}/domains`)
      const domainData = await domainRes.json()

      if (!domainData['hydra:member'] || domainData['hydra:member'].length === 0) {
        throw new Error('No domains available')
      }

      const domain = domainData['hydra:member'][0].domain
      const username = 'arsynox_' + Math.random().toString(36).substring(2, 10)
      const password = Math.random().toString(36).substring(2, 15)
      const address = `${username}@${domain}`

      const regRes = await fetch(`${MAIL_API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      })

      if (!regRes.ok) throw new Error('Registration failed')
      const accData = await regRes.json()

      const tokenRes = await fetch(`${MAIL_API_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      })

      if (!tokenRes.ok) throw new Error('Login failed')
      const tokenData = await tokenRes.json()

      setAccount(accData)
      setToken(tokenData.token)
      localStorage.setItem('arsynox_account', JSON.stringify(accData))
      localStorage.setItem('arsynox_token', tokenData.token)

      setTimeLeft(TIMER_INITIAL)
      startPolling()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      if (token && timeLeft > 0) {
        fetchMessages()
      }
    }, 5000)
  }

  const fetchMessages = async () => {
    if (!token) return

    try {
      const res = await fetch(`${MAIL_API_BASE}/messages?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        localStorage.removeItem('arsynox_account')
        localStorage.removeItem('arsynox_token')
        setAccount(null)
        setToken(null)
        return
      }

      const data = await res.json()
      setMessages(data['hydra:member'] || [])
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const loadMessage = async (id: string) => {
    if (!token) return

    try {
      const res = await fetch(`${MAIL_API_BASE}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      setSelectedMessage(data)

      fetch(`${MAIL_API_BASE}/messages/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify({ seen: true }),
      })

      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, seen: true } : msg))
      )
    } catch (error) {
      console.error('Load message error:', error)
      toast.error('Failed to load message')
    }
  }

  const copyEmail = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address)
      toast.success('Email copied')
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
      {/* Header */}
      <h1 className="text-2xl font-semibold mb-10">ArsyMail</h1>

      {/* Main Container */}
      <div className="w-full max-w-xl space-y-4">
        {/* Email Display Section */}
        <div className="border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <input
              type="text"
              readOnly
              value={account?.address || 'Generating...'}
              className="flex-grow bg-transparent text-white outline-none font-mono"
            />
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={copyEmail}
                disabled={!account?.address}
                className="text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-blue-400 transition-colors"
                title="Copy"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={createNewAccount}
                disabled={isLoading}
                className="text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-blue-400 transition-colors"
                title="Refresh"
              >
                <RotateCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            Expires in: {formatTime(timeLeft)}
          </div>
        </div>

        {/* Inbox Section */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          {!selectedMessage ? (
            <>
              {/* Inbox Header */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Inbox</span>
                <button
                  onClick={fetchMessages}
                  disabled={!token}
                  className="text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-blue-400 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Messages List */}
              <div className="max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-gray-600">
                    <Inbox className="h-8 w-8 mb-2 text-blue-400 opacity-50" />
                    <p className="text-sm">No emails yet. Your inbox is waiting.</p>
                  </div>
                ) : (
                  <div>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => loadMessage(msg.id)}
                        className="px-4 py-3 border-b border-gray-800 cursor-pointer hover:bg-white/5 transition-colors last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm truncate w-2/3 ${msg.seen ? 'text-gray-400' : 'text-white'}`}>
                            {msg.from.name || msg.from.address}
                          </span>
                          <span className="text-gray-500 text-xs shrink-0 ml-2">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`text-sm truncate ${msg.seen ? 'text-gray-500' : 'text-gray-300'}`}>
                          {msg.subject || '(No Subject)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Message View Header */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← Back
                </button>
                <span className="text-gray-400 text-sm">Message</span>
                <div className="w-12" />
              </div>

              {/* Message Content */}
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    {selectedMessage.subject || '(No Subject)'}
                  </h2>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-400">
                      From: <span className="text-gray-300">{selectedMessage.from.name || selectedMessage.from.address}</span>
                    </p>
                    <p className="text-gray-400">
                      To: <span className="text-gray-300">{selectedMessage.to.address}</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="h-96 border border-gray-800 rounded overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    key={selectedMessage.id}
                    className="w-full h-full border-none bg-black"
                    title="Message Content"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-gray-600 text-xs">
        © 2025 ArsyMail
      </footer>
    </div>
  )
}
