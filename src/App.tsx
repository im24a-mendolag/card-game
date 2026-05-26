import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { Home } from './components/Home'
import { Lobby } from './components/Lobby'
import { GameBoard } from './components/GameBoard'
import { RoundEnd } from './components/RoundEnd'
import { PeekModal } from './components/PeekModal'

function getInitialRoomId(): string | null {
  const hash = window.location.hash.slice(1).trim()
  return hash.length > 0 ? hash.toUpperCase() : null
}

function createRoom(): string {
  const id = Math.random().toString(36).slice(2, 7).toUpperCase()
  window.location.hash = id
  return id
}

function joinRoom(code: string): string {
  const id = code.toUpperCase()
  window.location.hash = id
  return id
}

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(getInitialRoomId)
  const [pendingName, setPendingName] = useState<string>('')

  const {
    state,
    yourHand,
    myPlayerId,
    chancellorOptions,
    revealedCard,
    revealedFromId,
    errorMsg,
    connectionStatus,
    join,
    addBot,
    startGame,
    playCard,
    chancellorKeep,
    nextRound,
    clearError,
    dismissReveal,
  } = useGame(roomId)

  if (!roomId) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Home
          onCreate={name => { setPendingName(name); setRoomId(createRoom()) }}
          onJoin={(code, name) => { setPendingName(name); setRoomId(joinRoom(code)) }}
        />
      </div>
    )
  }

  if (!state || state.phase === 'lobby') {
    return (
      <div style={{ width: '100%', minHeight: '100%', overflowY: 'auto' }}>
        <Lobby
          state={state}
          myPlayerId={myPlayerId}
          connectionStatus={connectionStatus}
          onJoin={join}
          onAddBot={addBot}
          onStart={startGame}
          roomId={roomId}
          initialName={pendingName}
        />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameBoard
        state={state}
        yourHand={yourHand}
        myPlayerId={myPlayerId}
        chancellorOptions={chancellorOptions}
        onPlayCard={playCard}
        onChancellorKeep={chancellorKeep}
        onNextRound={nextRound}
        errorMsg={errorMsg}
        onClearError={clearError}
      />
      {(state.phase === 'roundEnd' || state.phase === 'gameOver') && (
        <RoundEnd state={state} myPlayerId={myPlayerId} onNextRound={nextRound} />
      )}
      {revealedCard && (
        <PeekModal
          card={revealedCard}
          target={state.players.find(p => p.id === revealedFromId)}
          onClose={dismissReveal}
        />
      )}
    </div>
  )
}
