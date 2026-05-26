import { useState } from 'react'

interface Props {
  onCreate: () => void
  onJoin: (code: string) => void
}

export function Home({ onCreate, onJoin }: Props) {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 3) return
    onJoin(trimmed)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: 24,
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>💌</div>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 'bold',
            color: '#f0c040',
            letterSpacing: 5,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            fontFamily: 'Georgia, serif',
            margin: 0,
          }}
        >
          LOVE LETTER
        </h1>
        <p style={{ opacity: 0.55, fontSize: 13, letterSpacing: 3, marginTop: 10 }}>
          A GAME OF RISK, DEDUCTION & LUCK
        </p>
      </div>

      {/* Action cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>

        {/* Create room */}
        <button
          onClick={onCreate}
          style={{
            padding: '18px 24px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
            color: '#fff',
            fontSize: 17,
            fontWeight: 'bold',
            letterSpacing: 1,
            boxShadow: '0 4px 20px rgba(76,175,80,0.35)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          🎲 Create New Room
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontSize: 12, opacity: 0.4, letterSpacing: 2 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Join with code */}
        {!joining ? (
          <button
            onClick={() => setJoining(true)}
            style={{
              padding: '18px 24px',
              borderRadius: 14,
              background: 'rgba(240,192,64,0.12)',
              color: '#f0c040',
              fontSize: 17,
              fontWeight: 'bold',
              letterSpacing: 1,
              border: '1px solid rgba(240,192,64,0.35)',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            🔑 Join with Code
          </button>
        ) : (
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 14,
              padding: 20,
              border: '1px solid rgba(240,192,64,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2, textAlign: 'center' }}>ENTER ROOM CODE</div>
            <input
              autoFocus
              type="text"
              maxLength={10}
              placeholder="e.g. AB3XY"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#f5f0e8',
                fontSize: 22,
                textAlign: 'center',
                fontWeight: 'bold',
                letterSpacing: 6,
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setJoining(false); setCode('') }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f5f0e8',
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={code.trim().length < 3}
                style={{
                  flex: 2,
                  padding: '11px',
                  borderRadius: 10,
                  background: code.trim().length >= 3
                    ? 'linear-gradient(135deg, #f0c040, #c89820)'
                    : 'rgba(255,255,255,0.08)',
                  color: code.trim().length >= 3 ? '#1a1a1a' : 'rgba(255,255,255,0.3)',
                  fontSize: 14,
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: code.trim().length >= 3 ? 'pointer' : 'default',
                }}
              >
                Join Room →
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, opacity: 0.3, textAlign: 'center', maxWidth: 300 }}>
        Multiplayer · up to 6 players · no account needed
      </p>
    </div>
  )
}
