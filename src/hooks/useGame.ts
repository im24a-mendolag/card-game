import { useCallback, useEffect, useRef, useState } from 'react'
import PartySocket from 'partysocket'
import type { Card, CardName, ClientMessage, GameState, ServerMessage } from '../types'

export interface GameHook {
  state: GameState | null
  yourHand: Card[]
  myPlayerId: string | null
  chancellorOptions: Card[] | null
  errorMsg: string | null
  join: (name: string) => void
  addBot: () => void
  startGame: () => void
  playCard: (cardIndex: number, targetPlayerId?: string, guessedCard?: CardName) => void
  chancellorKeep: (keepIndex: number) => void
  nextRound: () => void
  clearError: () => void
}

export function useGame(roomId: string): GameHook {
  const [state, setState] = useState<GameState | null>(null)
  const [yourHand, setYourHand] = useState<Card[]>([])
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [chancellorOptions, setChancellorOptions] = useState<Card[] | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const socketRef = useRef<PartySocket | null>(null)

  useEffect(() => {
    const socket = new PartySocket({
      host: import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999',
      room: roomId,
    })
    socketRef.current = socket

    socket.addEventListener('open', () => {
      setMyPlayerId(socket.id)
    })

    socket.addEventListener('message', (event: MessageEvent) => {
      const msg = JSON.parse(event.data as string) as ServerMessage
      if (msg.type === 'gameState') {
        setState(msg.state)
        setYourHand(msg.yourHand)
        setChancellorOptions(msg.chancellorOptions ?? null)
      } else if (msg.type === 'error') {
        setErrorMsg(msg.message)
      }
    })

    return () => socket.close()
  }, [roomId])

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg))
  }, [])

  const join = useCallback((name: string) => {
    setMyPlayerId(socketRef.current?.id ?? null)
    send({ type: 'join', name })
  }, [send])

  const addBot = useCallback(() => send({ type: 'addBot' }), [send])
  const startGame = useCallback(() => send({ type: 'startGame' }), [send])
  const playCard = useCallback(
    (cardIndex: number, targetPlayerId?: string, guessedCard?: CardName) =>
      send({ type: 'playCard', cardIndex, targetPlayerId, guessedCard }),
    [send],
  )
  const chancellorKeep = useCallback(
    (keepIndex: number) => send({ type: 'chancellorKeep', keepIndex }),
    [send],
  )
  const nextRound = useCallback(() => send({ type: 'nextRound' }), [send])
  const clearError = useCallback(() => setErrorMsg(null), [])

  return { state, yourHand, myPlayerId, chancellorOptions, errorMsg, join, addBot, startGame, playCard, chancellorKeep, nextRound, clearError }
}
