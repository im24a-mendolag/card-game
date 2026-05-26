import type { Card } from '../types'
import { CARD_INFO } from '../types'

interface Props {
  card: Card | null
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  onClick?: () => void
  glow?: boolean
}

const sizes = {
  sm: { width: 54, height: 80, fontSize: 10, valueFontSize: 14 },
  md: { width: 80, height: 116, fontSize: 12, valueFontSize: 20 },
  lg: { width: 110, height: 160, fontSize: 14, valueFontSize: 28 },
}

export function CardView({ card, faceDown, size = 'md', selected, onClick, glow }: Props) {
  const dim = sizes[size]
  const info = card ? CARD_INFO[card.name] : null

  if (faceDown || !card) {
    return (
      <div
        style={{
          width: dim.width,
          height: dim.height,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 50%, #2a2a4a 100%)',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.03) 4px,
            rgba(255,255,255,0.03) 8px
          )`,
        }}
      >
        <span style={{ fontSize: dim.valueFontSize, opacity: 0.3 }}>?</span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: dim.width,
        height: dim.height,
        borderRadius: 10,
        background: '#fff',
        border: selected ? '3px solid #f0c040' : '2px solid rgba(0,0,0,0.2)',
        boxShadow: selected
          ? `0 0 20px rgba(240,192,64,0.8), 0 4px 12px rgba(0,0,0,0.5)`
          : glow
          ? `0 0 15px rgba(100,200,100,0.6), 0 4px 12px rgba(0,0,0,0.5)`
          : '0 4px 12px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 4px',
        cursor: onClick ? 'pointer' : 'default',
        transform: selected ? 'translateY(-8px)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease',
        flexShrink: 0,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top-left value */}
      <div style={{ alignSelf: 'flex-start', lineHeight: 1 }}>
        <div style={{ fontSize: dim.valueFontSize * 0.7, fontWeight: 'bold', color: info?.color, fontFamily: 'Georgia, serif' }}>
          {card.value}
        </div>
      </div>

      {/* Center emoji */}
      <div style={{ fontSize: dim.valueFontSize * 1.1, lineHeight: 1 }}>{info?.emoji}</div>

      {/* Card name */}
      <div
        style={{
          fontSize: dim.fontSize * 0.85,
          fontWeight: 'bold',
          color: info?.color,
          textAlign: 'center',
          lineHeight: 1.1,
          fontFamily: 'Georgia, serif',
          letterSpacing: '-0.3px',
        }}
      >
        {card.name}
      </div>
    </div>
  )
}
