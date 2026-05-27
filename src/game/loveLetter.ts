import type { Card, CardName, GameState, Player } from '../types'

export const CARD_VALUES: Record<CardName, number> = {
  Spy: 0,
  Guard: 1,
  Priest: 2,
  Baron: 3,
  Handmaid: 4,
  Prince: 5,
  Chancellor: 6,
  King: 7,
  Countess: 8,
  Princess: 9,
}

// Revised edition (2019) — 21 cards
const BASE_DECK: CardName[] = [
  'Spy', 'Spy',
  'Guard', 'Guard', 'Guard', 'Guard', 'Guard', 'Guard',
  'Priest', 'Priest',
  'Baron', 'Baron',
  'Handmaid', 'Handmaid',
  'Prince', 'Prince',
  'Chancellor', 'Chancellor',
  'King',
  'Countess',
  'Princess',
]

export function tokensToWin(playerCount: number): number {
  if (playerCount === 2) return 6
  if (playerCount === 3) return 5
  return 4
}

export function makeCard(name: CardName): Card {
  return { name, value: CARD_VALUES[name] }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createDeck(): Card[] {
  return shuffle(BASE_DECK.map(makeCard))
}

export function initRound(players: Player[]): {
  deck: Card[]
  hands: Map<string, Card[]>
  burnedCard: Card
  firstPlayerIndex: number
} {
  const deck = createDeck()
  const burnedCard = deck.pop()!
  const hands = new Map<string, Card[]>()
  const activePlayers = players.filter(p => !p.isEliminated)
  for (const player of activePlayers) {
    hands.set(player.id, [deck.pop()!])
  }
  const randomActive = activePlayers[Math.floor(Math.random() * activePlayers.length)]
  const firstPlayerIndex = players.findIndex(p => p.id === randomActive.id)
  return { deck, hands, burnedCard, firstPlayerIndex }
}

export function mustDiscardCountess(hand: Card[], drawn: Card): boolean {
  const all = [...hand, drawn]
  return all.some(c => c.name === 'Countess') && all.some(c => c.name === 'King' || c.name === 'Prince')
}

export type PlayResult =
  | {
      ok: true
      log: string
      eliminatedId?: string
      revealedCard?: Card
      newDeck: Card[]
      newHands: Map<string, Card[]>
      chancellorOptions?: Card[] // if Chancellor was played
    }
  | { ok: false; error: string }

export function resolvePlayCard(params: {
  state: GameState
  deck: Card[]
  playerHands: Map<string, Card[]>
  actingPlayerId: string
  cardIndex: number
  targetPlayerId?: string
  guessedCard?: CardName
}): PlayResult {
  const { state, deck, playerHands, actingPlayerId, cardIndex, targetPlayerId, guessedCard } = params

  const actor = state.players.find(p => p.id === actingPlayerId)
  if (!actor) return { ok: false, error: 'Player not found' }

  const handCard = playerHands.get(actingPlayerId)?.[0]
  const drawn = state.drawnCard
  if (!handCard || !drawn) return { ok: false, error: 'Invalid hand state' }

  const played = cardIndex === 0 ? handCard : drawn
  const kept = cardIndex === 0 ? drawn : handCard

  // Countess rule: must discard Countess if holding King or Prince
  if (
    played.name !== 'Countess' &&
    (handCard.name === 'Countess' || drawn.name === 'Countess') &&
    (kept.name === 'King' || kept.name === 'Prince')
  ) {
    return { ok: false, error: 'You must discard the Countess when holding the King or Prince!' }
  }

  const newHands = new Map(playerHands)
  newHands.set(actingPlayerId, [kept])
  const newDeck = [...deck]

  // Players that can legally be targeted (alive, not self for most cards, not protected)
  const validOpponents = state.players.filter(
    p => p.id !== actingPlayerId && !p.isEliminated && !p.isProtected,
  )
  const noValidTargets = validOpponents.length === 0

  let log = `${actor.name} played ${played.name}`
  let eliminatedId: string | undefined
  let revealedCard: Card | undefined
  let chancellorOptions: Card[] | undefined

  switch (played.name) {
    case 'Spy':
      log += ` — no immediate effect`
      break

    case 'Guard': {
      // If all opponents are protected, the Guard is discarded with no effect
      if (noValidTargets) {
        log += ` → no valid targets, discarded with no effect`
        break
      }
      if (!targetPlayerId || !guessedCard) return { ok: false, error: 'Guard requires a target and a guess' }
      if (guessedCard === 'Guard') return { ok: false, error: 'Cannot guess Guard' }
      const target = state.players.find(p => p.id === targetPlayerId)
      if (!target || target.isEliminated) return { ok: false, error: 'Invalid target' }
      if (target.isProtected) {
        log += ` → ${target.name} is protected`
      } else {
        const targetCard = newHands.get(targetPlayerId)?.[0]
        if (targetCard?.name === guessedCard) {
          eliminatedId = targetPlayerId
          log += ` → guessed ${guessedCard} correctly! ${target.name} eliminated`
        } else {
          log += ` → guessed ${guessedCard}, wrong`
        }
      }
      break
    }

    case 'Priest': {
      if (noValidTargets) {
        log += ` → no valid targets, discarded with no effect`
        break
      }
      if (!targetPlayerId) return { ok: false, error: 'Priest requires a target' }
      const target = state.players.find(p => p.id === targetPlayerId)
      if (!target || target.isEliminated) return { ok: false, error: 'Invalid target' }
      if (target.isProtected) {
        log += ` → ${target.name} is protected`
      } else {
        revealedCard = newHands.get(targetPlayerId)?.[0]
        log += ` → peeked at ${target.name}'s hand`
      }
      break
    }

    case 'Baron': {
      if (noValidTargets) {
        log += ` → no valid targets, discarded with no effect`
        break
      }
      if (!targetPlayerId) return { ok: false, error: 'Baron requires a target' }
      const target = state.players.find(p => p.id === targetPlayerId)
      if (!target || target.isEliminated) return { ok: false, error: 'Invalid target' }
      if (target.isProtected) {
        log += ` → ${target.name} is protected`
      } else {
        const myCard = kept
        const theirCard = newHands.get(targetPlayerId)?.[0]!
        if (myCard.value > theirCard.value) {
          eliminatedId = targetPlayerId
          log += ` → ${target.name} eliminated`
        } else if (myCard.value < theirCard.value) {
          eliminatedId = actingPlayerId
          log += ` → ${actor.name} eliminated`
        } else {
          log += ` → tie, both safe`
        }
      }
      break
    }

    case 'Handmaid':
      log += ` → ${actor.name} is protected until next turn`
      break

    case 'Prince': {
      if (!targetPlayerId) return { ok: false, error: 'Prince requires a target' }
      const target = state.players.find(p => p.id === targetPlayerId)
      if (!target || target.isEliminated) return { ok: false, error: 'Invalid target' }
      if (target.isProtected && targetPlayerId !== actingPlayerId) {
        log += ` → ${target.name} is protected`
      } else {
        const targetHand = newHands.get(targetPlayerId)!
        const discarded = targetHand[0]
        if (discarded?.name === 'Princess') {
          eliminatedId = targetPlayerId
          newHands.set(targetPlayerId, [])
          log += ` → ${target.name} discarded Princess and is eliminated!`
        } else {
          const newCard = newDeck.pop()
          newHands.set(targetPlayerId, newCard ? [newCard] : [])
          log += ` → ${target.name} discarded ${discarded?.name} and drew a new card`
        }
      }
      break
    }

    case 'Chancellor': {
      // Draw 2 more cards; actor will choose which 1 to keep, then 2 go to bottom
      const extra1 = newDeck.pop()
      const extra2 = newDeck.pop()
      const options: Card[] = []
      if (extra1) options.push(extra1)
      if (extra2) options.push(extra2)
      chancellorOptions = [kept, ...options] // present all options (hand + drawn extras)
      log += ` → drew ${options.length} extra card(s), choose which to keep`
      // Don't set hand yet — resolved in chancellorKeep
      newHands.set(actingPlayerId, []) // temporarily empty
      break
    }

    case 'King': {
      if (noValidTargets) {
        log += ` → no valid targets, discarded with no effect`
        break
      }
      if (!targetPlayerId) return { ok: false, error: 'King requires a target' }
      const target = state.players.find(p => p.id === targetPlayerId)
      if (!target || target.isEliminated) return { ok: false, error: 'Invalid target' }
      if (target.isProtected) {
        log += ` → ${target.name} is protected`
      } else {
        const myHand = newHands.get(actingPlayerId)!
        const theirHand = newHands.get(targetPlayerId)!
        newHands.set(actingPlayerId, theirHand)
        newHands.set(targetPlayerId, myHand)
        log += ` → traded hands with ${target.name}`
      }
      break
    }

    case 'Countess':
      log += ` → discarded Countess`
      break

    case 'Princess':
      eliminatedId = actingPlayerId
      log += ` → ${actor.name} discarded the Princess and is eliminated!`
      break
  }

  return { ok: true, log, eliminatedId, revealedCard, newDeck, newHands, chancellorOptions }
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter(p => !p.isEliminated)
}

export function checkRoundEnd(players: Player[], deckCount: number): boolean {
  return getActivePlayers(players).length <= 1 || deckCount === 0
}

export function getRoundWinner(players: Player[], hands: Map<string, Card[]>): Player | null {
  const active = players.filter(p => !p.isEliminated)
  if (active.length === 0) return null
  if (active.length === 1) return active[0]
  return active.reduce((best, p) => {
    const bestVal = hands.get(best.id)?.[0]?.value ?? 0
    const pVal = hands.get(p.id)?.[0]?.value ?? 0
    if (pVal > bestVal) return p
    if (pVal === bestVal && p.discardPile.length > best.discardPile.length) return p
    return best
  })
}

export function checkSpyBonus(players: Player[]): string[] {
  const spyPlayers = players.filter(p => p.discardPile.some(c => c.name === 'Spy'))
  if (spyPlayers.length === 1) return [spyPlayers[0].id]
  return []
}

export function nextActivePlayerIndex(players: Player[], currentIndex: number): number {
  const n = players.length
  let i = (currentIndex + 1) % n
  while (players[i].isEliminated) {
    i = (i + 1) % n
  }
  return i
}
