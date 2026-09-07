import type { Match, Player, Tournament } from '../types'
import type { MatchIdGenerator } from './roundRobinPairings'

export function swissPairings(tournament: Tournament, round: number, standings: Player[], createId: MatchIdGenerator): Match[] {
  const played = new Set(tournament.matches.filter(match => match.result && !match.bye).map(match => [match.white, match.black].sort().join('|')))
  const remaining = standings.map(player => player.id)
  const matches: Match[] = []
  let table = 1

  while (remaining.length) {
    const first = remaining.shift()!
    let opponentIndex = remaining.findIndex(opponent => !played.has([first, opponent].sort().join('|')))
    if (opponentIndex < 0) opponentIndex = 0
    const second = remaining.splice(opponentIndex, 1)[0]
    if (!second) {
      matches.push({ id: createId(), round, table, white: first, black: 'BYE', bye: true })
      break
    }
    const firstScore = standings.find(player => player.id === first)?.score ?? 0
    const secondScore = standings.find(player => player.id === second)?.score ?? 0
    const [white, black] = firstScore <= secondScore ? [first, second] : [second, first]
    matches.push({ id: createId(), round, table, white, black })
    table++
  }
  return matches
}
