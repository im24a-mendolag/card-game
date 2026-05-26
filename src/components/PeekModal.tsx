import type { Card, Player } from '../types'
import { CARD_INFO } from '../types'
import { CardView } from './CardView'

interface Props {
  card: Card
  target: Player | undefined
  onClose: () => void
}

export function PeekModal({ card, target, onClose }: Props) {
  const info = CARD_INFO[card.name]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e4d2b 0%, #163820 100%)',
          borderRadius: 18,
          padding: 32,
          textAlign: 'center',
          border: '1px solid rgba(100,160,255,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          maxWidth: 320,
          width: '100%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 13, opacity: 0.5, letterSpacing: 2, marginBottom: 6 }}>
          🔮 PEEKING AT
        </div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#90b8ff', marginBottom: 20 }}>
          {target?.name ?? 'Unknown'}'s hand
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <CardView card={card} size="lg" glow />
        </div>

        <div style={{ fontSize: 14, color: info.color, fontWeight: 'bold', marginBottom: 4 }}>
          {info.emoji} {card.name} ({card.value})
        </div>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 24 }}>
          {info.description}
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '11px 32px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #4a90d9, #2c6fad)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
