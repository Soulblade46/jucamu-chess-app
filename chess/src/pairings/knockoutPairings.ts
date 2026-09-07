import type { Match, Tournament } from '../types'
import type { MatchIdGenerator } from './roundRobinPairings'

export function knockoutPairings(tournament: Tournament, round: number, createId: MatchIdGenerator): Match[] {
  const previous = round === 1 ? tournament.players.map(player => player.id) : tournament.matches.filter(match => match.round === round - 1 && match.result).map(match => match.result === 'white' ? match.white : match.black).filter(id => id !== 'BYE')
  const list = [...previous]
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, list.length)))
  while (list.length < size) list.push('BYE')
  const matches: Match[] = []

  for (let index = 0; index < list.length; index += 2) {
    const first = list[index]
    const second = list[index + 1]
    if (first === 'BYE' || second === 'BYE') matches.push({ id: createId(), round, table: index / 2 + 1, white: first === 'BYE' ? second : first, black: 'BYE', bye: true })
    else matches.push({ id: createId(), round, table: index / 2 + 1, white: first, black: second })
  }
  return matches
}
