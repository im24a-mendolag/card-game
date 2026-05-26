import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { Lobby } from './components/Lobby'
import { GameBoard } from './components/GameBoard'
import { RoundEnd } from './components/RoundEnd'

function getRoomId(): string {
  const hash = window.location.hash.slice(1)
  if (hash) return hash
  const id = Math.random().toString(36).slice(2, 7).toUpperCase()
  window.location.hash = id
  return id
}

export default function App() {
  const [roomId] = useState(getRoomId)
  const {
    state,
    yourHand,
    myPlayerId,
    chancellorOptions,
    errorMsg,
    join,
    addBot,
    startGame,
    playCard,
    chancellorKeep,
    nextRound,
    clearError,
  } = useGame(roomId)

  if (!state || state.phase === 'lobby') {
    return (
      <div style={{ width: '100%', minHeight: '100%', overflowY: 'auto' }}>
        <Lobby
          state={state}
          myPlayerId={myPlayerId}
          onJoin={join}
          onAddBot={addBot}
          onStart={startGame}
          roomId={roomId}
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
    </div>
  )
}
