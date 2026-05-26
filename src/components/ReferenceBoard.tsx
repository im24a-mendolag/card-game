import type { Player } from '../types'
import { CARD_INFO } from '../types'
import type { CardName } from '../types'

const CARD_ORDER: CardName[] = [
  'Spy', 'Guard', 'Priest', 'Baron', 'Handmaid',
  'Prince', 'Chancellor', 'King', 'Countess', 'Princess',
]

const SHORT_DESC: Record<CardName, string> = {
  Spy:         'Token if only Spy at end',
  Guard:       'Guess a hand',
  Priest:      'Peek at a hand',
  Baron:       'Compare — lower out',
  Handmaid:    'Immune next turn',
  Prince:      'Force discard & draw',
  Chancellor:  'Draw 2, keep 1, return 2',
  King:        'Trade hands',
  Countess:    'Must play w/ King/Prince',
  Princess:    'Lose if played or discarded',
}

interface Props {
  players?: Player[]
  burnedCard?: { name: CardName } | null
}

export function ReferenceBoard({ players, burnedCard }: Props) {
  const playedCounts: Partial<Record<CardName, number>> = {}
  if (players) {
    for (const p of players) {
      for (const c of p.discardPile) {
        playedCounts[c.name] = (playedCounts[c.name] ?? 0) + 1
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {CARD_ORDER.map((name, i) => {
        const info = CARD_INFO[name]
        const played = playedCounts[name] ?? 0
        const total = info.count
        const allGone = played >= total
        const isLast = i === CARD_ORDER.length - 1

        return (
          <div key={name}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                opacity: allGone ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Value circle */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: allGone ? 'rgba(255,255,255,0.06)' : `${info.color}28`,
                  border: `1px solid ${allGone ? 'rgba(255,255,255,0.15)' : `${info.color}60`}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: allGone ? 'rgba(255,255,255,0.3)' : info.color,
                  flexShrink: 0,
                }}
              >
                {info.value}
              </div>

              {/* Text block */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 14 }}>{info.emoji}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 'bold',
                      color: allGone ? 'rgba(255,255,255,0.3)' : info.color,
                      textDecoration: allGone ? 'line-through' : 'none',
                    }}
                  >
                    {name}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.5,
                    color: '#f5f0e8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {SHORT_DESC[name]}
                </div>
              </div>

              {/* Pip tracker */}
              {players && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 48 }}>
                    {Array.from({ length: total }).map((_, j) => (
                      <div
                        key={j}
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: j < played ? info.color : 'rgba(255,255,255,0.12)',
                          border: `1px solid ${j < played ? info.color : 'rgba(255,255,255,0.1)'}`,
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: played > 0 ? info.color : 'rgba(255,255,255,0.25)', fontWeight: 'bold' }}>
                    {played}/{total}
                  </div>
                </div>
              )}
            </div>

            {!isLast && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' }} />
            )}
          </div>
        )
      })}

      {burnedCard && (
        <div
          style={{
            margin: '8px 14px 12px',
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11,
            opacity: 0.5,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          🔥 1 card burned face-down
          <br />
          <span style={{ fontSize: 10, opacity: 0.7 }}>not tracked above</span>
        </div>
      )}
    </div>
  )
}
