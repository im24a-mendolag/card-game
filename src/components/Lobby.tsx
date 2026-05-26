import { useState, useEffect } from 'react'
import type { GameState, Player } from '../types'
import type { ConnectionStatus } from '../hooks/useGame'

interface Props {
  state: GameState | null
  myPlayerId: string | null
  connectionStatus: ConnectionStatus
  onJoin: (name: string) => void
  onStart: () => void
  onAddBot: () => void
  roomId: string
  initialName?: string
}

const TOKENS_TO_WIN: Record<number, number> = { 2: 6, 3: 5, 4: 4 }

function PlayerRow({ player, isMe }: { player: Player; isMe: boolean }) {
  const isBot = player.isBot
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: isMe ? 'rgba(240,192,64,0.15)' : isBot ? 'rgba(100,160,255,0.08)' : 'rgba(255,255,255,0.07)',
        borderRadius: 10,
        border: isMe
          ? '1px solid rgba(240,192,64,0.4)'
          : isBot
          ? '1px solid rgba(100,160,255,0.25)'
          : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isBot ? 'rgba(100,160,255,0.15)' : 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {isBot ? '🤖' : player.isHost ? '👑' : '🂠'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: 15, color: isMe ? '#f0c040' : isBot ? '#90b8ff' : '#f5f0e8' }}>
          {player.name}
          {isMe && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>(you)</span>}
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          {isBot ? 'AI Bot' : player.isHost ? 'Host' : 'Player'}
        </div>
      </div>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isBot ? '#64a0ff' : '#4caf50',
          boxShadow: `0 0 6px ${isBot ? '#64a0ff' : '#4caf50'}`,
        }}
      />
    </div>
  )
}

export function Lobby({ state, myPlayerId, connectionStatus, onJoin, onStart, onAddBot, roomId, initialName = '' }: Props) {
  const [name, setName] = useState(initialName)
  const [joined, setJoined] = useState(false)

  const me = state?.players.find(p => p.id === myPlayerId)

  useEffect(() => {
    if (me) setJoined(true)
  }, [me])

  // Auto-join once connected when name was pre-filled from Home
  useEffect(() => {
    if (initialName && connectionStatus === 'connected' && !joined && !me) {
      onJoin(initialName)
      setJoined(true)
    }
  }, [connectionStatus, initialName, joined, me, onJoin])

  const handleJoin = () => {
    if (!name.trim()) return
    onJoin(name.trim())
    setJoined(true)
  }

  const playerCount = state?.players.length ?? 0
  const tokensNeeded = TOKENS_TO_WIN[playerCount] ?? '—'
  const canStart = me?.isHost && playerCount >= 2
  const canAddBot = me?.isHost && playerCount < 6

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: 24,
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>💌</div>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#f0c040',
            letterSpacing: 4,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            fontFamily: 'Georgia, serif',
          }}
        >
          LOVE LETTER
        </h1>
        <p style={{ opacity: 0.6, fontSize: 14, letterSpacing: 2, marginTop: 6 }}>
          A GAME OF RISK, DEDUCTION & LUCK
        </p>
      </div>

      {/* Room code */}
      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
          padding: '12px 24px',
          border: '1px solid rgba(255,255,255,0.15)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 2, marginBottom: 4 }}>ROOM CODE</div>
        <div style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: 6, color: '#f0c040' }}>
          {roomId.toUpperCase()}
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Share this code with friends</div>
        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connectionStatus === 'connected' ? '#4caf50' : connectionStatus === 'disconnected' ? '#e53935' : '#f0c040',
              boxShadow: `0 0 6px ${connectionStatus === 'connected' ? '#4caf50' : connectionStatus === 'disconnected' ? '#e53935' : '#f0c040'}`,
              animation: connectionStatus === 'connecting' ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: 11, opacity: 0.6 }}>
            {connectionStatus === 'connected' ? 'Connected to server'
              : connectionStatus === 'disconnected' ? 'Cannot reach server — check deployment'
              : 'Connecting to server…'}
          </span>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* Main panel */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Join form — hidden when name was pre-filled from Home screen */}
        {!joined && !initialName && (
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 14,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: 10,
            }}
          >
            <input
              type="text"
              maxLength={16}
              placeholder="Enter your name…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#f5f0e8',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: name.trim() ? '#f0c040' : 'rgba(255,255,255,0.1)',
                color: name.trim() ? '#1a1a1a' : 'rgba(255,255,255,0.4)',
                fontWeight: 'bold',
                fontSize: 14,
                transition: 'all 0.15s',
              }}
            >
              Join
            </button>
          </div>
        )}

        {/* Player list */}
        {playerCount > 0 && (
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 14,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                letterSpacing: 2,
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>PLAYERS ({playerCount}/6)</span>
              {playerCount >= 2 && (
                <span style={{ color: '#f0c040' }}>{tokensNeeded} tokens to win</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state?.players.map(p => (
                <PlayerRow key={p.id} player={p} isMe={p.id === myPlayerId} />
              ))}
            </div>

            {/* Add bot button (host only, inside the player list) */}
            {joined && canAddBot && (
              <button
                onClick={onAddBot}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '9px 0',
                  borderRadius: 8,
                  background: 'rgba(100,160,255,0.1)',
                  border: '1px dashed rgba(100,160,255,0.35)',
                  color: '#90b8ff',
                  fontSize: 13,
                  fontWeight: 'bold',
                  letterSpacing: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                + Add Bot 🤖
              </button>
            )}
          </div>
        )}

        {/* Start / waiting */}
        {joined && (
          <div style={{ textAlign: 'center' }}>
            {canStart ? (
              <button
                onClick={onStart}
                style={{
                  padding: '14px 40px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  boxShadow: '0 4px 16px rgba(76,175,80,0.4)',
                  width: '100%',
                }}
              >
                START GAME →
              </button>
            ) : me?.isHost ? (
              <p style={{ opacity: 0.6, fontSize: 13 }}>
                Waiting for more players… (need at least 2)
              </p>
            ) : (
              <p style={{ opacity: 0.6, fontSize: 13 }}>
                Waiting for the host to start the game…
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick rules */}
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2, marginBottom: 8 }}>QUICK RULES</div>
        <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.7, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
          <span>🕵️ Spy (0) — Token if only Spy</span>
          <span>⚔️ Guard (1) — Guess a hand</span>
          <span>🔮 Priest (2) — Peek at a hand</span>
          <span>⚖️ Baron (3) — Compare hands</span>
          <span>🛡️ Handmaid (4) — Protection</span>
          <span>👑 Prince (5) — Force discard</span>
          <span>📜 Chancellor (6) — Draw 2, keep 1</span>
          <span>🤴 King (7) — Trade hands</span>
          <span>👸 Countess (8) — Must play w/ King/Prince</span>
          <span>💎 Princess (9) — Lose if played</span>
        </div>
      </div>
    </div>
  )
}
