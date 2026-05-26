import type { GameState } from '../types'
import { CARD_INFO } from '../types'

interface Props {
  state: GameState
  myPlayerId: string | null
  onNextRound: () => void
}

export function RoundEnd({ state, myPlayerId, onNextRound }: Props) {
  const me = state.players.find(p => p.id === myPlayerId)
  const isHost = me?.isHost
  const isGameOver = state.phase === 'gameOver'
  const tokensToWin = state.players.length === 2 ? 7 : state.players.length === 3 ? 5 : 4

  const activePlayers = state.players.filter(p => !p.isEliminated)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e4d2b 0%, #163820 100%)',
          borderRadius: 20,
          padding: 36,
          width: '100%',
          maxWidth: 520,
          border: isGameOver ? '2px solid rgba(240,192,64,0.6)' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: isGameOver
            ? '0 0 60px rgba(240,192,64,0.3), 0 20px 60px rgba(0,0,0,0.7)'
            : '0 20px 60px rgba(0,0,0,0.7)',
          textAlign: 'center',
        }}
      >
        {isGameOver ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
            <h2 style={{ fontSize: 32, color: '#f0c040', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
              {state.winner} Wins!
            </h2>
            <p style={{ opacity: 0.7, marginBottom: 24, fontSize: 14 }}>
              {state.winner} has collected {tokensToWin} tokens of affection
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💌</div>
            <h2 style={{ fontSize: 28, color: '#f0c040', marginBottom: 4, fontFamily: 'Georgia, serif' }}>
              Round {state.roundNumber} Over
            </h2>
            {state.roundWinner && (
              <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 20 }}>
                <strong style={{ color: '#f0c040' }}>{state.roundWinner}</strong> wins this round!
              </p>
            )}
          </>
        )}

        {/* Survivors */}
        {!isGameOver && activePlayers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2, marginBottom: 10 }}>SURVIVORS' HANDS</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {activePlayers.map(p => {
                const card = p.hand[0]
                const info = card ? CARD_INFO[card.name] : null
                return (
                  <div key={p.id} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{p.name}</div>
                    {card && info ? (
                      <div
                        style={{
                          padding: '8px 14px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 10,
                          border: `1px solid ${info.color}60`,
                          fontSize: 14,
                          color: info.color,
                        }}
                      >
                        {info.emoji} {card.name} ({card.value})
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, opacity: 0.4 }}>No card</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Scores */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2, marginBottom: 10 }}>STANDINGS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...state.players]
              .sort((a, b) => b.tokens - a.tokens)
              .map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: p.id === myPlayerId ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.05)',
                    border: p.id === myPlayerId ? '1px solid rgba(240,192,64,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span style={{ fontSize: 13, opacity: 0.5, width: 20 }}>{i + 1}.</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: i === 0 ? 'bold' : 'normal' }}>
                    {p.name}
                    {p.id === myPlayerId && (
                      <span style={{ fontSize: 9, marginLeft: 6, color: '#f0c040' }}>YOU</span>
                    )}
                  </span>
                  <span style={{ color: '#f0c040', fontWeight: 'bold', fontSize: 16 }}>
                    {p.tokens} / {tokensToWin} ❤️
                  </span>
                </div>
              ))}
          </div>
        </div>

        {isGameOver ? (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 40px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f0c040, #c89820)',
              color: '#1a1a1a',
              fontSize: 16,
              fontWeight: 'bold',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            Play Again
          </button>
        ) : isHost ? (
          <button
            onClick={onNextRound}
            style={{
              padding: '14px 40px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            Next Round →
          </button>
        ) : (
          <p style={{ opacity: 0.6, fontSize: 13 }}>Waiting for host to start next round…</p>
        )}
      </div>
    </div>
  )
}
