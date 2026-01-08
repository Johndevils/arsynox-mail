import { useEffect, useState } from 'react'

const API = 'https://api.mail.tm'

interface Message {
  id: string
  from: { address: string }
  subject: string
}

export default function App() {
  const [address, setAddress] = useState('')
  const [token, setToken] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [expiresIn, setExpiresIn] = useState(600)

  useEffect(() => {
    createMailbox()
  }, [])

  useEffect(() => {
    if (expiresIn <= 0) return
    const t = setInterval(() => setExpiresIn(v => v - 1), 1000)
    return () => clearInterval(t)
  }, [expiresIn])

  async function createMailbox() {
    const domains = await fetch(`${API}/domains`).then(r => r.json())
    const domain = domains['hydra:member'][0].domain
    const email = `arsy${Math.random().toString(36).slice(2, 10)}@${domain}`
    const password = 'arsymail'

    await fetch(`${API}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    })

    const tokenRes = await fetch(`${API}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    }).then(r => r.json())

    setAddress(email)
    setToken(tokenRes.token)
  }

  async function loadMessages() {
    if (!token) return
    const res = await fetch(`${API}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json())
    setMessages(res['hydra:member'])
  }

  return (
    <div className="container">
      <img src="/logo.png" className="logo" />
      <h1>ArsyMail</h1>

      <div className="card">
        <div className="email">{address || 'Generating…'}</div>
        <div className="timer">
          Expires in: {Math.floor(expiresIn / 60)}:
          {(expiresIn % 60).toString().padStart(2, '0')}
        </div>
        <button onClick={() => setExpiresIn(v => v + 600)}>+10 min</button>
      </div>

      <div className="card">
        <div className="row">
          <h2>Inbox</h2>
          <button onClick={loadMessages}>⟳</button>
        </div>
        {messages.length === 0 && <p>No emails yet. Your inbox is waiting.</p>}
        {messages.map(m => (
          <div key={m.id} className="msg">
            <strong>{m.subject}</strong>
            <small>{m.from.address}</small>
          </div>
        ))}
      </div>

      <footer>© 2025 ArsyMail</footer>
    </div>
  )
}