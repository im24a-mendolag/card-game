// Love Letter - Revised Edition (2019) cards 0-9
export type CardName =
  | 'Spy'         // 0 x2
  | 'Guard'       // 1 x6
  | 'Priest'      // 2 x2
  | 'Baron'       // 3 x2
  | 'Handmaid'    // 4 x2
  | 'Prince'      // 5 x2
  | 'Chancellor'  // 6 x2 — draw 2, put 2 back
  | 'King'        // 7 x1
  | 'Countess'    // 8 x1
  | 'Princess'    // 9 x1

export interface Card {
  name: CardName
  value: number
}

export interface Player {
  id: string
  name: string
  hand: Card[]
  discardPile: Card[]
  isEliminated: boolean
  isProtected: boolean
  tokens: number
  isHost: boolean
  isBot: boolean
}

export type GamePhase = 'lobby' | 'playing' | 'chancellor' | 'roundEnd' | 'gameOver'

export interface GameState {
  phase: GamePhase
  players: Player[]
  deckCount: number
  currentPlayerIndex: number
  roundNumber: number
  drawnCard: Card | null
  lastAction: string | null
  actionLog: string[]
  winner: string | null
  roundWinner: string | null
  roundEndReason: string | null
  burnedCard: Card | null
  // Chancellor phase: the two extra cards to choose from
  chancellorOptions: Card[] | null
}

// Messages from client to server
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'addBot' }
  | { type: 'startGame' }
  | { type: 'playCard'; cardIndex: number; targetPlayerId?: string; guessedCard?: CardName }
  | { type: 'chancellorKeep'; keepIndex: number }
  | { type: 'nextRound' }

// Messages from server to client
export type ServerMessage =
  | { type: 'gameState'; state: GameState; yourHand: Card[]; chancellorOptions?: Card[] }
  | { type: 'peek'; card: Card; fromId: string }
  | { type: 'error'; message: string }

export interface CardInfo {
  name: CardName
  value: number
  count: number
  description: string
  color: string
  emoji: string
}

export const CARD_INFO: Record<CardName, CardInfo> = {
  Spy: {
    name: 'Spy',
    value: 0,
    count: 2,
    description: 'No effect when played. At the end of the round, if you are still in and are the only player who played or discarded a Spy, gain a token.',
    color: '#607d8b',
    emoji: '🕵️',
  },
  Guard: {
    name: 'Guard',
    value: 1,
    count: 6,
    description: 'Name a non-Guard card and choose a player. If they hold that card, they are eliminated.',
    color: '#8B7355',
    emoji: '⚔️',
  },
  Priest: {
    name: 'Priest',
    value: 2,
    count: 2,
    description: 'Look at another player\'s hand.',
    color: '#6B8E9F',
    emoji: '🔮',
  },
  Baron: {
    name: 'Baron',
    value: 3,
    count: 2,
    description: 'Compare hands with another player. The player with the lower value card is eliminated. Ties: both safe.',
    color: '#7B6B8E',
    emoji: '⚖️',
  },
  Handmaid: {
    name: 'Handmaid',
    value: 4,
    count: 2,
    description: 'Until your next turn, you are immune to all card effects.',
    color: '#8E7B6B',
    emoji: '🛡️',
  },
  Prince: {
    name: 'Prince',
    value: 5,
    count: 2,
    description: 'Choose any player (including yourself) to discard their hand and draw a new card.',
    color: '#6B8E7B',
    emoji: '👑',
  },
  Chancellor: {
    name: 'Chancellor',
    value: 6,
    count: 2,
    description: 'Draw 2 cards from the deck. Keep 1, put the other 2 at the bottom of the deck (in any order).',
    color: '#795548',
    emoji: '📜',
  },
  King: {
    name: 'King',
    value: 7,
    count: 1,
    description: 'Trade hands with another player of your choice.',
    color: '#9E8B3A',
    emoji: '🤴',
  },
  Countess: {
    name: 'Countess',
    value: 8,
    count: 1,
    description: 'If you hold this card together with the King or Prince, you MUST discard the Countess.',
    color: '#9E5A6B',
    emoji: '👸',
  },
  Princess: {
    name: 'Princess',
    value: 9,
    count: 1,
    description: 'If you play or discard this card for any reason, you are immediately eliminated.',
    color: '#C04B8A',
    emoji: '💎',
  },
}

export const GUARD_TARGETS: CardName[] = ['Spy', 'Priest', 'Baron', 'Handmaid', 'Prince', 'Chancellor', 'King', 'Countess', 'Princess']
