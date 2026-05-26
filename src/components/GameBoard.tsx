import { useState } from 'react'
import type { Card, CardName, GameState } from '../types'
import { CARD_INFO } from '../types'
import { CardView } from './CardView'
import { ActionModal } from './ActionModal'
import { ChancellorModal } from './ChancellorModal'
import { ReferenceBoard } from './ReferenceBoard'

interface Props {
  state: GameState
  yourHand: Card[]
  myPlayerId: string | null
  chancellorOptions: Card[] | null
  onPlayCard: (cardIndex: number, targetPlayerId?: string, guessedCard?: CardName) => void
  onChancellorKeep: (keepIndex: number) => void
  onNextRound: () => void
  errorMsg: string | null
  onClearError: () => void
}

export function GameBoard({
  state,
  yourHand,
  myPlayerId,
  chancellorOptions,
  onPlayCard,
  onChancellorKeep,
  onNextRound: _onNextRound,
  errorMsg,
  onClearError,
}: Props) {
  const [pendingCard, setPendingCard] = useState<{ card: Card; index: number } | null>(null)

  const me = state.players.find(p => p.id === myPlayerId)
  const others = state.players.filter(p => p.id !== myPlayerId)
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === myPlayerId
  const currentPlayer = state.players[state.currentPlayerIndex]
  const isChancellorPhase = state.phase === 'chancellor'
  const isMyChancellorTurn = isChancellorPhase && isMyTurn

  const handCard = yourHand[0] ?? null
  const drawnCard = isMyTurn && state.phase === 'playing' ? state.drawnCard : null

  // Countess rule: if holding Countess + King/Prince, must play Countess
  const mustPlayCountess = !!(handCard && drawnCard && (
    [handCard, drawnCard].some(c => c.name === 'Countess') &&
    [handCard, drawnCard].some(c => c.name === 'King' || c.name === 'Prince')
  ))
  const countessIndex = mustPlayCountess
    ? (handCard?.name === 'Countess' ? 0 : 1)
    : null

  const handleCardClick = (card: Card, index: number) => {
    if (!isMyTurn || state.phase !== 'playing' || !state.drawnCard) return
    // Countess rule: redirect any click to play the Countess
    if (mustPlayCountess && countessIndex !== null && card.name !== 'Countess') {
      onPlayCard(countessIndex)
      return
    }
    // Cards that need a target but have no valid targets — skip the modal and play immediately
    const needsTarget = ['Guard', 'Priest', 'Baron', 'King'].includes(card.name)
    const hasValidTarget = state.players.some(
      p => p.id !== myPlayerId && !p.isEliminated && !p.isProtected,
    )
    if (needsTarget && !hasValidTarget) {
      onPlayCard(index)
      return
    }
    setPendingCard({ card, index })
  }

  const handleConfirm = (cardIndex: number, targetId?: string, guessedCard?: CardName) => {
    setPendingCard(null)
    onPlayCard(cardIndex, targetId, guessedCard)
  }

  const tokensToWin = state.players.length === 2 ? 6 : state.players.length === 3 ? 5 : 4

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR: leaderboard + game info ── */}
      <div
        style={{
          width: 180,
          flexShrink: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
          gap: 12,
          borderRight: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto',
        }}
      >
        <div style={{ textAlign: 'center', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 16, marginBottom: 2 }}>💌</div>
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2 }}>LOVE LETTER</div>
          <div style={{ fontSize: 13, color: '#f0c040' }}>Round {state.roundNumber}</div>
        </div>

        {/* Leaderboard */}
        <div>
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 2, marginBottom: 8 }}>LEADERBOARD</div>
          {[...state.players]
            .sort((a, b) => b.tokens - a.tokens)
            .map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 8px',
                  borderRadius: 8,
                  marginBottom: 4,
                  background: p.id === myPlayerId ? 'rgba(240,192,64,0.1)' : 'transparent',
                  border: p.id === myPlayerId ? '1px solid rgba(240,192,64,0.2)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: 11, opacity: 0.5, width: 14 }}>{i + 1}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: p.isEliminated ? 'rgba(255,255,255,0.3)' : '#f5f0e8',
                    textDecoration: p.isEliminated ? 'line-through' : 'none',
                  }}
                >
                  {p.name}
                  {p.id === myPlayerId && (
                    <span style={{ fontSize: 8, marginLeft: 4, color: '#f0c040', fontWeight: 'bold' }}>YOU</span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: '#f0c040', fontWeight: 'bold' }}>
                  {p.tokens}❤️
                </span>
              </div>
            ))}
          <div style={{ fontSize: 10, opacity: 0.4, textAlign: 'center', marginTop: 4 }}>
            First to {tokensToWin} ❤️ wins
          </div>
        </div>

        {/* Deck count */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 2, marginBottom: 4 }}>DECK</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f0c040' }}>{state.deckCount}</div>
          <div style={{ fontSize: 10, opacity: 0.4 }}>cards left</div>
        </div>

        {/* Turn indicator */}
        <div
          style={{
            padding: '10px 12px',
            background: isMyTurn ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            border: isMyTurn ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 2, marginBottom: 4 }}>CURRENT TURN</div>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: isMyTurn ? '#4caf50' : '#f5f0e8' }}>
            {isMyTurn ? '⭐ Your turn!' : currentPlayer?.name ?? '—'}
          </div>
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 10, overflow: 'hidden' }}>

        {/* Other players */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, padding: '8px 0' }}>
          {others.map(p => {
            const isCurrent = state.players[state.currentPlayerIndex]?.id === p.id
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  opacity: p.isEliminated ? 0.38 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                <div
                  style={{
                    borderRadius: 12,
                    padding: 3,
                    border: isCurrent ? '2px solid rgba(240,192,64,0.6)' : '2px solid transparent',
                    background: isCurrent ? 'rgba(240,192,64,0.1)' : 'transparent',
                    position: 'relative',
                  }}
                >
                  <CardView card={null} faceDown size="sm" />
                  {p.isProtected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        background: '#1565c0',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      🛡️
                    </div>
                  )}
                  {p.isEliminated && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      ❌
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: isCurrent ? '#f0c040' : '#f5f0e8',
                      maxWidth: 72,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#f0c040' }}>
                    {p.tokens > 0 ? `${p.tokens}❤️` : ''}
                  </div>
                </div>
                {/* Discard chips */}
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 80 }}>
                  {p.discardPile.slice(-3).map((c, idx) => (
                    <span
                      key={idx}
                      title={c.name}
                      style={{
                        fontSize: 11,
                        background: `${CARD_INFO[c.name].color}25`,
                        border: `1px solid ${CARD_INFO[c.name].color}60`,
                        borderRadius: 4,
                        padding: '1px 4px',
                        color: CARD_INFO[c.name].color,
                      }}
                    >
                      {CARD_INFO[c.name].emoji}{c.value}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Center area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          {/* Action log */}
          {state.lastAction && (
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                padding: '8px 18px',
                fontSize: 13,
                opacity: 0.85,
                textAlign: 'center',
                maxWidth: 460,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              📜 {state.lastAction}
            </div>
          )}

          {/* Deck + my discard */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: 1, marginBottom: 4 }}>DRAW PILE</div>
              <div style={{ position: 'relative', width: 80, height: 116 }}>
                {[2, 1, 0].map(offset => (
                  <div
                    key={offset}
                    style={{
                      position: 'absolute',
                      top: offset * 2,
                      left: offset * 2,
                      opacity: 1 - offset * 0.25,
                    }}
                  >
                    <CardView card={null} faceDown size="md" />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 16, color: '#f0c040', fontWeight: 'bold' }}>
                {state.deckCount}
              </div>
            </div>

            {me && me.discardPile.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: 1, marginBottom: 4 }}>YOUR DISCARD</div>
                <CardView card={me.discardPile[me.discardPile.length - 1]} size="md" />
              </div>
            )}
          </div>

          {/* Status pills */}
          {!isMyTurn && state.phase === 'playing' && (
            <div style={{ fontSize: 13, opacity: 0.5, padding: '6px 18px', background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
              Waiting for {currentPlayer?.name}…
            </div>
          )}
          {isMyTurn && state.phase === 'playing' && !state.drawnCard && (
            <div style={{ fontSize: 13, color: '#4caf50', padding: '6px 18px', background: 'rgba(76,175,80,0.12)', borderRadius: 20, border: '1px solid rgba(76,175,80,0.3)' }}>
              Drawing your card…
            </div>
          )}
          {isMyTurn && state.phase === 'playing' && state.drawnCard && (
            <div style={{ fontSize: 14, color: '#f0c040', padding: '8px 20px', background: 'rgba(240,192,64,0.12)', borderRadius: 20, border: '1px solid rgba(240,192,64,0.3)', fontWeight: 'bold' }}>
              Choose a card to play!
            </div>
          )}
          {isChancellorPhase && !isMyChancellorTurn && (
            <div style={{ fontSize: 13, opacity: 0.5, padding: '6px 18px', background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
              {currentPlayer?.name} is choosing with the Chancellor…
            </div>
          )}
        </div>

        {/* My hand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {me && (
            <div style={{ fontSize: 11, opacity: 0.45, letterSpacing: 2 }}>
              {me.name.toUpperCase()}
              {me.isProtected ? ' · 🛡️ PROTECTED' : ''}
              {me.isEliminated ? ' · ELIMINATED' : ''}
            </div>
          )}

          {mustPlayCountess && (
            <div style={{ fontSize: 12, color: '#ff9800', background: 'rgba(255,152,0,0.12)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: 8, padding: '4px 14px' }}>
              ⚠️ Must discard Countess (holding King or Prince)
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            {handCard && (
              <div style={{ textAlign: 'center', opacity: mustPlayCountess && handCard.name !== 'Countess' ? 0.35 : 1, transition: 'opacity 0.2s' }}>
                {drawnCard && <div style={{ fontSize: 10, opacity: 0.45, marginBottom: 4 }}>HAND</div>}
                <CardView
                  card={handCard}
                  size="lg"
                  selected={pendingCard?.index === 0}
                  onClick={() => drawnCard && handleCardClick(handCard, 0)}
                  glow={isMyTurn && !!drawnCard && (!mustPlayCountess || handCard.name === 'Countess')}
                />
              </div>
            )}
            {drawnCard && (
              <div style={{ textAlign: 'center', opacity: mustPlayCountess && drawnCard.name !== 'Countess' ? 0.35 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ fontSize: 10, color: '#f0c040', opacity: 0.8, marginBottom: 4 }}>DRAWN</div>
                <CardView
                  card={drawnCard}
                  size="lg"
                  selected={pendingCard?.index === 1}
                  onClick={() => handleCardClick(drawnCard, 1)}
                  glow={!mustPlayCountess || drawnCard.name === 'Countess'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR: reference board ── */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: 'rgba(0,0,0,0.30)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 10,
            opacity: 0.4,
            letterSpacing: 2,
            textAlign: 'center',
            padding: '11px 0 7px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          CARD REFERENCE
        </div>
        <ReferenceBoard players={state.players} burnedCard={state.burnedCard} />
      </div>

      {/* Action modal */}
      {pendingCard && (
        <ActionModal
          card={pendingCard.card}
          cardIndex={pendingCard.index}
          players={state.players}
          myId={myPlayerId ?? ''}
          onConfirm={handleConfirm}
          onCancel={() => setPendingCard(null)}
        />
      )}

      {/* Chancellor modal */}
      {isMyChancellorTurn && chancellorOptions && chancellorOptions.length > 0 && (
        <ChancellorModal options={chancellorOptions} onKeep={onChancellorKeep} />
      )}

      {/* Error toast */}
      {errorMsg && (
        <div
          onClick={onClearError}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(192,57,43,0.93)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            zIndex: 999,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  )
}
