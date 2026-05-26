import { useState } from 'react'
import type { Card, CardName, Player } from '../types'
import { CARD_INFO, GUARD_TARGETS } from '../types'
import { CardView } from './CardView'

interface Props {
  card: Card
  cardIndex: number
  players: Player[]
  myId: string
  onConfirm: (cardIndex: number, targetId?: string, guessedCard?: CardName) => void
  onCancel: () => void
}

function needsTarget(card: Card): boolean {
  return ['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(card.name)
}

function needsGuess(card: Card): boolean {
  return card.name === 'Guard'
}

export function ActionModal({ card, cardIndex, players, myId, onConfirm, onCancel }: Props) {
  const [targetId, setTargetId] = useState<string | undefined>()
  const [guessedCard, setGuessedCard] = useState<CardName | undefined>()

  const info = CARD_INFO[card.name]

  const validTargets = players.filter(p => {
    if (p.isEliminated) return false
    // For Baron/Guard/Priest/King: cannot target self; cannot target protected players
    if (['Baron', 'Guard', 'Priest', 'King'].includes(card.name)) {
      if (p.id === myId) return false
      if (p.isProtected) return false
    }
    // Prince CAN target self, but cannot target protected others
    if (card.name === 'Prince') {
      if (p.id !== myId && p.isProtected) return false
    }
    return true
  })

  const canConfirm = (): boolean => {
    if (!needsTarget(card)) return true
    if (validTargets.length === 0) return true
    if (!targetId) return false
    if (needsGuess(card) && !guessedCard) return false
    return true
  }

  const handleConfirm = () => {
    const effectiveTarget = validTargets.length === 0 ? undefined : targetId
    onConfirm(cardIndex, effectiveTarget, guessedCard)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e4d2b 0%, #163820 100%)',
          borderRadius: 18,
          padding: 28,
          width: '100%',
          maxWidth: 440,
          border: `1px solid ${info.color}50`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Card preview */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
          <CardView card={card} size="md" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 2, marginBottom: 4 }}>PLAYING</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: info.color, marginBottom: 6 }}>
              {info.emoji} {card.name} ({card.value})
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>{info.description}</div>
          </div>
        </div>

        {/* Target selection */}
        {needsTarget(card) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 2, marginBottom: 8 }}>
              {validTargets.length === 0 ? 'NO VALID TARGETS — all protected' : 'CHOOSE TARGET'}
            </div>
            {validTargets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {validTargets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setTargetId(p.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: targetId === p.id ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.07)',
                      border: targetId === p.id ? '1px solid rgba(240,192,64,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      color: '#f5f0e8',
                      textAlign: 'left',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🂠</span>
                    <span style={{ fontWeight: targetId === p.id ? 'bold' : 'normal' }}>
                      {p.name} {p.id === myId ? '(you)' : ''}
                    </span>
                    {p.isProtected && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#2196f3' }}>🛡️</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guess for Guard */}
        {needsGuess(card) && targetId && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 2, marginBottom: 8 }}>GUESS THEIR CARD</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GUARD_TARGETS.map(name => {
                const ci = CARD_INFO[name]
                return (
                  <button
                    key={name}
                    onClick={() => setGuessedCard(name)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      background: guessedCard === name ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.07)',
                      border: guessedCard === name ? '1px solid rgba(240,192,64,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      color: guessedCard === name ? '#f0c040' : '#f5f0e8',
                      fontSize: 13,
                      fontWeight: guessedCard === name ? 'bold' : 'normal',
                    }}
                  >
                    {ci.emoji} {name} ({ci.value})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              color: '#f5f0e8',
              fontSize: 14,
              fontWeight: 'bold',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 10,
              background: canConfirm()
                ? `linear-gradient(135deg, ${info.color}, ${info.color}cc)`
                : 'rgba(255,255,255,0.1)',
              color: canConfirm() ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            Play {info.emoji} {card.name}
          </button>
        </div>
      </div>
    </div>
  )
}
