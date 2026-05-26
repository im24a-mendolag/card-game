import type { Card } from '../types'
import { CARD_INFO } from '../types'
import { CardView } from './CardView'

interface Props {
  options: Card[]
  onKeep: (index: number) => void
}

export function ChancellorModal({ options, onKeep }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e4d2b 0%, #163820 100%)',
          borderRadius: 18,
          padding: 32,
          width: '100%',
          maxWidth: 480,
          border: '1px solid rgba(121,85,72,0.5)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
        <h2 style={{ fontSize: 22, color: '#f0c040', marginBottom: 6, fontFamily: 'Georgia, serif' }}>
          Chancellor
        </h2>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 24, lineHeight: 1.5 }}>
          Choose <strong>1 card to keep</strong>. The remaining cards will be placed at the bottom of the deck.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {options.map((card, i) => {
            const info = CARD_INFO[card.name]
            return (
              <div
                key={i}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <CardView card={card} size="lg" glow />
                <div style={{ fontSize: 12, opacity: 0.65 }}>{info.description.slice(0, 40)}…</div>
                <button
                  onClick={() => onKeep(i)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 13,
                    border: 'none',
                    width: '100%',
                    letterSpacing: 0.5,
                  }}
                >
                  Keep {info.emoji} {card.name}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
