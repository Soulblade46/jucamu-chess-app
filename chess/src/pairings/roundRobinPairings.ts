import type { Match, Player } from '../types'

export type MatchIdGenerator = () => string

export function roundRobinPairings(players: Player[], round: number, createId: MatchIdGenerator): Match[] {
  const list = players.map(player => player.id)
  if (list.length % 2) list.push('BYE')
  const fixed = list[0]
  const rest = list.slice(1)
  const shift = (round - 1) % rest.length
  const arrangement = [fixed, ...rest.slice(shift), ...rest.slice(0, shift)]
  const matches: Match[] = []

  for (let index = 0; index < arrangement.length / 2; index++) {
    let white = arrangement[index]
    let black = arrangement[arrangement.length - 1 - index]
    if (white === 'BYE' || black === 'BYE') {
      const player = white === 'BYE' ? black : white
      matches.push({ id: createId(), round, table: index + 1, white: player, black: 'BYE', bye: true })
      continue
    }
    if ((round + index) % 2) [white, black] = [black, white]
    matches.push({ id: createId(), round, table: index + 1, white, black })
  }
  return matches
}
