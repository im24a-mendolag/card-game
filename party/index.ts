import type * as Party from 'partykit/server'
import type { Card, CardName, ClientMessage, GameState, Player, ServerMessage } from '../src/types'
import {
  checkRoundEnd,
  checkSpyBonus,
  getRoundWinner,
  initRound,
  nextActivePlayerIndex,
  resolvePlayCard,
  tokensToWin,
} from '../src/game/loveLetter'

interface ServerState {
  game: GameState
  deck: Card[]
  playerHands: Record<string, Card[]>
  connToPlayerId: Record<string, string>
  chancellorPool: Card[]
  chancellorActorId: string | null
  pendingReveal: { forPlayerId: string; card: Card; targetId: string } | null
}

function makeInitialState(): ServerState {
  return {
    game: {
      phase: 'lobby',
      players: [],
      deckCount: 0,
      currentPlayerIndex: 0,
      roundNumber: 0,
      drawnCard: null,
      lastAction: null,
      winner: null,
      roundWinner: null,
      burnedCard: null,
      chancellorOptions: null,
    },
    deck: [],
    playerHands: {},
    connToPlayerId: {},
    chancellorPool: [],
    chancellorActorId: null,
    pendingReveal: null,
  }
}

// ── Bot AI ──────────────────────────────────────────────────────────────────

function botDecide(
  botId: string,
  handCard: Card,
  drawn: Card,
  players: Player[],
  playerHands: Record<string, Card[]>,
): { cardIndex: number; targetId?: string; guessedCard?: CardName } {
  const all = [handCard, drawn]

  // Countess rule: must play Countess if holding King or Prince
  const hasCountess = all.some(c => c.name === 'Countess')
  const hasKingOrPrince = all.some(c => c.name === 'King' || c.name === 'Prince')
  if (hasCountess && hasKingOrPrince) {
    const ci = all[0].name === 'Countess' ? 0 : 1
    return { cardIndex: ci }
  }

  // Valid targets (non-self, non-eliminated, non-protected for most cards)
  const opponents = players.filter(p => p.id !== botId && !p.isEliminated)
  const unprotected = opponents.filter(p => !p.isProtected)

  // Pick which card to play — prefer playing the lower value to keep a stronger card
  // But prefer playing Spy (0) since it has a round-end bonus potential
  let cardIndex = all[0].value <= all[1].value ? 0 : 1
  const played = all[cardIndex]

  // Avoid playing Princess
  if (played.name === 'Princess') cardIndex = 1 - cardIndex

  const card = all[cardIndex]

  // Cards that need a target
  const needsTarget = ['Guard', 'Priest', 'Baron', 'King'].includes(card.name)
  const canSelfTarget = card.name === 'Prince'

  // Valid targets for this card
  let targets = unprotected
  if (canSelfTarget) targets = [...unprotected, players.find(p => p.id === botId)!].filter(Boolean)

  const target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null

  if (needsTarget && !target) {
    // No valid target — play the other card instead (if it doesn't need a target)
    const other = all[1 - cardIndex]
    if (!['Guard', 'Priest', 'Baron', 'King'].includes(other.name)) {
      return { cardIndex: 1 - cardIndex }
    }
    // Both need targets but none available — play original, server will handle gracefully
    return { cardIndex }
  }

  if (card.name === 'Guard') {
    if (!target) return { cardIndex }
    // Guess the most common remaining non-Guard card (simple: pick random)
    const guessable: CardName[] = ['Priest', 'Baron', 'Handmaid', 'Prince', 'Chancellor', 'King', 'Countess', 'Princess']
    const guessedCard = guessable[Math.floor(Math.random() * guessable.length)]
    return { cardIndex, targetId: target.id, guessedCard }
  }

  if (card.name === 'Prince') {
    // Self-target if we hold a low card, otherwise target opponent
    const selfPlayer = players.find(p => p.id === botId)!
    const myCard = playerHands[botId]?.[0]
    const myVal = myCard?.value ?? 0
    const lowestOpp = unprotected.reduce<Player | null>((best, p) => {
      const v = playerHands[p.id]?.[0]?.value ?? 0
      if (!best) return p
      return v < (playerHands[best.id]?.[0]?.value ?? 0) ? p : best
    }, null)
    // Target self only if we have Princess (force redraw is better than losing it later)
    const chosenTarget = myCard?.name === 'Princess' ? selfPlayer : (lowestOpp ?? selfPlayer)
    return { cardIndex, targetId: chosenTarget.id }
  }

  if (target && ['Priest', 'Baron', 'King'].includes(card.name)) {
    return { cardIndex, targetId: target.id }
  }

  return { cardIndex }
}

// ────────────────────────────────────────────────────────────────────────────

export default class LoveLetterServer implements Party.Server {
  state: ServerState

  constructor(readonly room: Party.Room) {
    this.state = makeInitialState()
  }

  private broadcast() {
    const { game, playerHands, chancellorPool, chancellorActorId, pendingReveal } = this.state
    for (const conn of this.room.getConnections()) {
      const playerId = this.state.connToPlayerId[conn.id]
      const yourHand = playerId ? (playerHands[playerId] ?? []) : []
      const isChancellorActor = playerId === chancellorActorId
      const msg: ServerMessage = {
        type: 'gameState',
        state: game,
        yourHand,
        chancellorOptions: isChancellorActor ? chancellorPool : undefined,
        revealedCard: pendingReveal?.forPlayerId === playerId ? pendingReveal.card : undefined,
        revealedFromId: pendingReveal?.forPlayerId === playerId ? pendingReveal.targetId : undefined,
      }
      conn.send(JSON.stringify(msg))
    }
    // Clear after sending so it only shows once
    this.state.pendingReveal = null
  }

  private sendError(conn: Party.Connection, message: string) {
    const msg: ServerMessage = { type: 'error', message }
    conn.send(JSON.stringify(msg))
  }

  onConnect(conn: Party.Connection) {
    const msg: ServerMessage = { type: 'gameState', state: this.state.game, yourHand: [] }
    conn.send(JSON.stringify(msg))
  }

  onClose(conn: Party.Connection) {
    const playerId = this.state.connToPlayerId[conn.id]
    if (!playerId) return
    delete this.state.connToPlayerId[conn.id]

    if (this.state.game.phase === 'lobby') {
      this.state.game.players = this.state.game.players.filter(p => p.id !== playerId)
      if (this.state.game.players.length > 0 && !this.state.game.players.some(p => p.isHost)) {
        this.state.game.players[0].isHost = true
      }
      this.broadcast()
    }
  }

  onMessage(rawMessage: string, sender: Party.Connection) {
    let msg: ClientMessage
    try { msg = JSON.parse(rawMessage) } catch { return }

    if (msg.type === 'join') this.handleJoin(sender, msg.name)
    else if (msg.type === 'addBot') this.handleAddBot(sender)
    else if (msg.type === 'startGame') this.handleStartGame(sender)
    else if (msg.type === 'playCard') this.handlePlayCard(sender, msg.cardIndex, msg.targetPlayerId, msg.guessedCard)
    else if (msg.type === 'chancellorKeep') this.handleChancellorKeep(sender, msg.keepIndex)
    else if (msg.type === 'nextRound') this.handleNextRound(sender)
  }

  private handleJoin(conn: Party.Connection, name: string) {
    if (this.state.game.phase !== 'lobby') return this.sendError(conn, 'Game already in progress')
    if (this.state.game.players.length >= 6) return this.sendError(conn, 'Room is full')
    if (this.state.connToPlayerId[conn.id]) return this.sendError(conn, 'Already joined')

    const playerId = conn.id
    this.state.connToPlayerId[conn.id] = playerId

    const player: Player = {
      id: playerId,
      name: name.slice(0, 16).trim() || 'Player',
      hand: [],
      discardPile: [],
      isEliminated: false,
      isProtected: false,
      tokens: 0,
      isHost: this.state.game.players.length === 0,
      isBot: false,
    }
    this.state.game.players.push(player)
    this.broadcast()
  }

  private handleAddBot(conn: Party.Connection) {
    const playerId = this.state.connToPlayerId[conn.id]
    const requester = this.state.game.players.find(p => p.id === playerId)
    if (!requester?.isHost) return this.sendError(conn, 'Only the host can add bots')
    if (this.state.game.phase !== 'lobby') return this.sendError(conn, 'Game already started')
    if (this.state.game.players.length >= 6) return this.sendError(conn, 'Room is full')

    const botCount = this.state.game.players.filter(p => p.isBot).length
    const botId = `bot-${Date.now()}-${botCount}`
    const bot: Player = {
      id: botId,
      name: `Bot ${botCount + 1}`,
      hand: [],
      discardPile: [],
      isEliminated: false,
      isProtected: false,
      tokens: 0,
      isHost: false,
      isBot: true,
    }
    this.state.game.players.push(bot)
    this.broadcast()
  }

  private handleStartGame(conn: Party.Connection) {
    const playerId = this.state.connToPlayerId[conn.id]
    const player = this.state.game.players.find(p => p.id === playerId)
    if (!player?.isHost) return this.sendError(conn, 'Only the host can start')
    if (this.state.game.players.length < 2) return this.sendError(conn, 'Need at least 2 players')
    if (this.state.game.phase !== 'lobby') return this.sendError(conn, 'Game already started')
    this.startNewRound()
  }

  private startNewRound() {
    this.state.game.players = this.state.game.players.map(p => ({
      ...p,
      hand: [],
      discardPile: [],
      isEliminated: false,
      isProtected: false,
    }))

    const { deck, hands, burnedCard, firstPlayerIndex } = initRound(this.state.game.players)
    this.state.deck = deck
    this.state.playerHands = {}
    for (const [id, hand] of hands) {
      this.state.playerHands[id] = hand
    }

    this.state.game.roundNumber += 1
    this.state.game.phase = 'playing'
    this.state.game.currentPlayerIndex = firstPlayerIndex
    this.state.game.deckCount = deck.length
    this.state.game.burnedCard = burnedCard
    this.state.game.roundWinner = null
    this.state.game.chancellorOptions = null
    this.state.game.lastAction = `Round ${this.state.game.roundNumber} started!`
    this.state.chancellorPool = []
    this.state.chancellorActorId = null

    this.drawForCurrentPlayer()
  }

  private drawForCurrentPlayer() {
    const player = this.state.game.players[this.state.game.currentPlayerIndex]
    if (!player || player.isEliminated) { this.advanceTurn(); return }

    const drawn = this.state.deck.pop()
    if (!drawn) { this.endRound(); return }

    this.state.game.drawnCard = drawn
    this.state.game.deckCount = this.state.deck.length
    this.broadcast()

    if (player.isBot) {
      // Delay so players can see the board update before the bot acts
      setTimeout(() => this.botPlay(player.id), 1400)
    }
  }

  private botPlay(botId: string) {
    const bot = this.state.game.players.find(p => p.id === botId)
    if (!bot || bot.isEliminated || this.state.game.phase !== 'playing') return

    const handCard = this.state.playerHands[botId]?.[0]
    const drawn = this.state.game.drawnCard
    if (!handCard || !drawn) return

    const { cardIndex, targetId, guessedCard } = botDecide(
      botId,
      handCard,
      drawn,
      this.state.game.players,
      this.state.playerHands,
    )

    this.executePlay(botId, cardIndex, targetId, guessedCard)
  }

  private handlePlayCard(
    conn: Party.Connection,
    cardIndex: number,
    targetPlayerId?: string,
    guessedCard?: CardName,
  ) {
    const playerId = this.state.connToPlayerId[conn.id]
    if (!playerId) return this.sendError(conn, 'Not in game')

    const currentPlayer = this.state.game.players[this.state.game.currentPlayerIndex]
    if (currentPlayer.id !== playerId) return this.sendError(conn, 'Not your turn')
    if (this.state.game.phase !== 'playing') return this.sendError(conn, 'Cannot play now')

    const err = this.executePlay(playerId, cardIndex, targetPlayerId, guessedCard)
    if (err) this.sendError(conn, err)
  }

  // Returns an error string on failure, undefined on success
  private executePlay(
    playerId: string,
    cardIndex: number,
    targetPlayerId?: string,
    guessedCard?: CardName,
  ): string | undefined {
    if (!this.state.game.drawnCard) return 'No drawn card'

    const handCard = this.state.playerHands[playerId]?.[0]
    const drawn = this.state.game.drawnCard
    if (!handCard || !drawn) return 'Invalid hand state'

    const result = resolvePlayCard({
      state: this.state.game,
      deck: this.state.deck,
      playerHands: new Map(Object.entries(this.state.playerHands)),
      actingPlayerId: playerId,
      cardIndex,
      targetPlayerId,
      guessedCard,
    })

    if (!result.ok) return result.error

    const played = cardIndex === 0 ? handCard : drawn

    this.state.deck = result.newDeck
    this.state.game.deckCount = this.state.deck.length
    for (const [id, hand] of result.newHands) {
      this.state.playerHands[id] = hand
    }

    this.state.game.players = this.state.game.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          discardPile: [...p.discardPile, played],
          isProtected: played.name === 'Handmaid',
          hand: this.state.playerHands[p.id] ?? [],
        }
      }
      if (p.id === result.eliminatedId) return { ...p, isEliminated: true, hand: [] }
      return { ...p, hand: this.state.playerHands[p.id] ?? [] }
    })

    this.state.game.drawnCard = null
    this.state.game.lastAction = result.log

    if (result.revealedCard && targetPlayerId) {
      this.state.pendingReveal = { forPlayerId: playerId, card: result.revealedCard, targetId: targetPlayerId }
    }

    if (result.chancellorOptions && result.chancellorOptions.length > 0) {
      this.state.game.phase = 'chancellor'
      this.state.game.chancellorOptions = result.chancellorOptions
      this.state.chancellorPool = result.chancellorOptions
      this.state.chancellorActorId = playerId
      this.broadcast()

      // If the bot played Chancellor, auto-resolve it
      const actor = this.state.game.players.find(p => p.id === playerId)
      if (actor?.isBot) {
        setTimeout(() => this.botChancellorKeep(playerId), 1000)
      }
      return
    }

    if (checkRoundEnd(this.state.game.players, this.state.deck.length)) {
      this.endRound()
      return
    }

    this.advanceTurn()
  }

  private botChancellorKeep(botId: string) {
    if (this.state.game.phase !== 'chancellor' || this.state.chancellorActorId !== botId) return
    // Bot keeps the highest value card
    const pool = this.state.chancellorPool
    let keepIndex = 0
    for (let i = 1; i < pool.length; i++) {
      if (pool[i].value > pool[keepIndex].value) keepIndex = i
      // Avoid keeping Princess if possible
      if (pool[keepIndex].name === 'Princess' && pool[i].name !== 'Princess') keepIndex = i
    }
    this.applyChancellorKeep(keepIndex)
  }

  private handleChancellorKeep(conn: Party.Connection, keepIndex: number) {
    const playerId = this.state.connToPlayerId[conn.id]
    if (playerId !== this.state.chancellorActorId) return this.sendError(conn, 'Not your Chancellor choice')
    if (this.state.game.phase !== 'chancellor') return
    this.applyChancellorKeep(keepIndex)
  }

  private applyChancellorKeep(keepIndex: number) {
    const pool = this.state.chancellorPool
    if (keepIndex < 0 || keepIndex >= pool.length) return

    const actorId = this.state.chancellorActorId!
    const kept = pool[keepIndex]
    const discarded = pool.filter((_, i) => i !== keepIndex)

    this.state.deck.unshift(...discarded)
    this.state.playerHands[actorId] = [kept]

    this.state.game.players = this.state.game.players.map(p =>
      p.id === actorId ? { ...p, hand: [kept] } : p,
    )

    this.state.game.phase = 'playing'
    this.state.game.chancellorOptions = null
    this.state.chancellorPool = []
    this.state.chancellorActorId = null
    this.state.game.deckCount = this.state.deck.length
    this.state.game.lastAction += ` → kept a card, put ${discarded.length} back`

    if (checkRoundEnd(this.state.game.players, this.state.deck.length)) {
      this.endRound()
      return
    }

    this.advanceTurn()
  }

  private advanceTurn() {
    const next = nextActivePlayerIndex(this.state.game.players, this.state.game.currentPlayerIndex)
    this.state.game.players = this.state.game.players.map((p, i) =>
      i === next ? { ...p, isProtected: false } : p,
    )
    this.state.game.currentPlayerIndex = next
    this.drawForCurrentPlayer()
  }

  private endRound() {
    this.state.game.phase = 'roundEnd'
    this.state.game.drawnCard = null

    const handsMap = new Map(Object.entries(this.state.playerHands))
    const winner = getRoundWinner(this.state.game.players, handsMap)
    const spyBonusIds = checkSpyBonus(this.state.game.players)

    this.state.game.players = this.state.game.players.map(p => {
      let tokens = p.tokens
      if (p.id === winner?.id) tokens += 1
      if (spyBonusIds.includes(p.id)) tokens += 1
      return { ...p, tokens }
    })

    if (winner) this.state.game.roundWinner = winner.name

    const needed = tokensToWin(this.state.game.players.length)
    const gameWinner = this.state.game.players.find(p => p.tokens >= needed)

    if (gameWinner) {
      this.state.game.phase = 'gameOver'
      this.state.game.winner = gameWinner.name
      this.state.game.lastAction = `${gameWinner.name} wins the game with ${gameWinner.tokens} tokens!`
    } else {
      const spyMsg = spyBonusIds.length > 0
        ? ` (Spy bonus → ${this.state.game.players.find(p => p.id === spyBonusIds[0])?.name})`
        : ''
      this.state.game.lastAction = winner
        ? `${winner.name} wins the round!${spyMsg}`
        : `Round ended — no winner${spyMsg}`
    }

    this.broadcast()
  }

  private handleNextRound(conn: Party.Connection) {
    const playerId = this.state.connToPlayerId[conn.id]
    const player = this.state.game.players.find(p => p.id === playerId)
    if (!player?.isHost) return this.sendError(conn, 'Only the host can start the next round')
    if (this.state.game.phase !== 'roundEnd') return
    this.startNewRound()
  }
}
